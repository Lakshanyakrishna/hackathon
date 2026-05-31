import { motion } from 'framer-motion';
import { Clock, User, FileText, ChevronRight, Circle, CheckCircle2, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import type { Submission } from '@/types/submission';

interface SubmissionHistoryProps {
  versions: Submission[];
  currentVersion: Submission;
  onViewVersion: (id: string) => void;
}

export function SubmissionHistory({ versions, currentVersion, onViewVersion }: SubmissionHistoryProps) {
  const all = [currentVersion, ...versions.filter((v) => v.id !== currentVersion.id)].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (all.length <= 1) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-4 w-4 text-text-muted" />
          <h3 className="text-sm font-medium uppercase tracking-wider text-text-muted">Version History</h3>
        </div>
        <div className="flex flex-col items-center py-6 text-center">
          <p className="text-sm text-text-muted">No previous versions</p>
          <p className="text-xs text-text-muted mt-1">This is the first submission</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-4 w-4 text-text-muted" />
        <h3 className="text-sm font-medium uppercase tracking-wider text-text-muted">
          Version History ({all.length})
        </h3>
      </div>

      <div className="space-y-2">
        {all.map((v, i) => {
          const isCurrent = v.id === currentVersion.id;
          const isLast = i === all.length - 1;

          return (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                    isCurrent ? 'bg-accent/20' : 'bg-bg-elevated',
                  )}>
                    {isCurrent ? (
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-text-muted" />
                    )}
                  </div>
                  {!isLast && <div className="w-0.5 flex-1 bg-border mt-1" />}
                </div>

                <div className={cn(
                  'flex-1 min-w-0 pb-4',
                  isLast && 'pb-0',
                )}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      'text-sm font-medium',
                      isCurrent ? 'text-text-primary' : 'text-text-secondary',
                    )}>
                      Version {v.version}
                    </span>
                    <Badge
                      variant={v.status === 'LOCKED' ? 'accent' : v.status === 'SUBMITTED' ? 'success' : 'neutral'}
                      size="sm"
                    >
                      {v.status === 'LOCKED' ? <Lock className="h-3 w-3 mr-0.5" /> : null}
                      {v.status}
                    </Badge>
                    {isCurrent && <Badge variant="accent" size="sm">Current</Badge>}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(v.createdAt).toLocaleString()}
                    </span>
                    {v.submittedBy && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {v.submittedBy === currentVersion.submittedBy ? 'You' : v.submittedBy}
                      </span>
                    )}
                  </div>

                  {!isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1.5 gap-1 text-xs h-7"
                      onClick={() => onViewVersion(v.id)}
                    >
                      View <ChevronRight className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
