import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowRight, Calendar, Clock, DollarSign, Users,
  CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { hackathonService } from '@/services/hackathons';
import { registrationService } from '@/services/registrations';
import { useAuthStore } from '@/stores/auth-store';
import { HackathonHero } from '@/components/hackathon/hackathon-hero';
import { StagesTab } from '@/components/hackathon/stages-tab';
import { RulesTab } from '@/components/hackathon/rules-tab';
import { PrizesTab } from '@/components/hackathon/prizes-tab';
import { ProblemStatementsTab } from '@/components/hackathon/problem-statements-tab';
import { AnnouncementsTab } from '@/components/hackathon/announcements-tab';
import { StageTimeline } from '@/components/dashboard/stage-timeline';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/shared/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { buildStageTimeline, timeUntil, isUrgent } from '@/utils/dashboard-utils';
import type { Hackathon, StageConfig, Rule, Prize, ProblemStatement, Announcement } from '@/types/hackathon';
import type { Registration } from '@/types/registration';

interface HackathonData {
  hackathon: Hackathon;
  stages: StageConfig[];
  rules: Rule[];
  prizes: Prize[];
  problemStatements: ProblemStatement[];
  announcements: Announcement[];
}

function fetchHackathonData(slug: string): Promise<HackathonData> {
  return hackathonService.getBySlug(slug).then(async (res) => {
    const hackathon: Hackathon = res.data ?? (res as unknown as Hackathon);
    const hid = hackathon.id;
    const [stagesRes, rulesRes, prizesRes, psRes, annRes] = await Promise.all([
      hackathonService.stages.list(hid),
      hackathonService.rules.list(hid),
      hackathonService.prizes.list(hid),
      hackathonService.problemStatements.list(hid),
      hackathonService.announcements.list(hid),
    ]);
    return {
      hackathon,
      stages: (stagesRes.data ?? stagesRes) as StageConfig[],
      rules: (rulesRes.data ?? rulesRes) as Rule[],
      prizes: (prizesRes.data ?? prizesRes) as Prize[],
      problemStatements: (psRes.data ?? psRes) as ProblemStatement[],
      announcements: (annRes.data ?? annRes) as Announcement[],
    };
  });
}

function RegistrationBanner({
  registration,
  hackathon,
}: {
  registration: Registration | null;
  hackathon: Hackathon;
}) {
  const now = new Date();
  const regOpen = now >= new Date(hackathon.registrationStartDate) && now <= new Date(hackathon.registrationEndDate);
  const regClosed = now > new Date(hackathon.registrationEndDate);

  if (registration?.status === 'APPROVED') {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm text-success">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        You are registered and approved for this hackathon.
      </div>
    );
  }

  if (registration?.status === 'PENDING_APPROVAL') {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning">
        <Clock className="h-4 w-4 shrink-0" />
        Your registration is pending approval.
      </div>
    );
  }

  if (registration?.status === 'PENDING_PAYMENT') {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        Payment pending. Complete your registration payment.
      </div>
    );
  }

  if (regClosed) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-error-bg p-3 text-sm text-error">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        Registration is closed.
      </div>
    );
  }

  if (regOpen) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-accent/5 p-3 text-sm text-accent">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Registration is open.{' '}
        {isUrgent(hackathon.registrationEndDate) && (
          <span className="font-medium">Closes in {timeUntil(hackathon.registrationEndDate)}!</span>
        )}
      </div>
    );
  }

  return null;
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [now, setNow] = useState(Date.now());
  const target = new Date(targetDate).getTime();
  const diff = target - now;

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (diff <= 0) return <span className="text-error font-medium">Closed</span>;

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  return (
    <div className="flex gap-2 text-center">
      {[{ v: days, l: 'Days' }, { v: hours, l: 'Hrs' }, { v: mins, l: 'Min' }, { v: secs, l: 'Sec' }].map((unit) => (
        <div key={unit.l} className="flex flex-col items-center">
          <span className="text-2xl font-bold text-text-primary tabular-nums">{String(unit.v).padStart(2, '0')}</span>
          <span className="text-[10px] uppercase text-text-muted">{unit.l}</span>
        </div>
      ))}
    </div>
  );
}

