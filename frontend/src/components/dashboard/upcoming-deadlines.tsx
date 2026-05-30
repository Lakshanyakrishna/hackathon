import { motion } from 'framer-motion';
import { Clock, Calendar, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { timeUntil, isUrgent } from '@/utils/dashboard-utils';
import type { StageConfig } from '@/types/hackathon';
import type { Registration } from '@/types/registration';

interface UpcomingDeadlinesProps {
  stages: StageConfig[];
  registration: Registration | null;
}

export function UpcomingDeadlines({ stages, registration }: UpcomingDeadlinesProps) {
  const deadlines: { id: string; title: string; date: string; type: string; isUrgent: boolean }[] = [];

  if (registration?.status === 'PENDING_PAYMENT') {
    deadlines.push({
      id: 'payment',
      title: 'Complete Payment',
      date: new Date(Date.now() + 86400000 * 3).toISOString(),
      type: 'payment',
      isUrgent: true,
    });
  }

  if (registration?.status === 'PENDING_APPROVAL') {
    deadlines.push({
      id: 'approval',
      title: 'Approval Decision',
      date: new Date(Date.now() + 86400000 * 7).toISOString(),
      type: 'registration',
      isUrgent: false,
    });
  }

  for (const stage of stages) {
    if (stage.endDate) {
      deadlines.push({
        id: stage.id,
        title: `${stage.name} Deadline`,
        date: stage.endDate,
        type: 'stage_end',
        isUrgent: isUrgent(stage.endDate),
      });
    }
  }

  const upcoming = deadlines
    .filter((d) => new Date(d.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  if (upcoming.length === 0) {
    return (
      <Card className="p-5">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bg-elevated">
            <Calendar className="h-6 w-6 text-text-muted" />
          </div>
          <h3 className="font-semibold text-text-primary">No Upcoming Deadlines</h3>
          <p className="mt-1 text-sm text-text-muted">Enjoy the calm before the storm</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-text-muted" />
        <h3 className="text-sm font-medium uppercase tracking-wider text-text-muted">Upcoming Deadlines</h3>
      </div>

      <div className="space-y-2">
        {upcoming.map((deadline, i) => (
          <motion.div
            key={deadline.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-bg-elevated"
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
              deadline.isUrgent ? 'bg-warning/10' : 'bg-accent/10'
            }`}>
              {deadline.isUrgent ? (
                <AlertTriangle className="h-4 w-4 text-warning" />
              ) : (
                <Clock className="h-4 w-4 text-accent" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{deadline.title}</p>
              <p className="text-xs text-text-muted">{new Date(deadline.date).toLocaleDateString()}</p>
            </div>
            <span className={`text-xs font-medium shrink-0 ${
              deadline.isUrgent ? 'text-warning' : 'text-text-muted'
            }`}>
              {timeUntil(deadline.date)}
            </span>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
