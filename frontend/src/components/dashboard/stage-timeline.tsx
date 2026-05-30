import { motion } from 'framer-motion';
import { Check, Circle, Lock, Dot } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { StageTimelineItem } from '@/types/dashboard';

interface StageTimelineProps {
  items: StageTimelineItem[];
}

const statusConfig = {
  completed: {
    icon: Check,
    bg: 'bg-accent',
    line: 'bg-accent',
    text: 'text-text-primary',
    dot: 'text-white',
  },
  current: {
    icon: Dot,
    bg: 'bg-accent ring-4 ring-accent/20',
    line: 'bg-accent/50',
    text: 'text-text-primary font-semibold',
    dot: 'text-white',
  },
  upcoming: {
    icon: Circle,
    bg: 'bg-bg-elevated border-2 border-border',
    line: 'bg-border',
    text: 'text-text-muted',
    dot: 'text-text-muted',
  },
  locked: {
    icon: Lock,
    bg: 'bg-bg-elevated border-2 border-border',
    line: 'bg-border',
    text: 'text-text-muted/60',
    dot: 'text-text-muted/60',
  },
};

export function StageTimeline({ items }: StageTimelineProps) {
  return (
    <div className="relative">
      <h3 className="mb-5 text-sm font-medium uppercase tracking-wider text-text-muted">
        Stage Timeline
      </h3>
      <div className="relative">
        {items.map((item, i) => {
          const config = statusConfig[item.status];
          const Icon = config.icon;
          const isLast = i === items.length - 1;

          return (
            <motion.div
              key={`${item.order}-${item.name}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="relative flex items-start gap-4 pb-6 last:pb-0"
            >
              {!isLast && (
                <div className={cn('absolute left-[15px] top-8 h-full w-0.5', config.line)} />
              )}

              <div className={cn('relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300', config.bg)}>
                <Icon className={cn('h-4 w-4', config.dot)} />
              </div>

              <div className="flex-1 pt-1 min-w-0">
                <p className={cn('text-sm', config.text)}>
                  {item.name}
                </p>
                {item.status === 'current' && (
                  <p className="mt-0.5 text-xs text-accent font-medium">In Progress</p>
                )}
                {item.endDate && item.status !== 'locked' && (
                  <p className="mt-0.5 text-xs text-text-muted">
                    {item.status === 'completed' ? 'Completed' : `Due ${new Date(item.endDate).toLocaleDateString()}`}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