export function HackathonDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['hackathon-detail', slug],
    queryFn: () => fetchHackathonData(slug!),
    enabled: !!slug,
    retry: 1,
  });

  const { data: myRegs } = useQuery({
    queryKey: ['my-registrations', data?.hackathon?.id],
    queryFn: () => registrationService.my().then((r) => (r.data ?? r) as Registration[]),
    enabled: !!data?.hackathon?.id && isAuthenticated,
  });

  const registration = myRegs?.find((r) => r.hackathonId === data?.hackathon?.id) ?? null;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 space-y-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-12 w-96" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <ErrorState
          title="Failed to load hackathon"
          message={(error as Error)?.message ?? 'Hackathon not found'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const { hackathon, stages, rules, prizes, problemStatements, announcements } = data;
  const timelineItems = buildStageTimeline(null, stages);
  const totalPrizePool = prizes.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <HackathonHero hackathon={hackathon} />

      <RegistrationBanner registration={registration} hackathon={hackathon} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Card className="p-4 text-center">
          <Calendar className="mx-auto h-5 w-5 text-accent mb-1" />
          <p className="text-xs text-text-muted">Registration Closes</p>
          {new Date(hackathon.registrationEndDate) > new Date() ? (
            <CountdownTimer targetDate={hackathon.registrationEndDate} />
          ) : (
            <p className="text-sm font-medium text-error mt-1">Closed</p>
          )}
        </Card>

        <Card className="p-4 text-center">
          <DollarSign className="mx-auto h-5 w-5 text-accent mb-1" />
          <p className="text-xs text-text-muted">Prize Pool</p>
          <p className="text-2xl font-bold text-text-primary">
            ${totalPrizePool.toLocaleString()}
          </p>
          <p className="text-xs text-text-muted mt-0.5">{prizes.length} prize{prizes.length !== 1 ? 's' : ''}</p>
        </Card>

        <Card className="p-4 text-center">
          <Users className="mx-auto h-5 w-5 text-accent mb-1" />
          <p className="text-xs text-text-muted">Team Requirements</p>
          <p className="text-lg font-bold text-text-primary">
            {hackathon.minTeamSize}–{hackathon.maxTeamSize}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {hackathon.allowSoloRegistration ? 'Solo allowed' : 'Team required'}
          </p>
        </Card>

        <Card className="p-4 text-center">
          <Clock className="mx-auto h-5 w-5 text-accent mb-1" />
          <p className="text-xs text-text-muted">Duration</p>
          <p className="text-lg font-bold text-text-primary">
            {Math.ceil((new Date(hackathon.endDate).getTime() - new Date(hackathon.startDate).getTime()) / 86400000)} days
          </p>
          <p className="text-xs text-text-muted mt-0.5">{stages.length} stage{stages.length !== 1 ? 's' : ''}</p>
        </Card>
      </motion.div>

      {stages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-6"
        >
          <Card className="p-5">
            <StageTimeline items={timelineItems} />
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="text-sm text-text-muted">
          {stages.length} stage{stages.length !== 1 ? 's' : ''} · {rules.length} rule{rules.length !== 1 ? 's' : ''} · {prizes.length} prize{prizes.length !== 1 ? 's' : ''} · {problemStatements.length} problem{problemStatements.length !== 1 ? 's' : ''}
        </p>
        {!registration && (
          <Button
            size="lg"
            className="gap-2 bg-gradient-to-r from-accent to-pink hover:opacity-90 w-full sm:w-auto"
            onClick={() => {
              if (isAuthenticated) {
                navigate(`/hackathons/${slug}/register`);
              } else {
                navigate('/auth/login', { state: { from: `/hackathons/${slug}` } });
              }
            }}
          >
            Register Now <ArrowRight className="h-5 w-5" />
          </Button>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-8"
      >
        <Tabs defaultValue="stages">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="stages">Stages</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="prizes">Prizes</TabsTrigger>
            <TabsTrigger value="problems">Problems</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
          </TabsList>
          <TabsContent value="stages"><StagesTab stages={stages} /></TabsContent>
          <TabsContent value="rules"><RulesTab rules={rules} /></TabsContent>
          <TabsContent value="prizes"><PrizesTab prizes={prizes} /></TabsContent>
          <TabsContent value="problems"><ProblemStatementsTab statements={problemStatements} /></TabsContent>
          <TabsContent value="announcements"><AnnouncementsTab announcements={announcements} /></TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
