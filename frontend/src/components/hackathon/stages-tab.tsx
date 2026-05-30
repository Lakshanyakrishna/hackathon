import { motion } from 'framer-motion';
import { Clock, CheckCircle2, Circle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import type { StageConfig } from '@/types/hackathon';

interface StagesTabProps {
  stages: StageConfig[];
}

export function StagesTab({ stages }: StagesTabProps) {
  if (stages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Clock className="h-12 w-12 text-text-muted mb-3" />
        <h3 className="font-semibold text-text-primary">No Stages Yet</h3>
        <p className="mt-1 text-sm text-text-muted">Stages will be published soon.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stages.map((stage, i) => {
        const now = new Date();
        const started = stage.startDate ? new Date(stage.startDate) <= now : false;
        const ended = stage.endDate ? new Date(stage.endDate) < now : false;

        return (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card className={cn(
              'p-5 transition-all duration-300',
              started && !ended && 'border-accent/30 bg-accent/[0.02]',
              ended && 'opacity-75',
            )}>
              <div className="flex items-start gap-4">
                <div className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                  ended ? 'bg-accent/10' : started ? 'bg-accent/20' : 'bg-bg-elevated',
                )}>
                  {ended ? (
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                  ) : started ? (
                    <Circle className="h-5 w-5 text-accent" />
                  ) : (
                    <Circle className="h-5 w-5 text-text-muted" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-text-primary">
                      Stage {stage.order}: {stage.name}
                    </h4>
                    {ended && <Badge variant="default" size="sm">Ended</Badge>}
                    {started && !ended && <Badge variant="success" size="sm">Active</Badge>}
                    {!started && <Badge variant="accent" size="sm">Upcoming</Badge>}
                  </div>

                  {stage.description && (
                    <p className="mt-1 text-sm text-text-muted">{stage.description}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-text-muted">
                    {stage.startDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Starts: {new Date(stage.startDate).toLocaleDateString()}
                      </span>
                    )}
                    {stage.endDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Ends: {new Date(stage.endDate).toLocaleDateString()}
                      </span>
                    )}
                    {stage.evaluationCriteria && stage.evaluationCriteria.length > 0 && (
                      <span>{stage.evaluationCriteria.length} criteria</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
