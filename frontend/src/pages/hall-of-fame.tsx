import { useQuery, useQueries } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award } from 'lucide-react';
import { hackathonService } from '@/services/hackathons';
import { winnerService } from '@/services/winners';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import type { Hackathon } from '@/types/hackathon';
import type { Winner } from '@/types/winner';
import { unwrapData } from '@/utils/unwrap-data';

export function HallOfFamePage() {
  const { data: hackathonsRaw, isLoading, isError, refetch } = useQuery({
    queryKey: ['hackathons', 'completed'],
    queryFn: () => hackathonService.list({ status: 'COMPLETED' }).then((r) => unwrapData<Hackathon[]>(r)),
  });

  const completedHackathons = (Array.isArray(hackathonsRaw) ? hackathonsRaw : []) as Hackathon[];

  const winnerQueries = useQueries({
    queries: completedHackathons.map((h) => ({
      queryKey: ['winners', h.id],
      queryFn: () => winnerService.list(h.id).then((r) => (Array.isArray(r.data) ? r.data : []) as Winner[]),
      enabled: completedHackathons.length > 0,
    })),
  });

  if (isError) {
    return <ErrorState title="Failed to load hall of fame" onRetry={() => refetch()} />;
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl py-12 px-4">
        <Skeleton className="h-12 w-64 mb-8 mx-auto" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl py-8 sm:py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 sm:space-y-12">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="rounded-full bg-warning/10 p-3">
              <Trophy className="h-8 w-8 text-warning" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">Hall of Fame</h1>
          <p className="text-text-muted max-w-xl mx-auto">Celebrating outstanding teams across all hackathons.</p>
        </div>

        {completedHackathons.length === 0 ? (
          <EmptyState icon={<Trophy className="h-12 w-12" />} title="No completed hackathons yet" description="Completed hackathons with winners will appear here." />
        ) : (
          <div className="space-y-8">
            {completedHackathons.map((hackathon, hi) => {
              const winners = (winnerQueries[hi]?.data ?? []) as Winner[];
              return (
                <motion.div key={hackathon.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: hi * 0.1 }}>
                  <Card className="overflow-hidden">
                    <div className="bg-gradient-to-r from-accent/5 to-accent-dim/5 px-6 py-4 border-b border-border">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h2 className="text-lg font-semibold text-text-primary">{hackathon.title}</h2>
                          <p className="text-xs text-text-muted">{new Date(hackathon.startDate).toLocaleDateString()} – {new Date(hackathon.endDate).toLocaleDateString()}</p>
                        </div>
                        <Badge variant="accent" size="sm">{hackathon.mode}</Badge>
                      </div>
                    </div>
                    <div className="p-6">
                      {winners.length > 0 ? (
                        <div className="space-y-3">
                          {winners.map((w, wi) => (
                            <div key={w.id} className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning/10">
                                {wi === 0 ? <Medal className="h-4 w-4 text-warning" /> : <Award className="h-4 w-4 text-accent" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text-primary">{w.team.name}</p>
                                <p className="text-xs text-text-muted">{w.awardTitle}{w.prize?.amount && ` — ₹${parseInt(w.prize.amount).toLocaleString()}`}</p>
                              </div>
                              {w.team.members && w.team.members.length > 0 && (
                                <div className="flex -space-x-2">
                                  {w.team.members.slice(0, 4).map((m) => (
                                    <div key={m.id} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-bg-surface bg-accent/20 text-[10px] font-medium text-accent" title={m.user.name}>
                                      {m.user.name.charAt(0).toUpperCase()}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : winnerQueries[hi]?.isLoading ? (
                        <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-3/4" /></div>
                      ) : (
                        <p className="text-sm text-text-muted">Winners have not been declared for this hackathon yet.</p>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
