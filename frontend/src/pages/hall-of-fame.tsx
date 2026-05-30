import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Users } from 'lucide-react';
import { hackathonService } from '@/services/hackathons';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import type { Hackathon } from '@/types/hackathon';

export function HallOfFamePage() {
  const { data: hackathons, isLoading, isError, refetch } = useQuery({
    queryKey: ['hackathons', 'completed'],
    queryFn: () => hackathonService.list({ status: 'COMPLETED' }).then((r) => (r.data ?? r) as Hackathon[]),
  });

  const completedHackathons = hackathons ?? [];

  if (isError) {
    return (
      <ErrorState
        title="Failed to load hall of fame"
        message="Could not load completed hackathons. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl py-12 px-4">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl py-8 sm:py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 sm:space-y-12">
        {/* Header */}
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
          <EmptyState
            icon={<Trophy className="h-12 w-12" />}
            title="No completed hackathons yet"
            description="Completed hackathons with winners will appear here."
          />
        ) : (
          <div className="space-y-8">
            {completedHackathons.map((hackathon, hi) => (
              <motion.div
                key={hackathon.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: hi * 0.1 }}
              >
                <Card className="overflow-hidden">
                  <div className="bg-gradient-to-r from-accent/5 to-pink/5 px-6 py-4 border-b border-border">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h2 className="text-lg font-semibold text-text-primary">{hackathon.title}</h2>
                        <p className="text-xs text-text-muted">{new Date(hackathon.startDate).toLocaleDateString()} – {new Date(hackathon.endDate).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="accent" size="sm">{hackathon.mode}</Badge>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-text-muted mb-4">Winners have not been declared for this hackathon yet.</p>
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <Users className="h-4 w-4" />
                      <span>Connect winners to showcase them here.</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
