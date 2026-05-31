import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Trophy, Medal, Award, Star, Palette,
  Crown,
} from 'lucide-react';
import { winnerService } from '@/services/winners';
import { hackathonService } from '@/services/hackathons';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import type { Winner } from '@/types/winner';
import type { Hackathon } from '@/types/hackathon';

const AWARD_ORDER = ['Winner', 'Runner-Up', 'Second Runner-Up', 'Best Innovation', 'Best UI/UX'];
const awardConfig: Record<string, { icon: React.ElementType; color: string }> = {
  'Winner': { icon: Trophy, color: 'text-warning' },
  'Runner-Up': { icon: Medal, color: 'text-text-muted' },
  'Second Runner-Up': { icon: Medal, color: 'text-amber-700' },
  'Best Innovation': { icon: Star, color: 'text-accent' },
  'Best UI/UX': { icon: Palette, color: 'text-pink' },
};

export function ResultsPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: hackathon } = useQuery({
    queryKey: ['hackathon', slug],
    queryFn: () => hackathonService.getBySlug(slug!).then((r) => (r.data ?? r) as Hackathon),
    enabled: !!slug,
  });

  const { data: winners, isLoading, isError, refetch } = useQuery({
    queryKey: ['winners-public', hackathon?.id],
    queryFn: () => winnerService.list(hackathon!.id).then((r) => (r.data ?? r) as Winner[]),
    enabled: !!hackathon?.id,
  });

  if (isLoading) return <div className="mx-auto max-w-5xl py-12 px-4 space-y-6"><Skeleton className="h-12 w-64" /><Skeleton className="h-64 rounded-xl" /></div>;
  if (isError || !hackathon) return <ErrorState title="Failed to load results" onRetry={() => refetch()} />;

  const sorted = [...(winners ?? [])].sort((a, b) => {
    const ai = AWARD_ORDER.indexOf(a.awardTitle);
    const bi = AWARD_ORDER.indexOf(b.awardTitle);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return 0;
  });

  if (sorted.length === 0) {
    return (
      <div className="mx-auto max-w-5xl py-12 px-4">
        <EmptyState icon={<Trophy className="h-12 w-12" />} title="Results not yet published" description="Check back later for hackathon results." />
      </div>
    );
  }

  const mainWinner = sorted[0];

  return (
    <div className="mx-auto max-w-5xl py-8 sm:py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 sm:space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <Badge variant="accent" size="sm" className="mb-2">Results</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">{hackathon.title}</h1>
          <p className="text-text-muted max-w-xl mx-auto">Congratulations to all winners!</p>
        </div>

        {/* Grand Winner */}
        {mainWinner && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-warning/10 via-accent/5 to-warning/10 rounded-2xl" />
            <Card className="relative p-6 sm:p-8 border-warning/30 text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-warning/10 p-4">
                  <Crown className="h-10 w-10 text-warning" />
                </div>
              </div>
              <Badge variant="accent" size="sm" className="mb-2">Grand Winner</Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">{mainWinner.team.name}</h2>
              <p className="text-lg text-accent font-semibold">{mainWinner.awardTitle}</p>
              {mainWinner.prize && (
                <p className="text-sm text-text-muted mt-2">Prize: ₹{Number(mainWinner.prize.amount).toLocaleString()}</p>
              )}
              {mainWinner.team.members && (
                <div className="flex justify-center -space-x-2 mt-4">
                  {mainWinner.team.members.map((m) => (
                    <div key={m.id} className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 border-2 border-bg-surface text-xs font-medium text-accent" title={m.user.name}>
                      {m.user.name.charAt(0)}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Other winners */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.slice(1).map((winner, i) => {
            const config = awardConfig[winner.awardTitle] || { icon: Award, color: 'text-accent' };
            const Icon = config.icon;
            return (
              <motion.div
                key={winner.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <Card className="p-5 text-center h-full">
                  <div className="flex justify-center mb-3">
                    <div className={`rounded-full ${config.color}/10 p-3`}>
                      <Icon className={`h-6 w-6 ${config.color}`} />
                    </div>
                  </div>
                  <Badge variant="neutral" size="sm" className={`${config.color}`}>{winner.awardTitle}</Badge>
                  <h3 className="font-semibold text-text-primary mt-2">{winner.team.name}</h3>
                  {winner.prize && <p className="text-sm text-text-muted mt-1">₹{Number(winner.prize.amount).toLocaleString()}</p>}
                  {winner.team.members && (
                    <div className="flex justify-center -space-x-2 mt-3">
                      {winner.team.members.map((m) => (
                        <div key={m.id} className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 border-2 border-bg-surface text-[10px] font-medium text-accent" title={m.user.name}>
                          {m.user.name.charAt(0)}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
