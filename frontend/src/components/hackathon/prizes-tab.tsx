import { motion } from 'framer-motion';
import { Trophy, Medal, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { Prize } from '@/types/hackathon';

interface PrizesTabProps {
  prizes: Prize[];
}

const positionIcons: Record<number, React.ElementType> = {
  1: Trophy,
  2: Medal,
  3: Award,
};

const positionColors: Record<number, string> = {
  1: 'from-warning/20 to-yellow-500/10',
  2: 'from-slate-300/20 to-slate-400/10',
  3: 'from-amber-600/20 to-amber-700/10',
};

const iconColors: Record<number, string> = {
  1: 'text-warning',
  2: 'text-slate-400',
  3: 'text-amber-600',
};

export function PrizesTab({ prizes }: PrizesTabProps) {
  if (prizes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Trophy className="h-12 w-12 text-text-muted mb-3" />
        <h3 className="font-semibold text-text-primary">No Prizes Announced</h3>
        <p className="mt-1 text-sm text-text-muted">Prize details will be announced soon.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {prizes.map((prize, i) => {
        const Icon = positionIcons[prize.position] ?? Trophy;
        const colorClass = positionColors[prize.position] ?? 'from-accent/10 to-teal-light/10';
        const iconColor = iconColors[prize.position] ?? 'text-accent';

        return (
          <motion.div
            key={prize.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className={`bg-gradient-to-br ${colorClass} p-6 text-center`}>
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bg-surface/50">
                <Icon className={`h-6 w-6 ${iconColor}`} />
              </div>
              <p className="text-2xl font-bold text-text-primary">
                ${parseFloat(prize.amount).toLocaleString()}
              </p>
              {prize.title && (
                <p className="mt-1 text-sm font-medium text-text-secondary">{prize.title}</p>
              )}
              <p className="mt-2 text-xs text-text-muted">Position #{prize.position}</p>
              {prize.description && (
                <p className="mt-2 text-xs text-text-muted">{prize.description}</p>
              )}
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
