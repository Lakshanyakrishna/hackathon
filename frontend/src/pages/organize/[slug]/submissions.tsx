import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Search, RefreshCw, Eye, Filter, CheckCircle2,
  Clock, AlertTriangle, Loader2, Users, FileText, BarChart3,
  Rocket, ExternalLink,
} from 'lucide-react';
import { useState } from 'react';
import { submissionService } from '@/services/submissions';
import { hackathonService } from '@/services/hackathons';
import { promotionService } from '@/services/promotions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Loading } from '@/components/shared/loading';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import type { Submission } from '@/types/submission';
import type { Hackathon, StageConfig } from '@/types/hackathon';
import type { LeaderboardEntry } from '@/types/score';

export function SubmissionsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');

  const { data: hackathon } = useQuery({
    queryKey: ['hackathon', slug],
    queryFn: () => hackathonService.getBySlug(slug!).then((r) => (r.data ?? r) as Hackathon),
    enabled: !!slug,
  });

  const { data: stages } = useQuery({
    queryKey: ['hackathon-stages', hackathon?.id],
    queryFn: () => hackathonService.stages.list(hackathon!.id).then((r) => (r.data ?? r) as StageConfig[]),
    enabled: !!hackathon?.id,
  });

  const { data: submissions, isLoading, isError, refetch } = useQuery({
    queryKey: ['submissions', hackathon?.id],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (stageFilter !== 'all' && stageFilter) params.stageId = stageFilter;
      if (search) params.search = search;
      return submissionService.list(params).then((r) => (r.data ?? r) as Submission[]);
    },
    enabled: !!hackathon?.id,
  });

  const stagesSorted = stages?.sort((a, b) => a.order - b.order) ?? [];

  const totalTeams = submissions?.length ?? 0;
  const submittedTeams = submissions?.filter((s) => s.status === 'SUBMITTED' || s.status === 'LOCKED').length ?? 0;
  const draftTeams = submissions?.filter((s) => s.status === 'DRAFT').length ?? 0;
  const submissionRate = totalTeams > 0 ? Math.round((submittedTeams / totalTeams) * 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (isError || !hackathon) {
    return (
      <ErrorState title="Failed to load submissions" onRetry={() => refetch()} />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Submissions</h1>
          <p className="text-sm text-text-muted mt-1">{hackathon.title}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Analytics cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Teams', value: totalTeams, icon: Users, color: 'text-accent' },
          { label: 'Submitted', value: submittedTeams, icon: CheckCircle2, color: 'text-success' },
          { label: 'Drafts', value: draftTeams, icon: FileText, color: 'text-warning' },
          { label: 'Submission Rate', value: `${submissionRate}%`, icon: BarChart3, color: 'text-accent' },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 text-center">
            <stat.icon className={cn('mx-auto h-5 w-5 mb-1', stat.color)} />
            <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
            <p className="text-xs text-text-muted">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by team or stage..."
            className="pl-9"
          />
        </div>
        {stagesSorted.map((s) => (
          <Button
            key={s.id}
            variant={stageFilter === s.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStageFilter(stageFilter === s.id ? 'all' : s.id)}
          >
            {s.name}
          </Button>
        ))}
        {stageFilter !== 'all' && (
          <Button variant="ghost" size="sm" onClick={() => setStageFilter('all')}>
            Clear
          </Button>
        )}
      </div>

      {/* Stage completion bars */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stagesSorted.map((stage) => {
          const stageSubs = submissions?.filter((s) => s.stageId === stage.id) ?? [];
          const stageSubmitted = stageSubs.filter((s) => s.status !== 'DRAFT').length;
          const stagePct = stageSubs.length > 0 ? Math.round((stageSubmitted / stageSubs.length) * 100) : 0;
          return (
            <Card key={stage.id} className="p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-text-primary">{stage.name}</span>
                <span className="text-xs text-text-muted">{stageSubmitted}/{stageSubs.length}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-bg-elevated">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-pink transition-all"
                  style={{ width: `${stagePct}%` }}
                />
              </div>
              <p className="text-[10px] text-text-muted mt-1">{stagePct}% complete</p>
            </Card>
          );
        })}
      </div>

      {/* Submission list */}
      {submissions && submissions.length === 0 ? (
        <EmptyState title="No submissions yet" description="Submissions will appear when teams start submitting." />
      ) : (
        <div className="space-y-2">
          {submissions?.map((sub, i) => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <Card className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/5">
                    <FileText className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-text-primary">
                        {sub.team?.name ?? 'Unknown Team'}
                      </span>
                      <Badge
                        variant={sub.status === 'LOCKED' ? 'accent' : sub.status === 'SUBMITTED' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {sub.status}
                      </Badge>
                      <span className="text-xs text-text-muted">
                        {sub.stage?.name ?? 'Unknown Stage'} · v{sub.version}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-text-muted">
                      <span>Submitted {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '—'}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      onClick={() => navigate(`/submissions/${sub.id}`)}
                    >
                      <Eye className="h-4 w-4" /> View
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
