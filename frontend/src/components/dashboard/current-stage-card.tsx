import { motion } from 'framer-motion';
import { Clock, ChevronRight, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { timeUntil, isUrgent } from '@/utils/dashboard-utils';
import type { StageConfig } from '@/types/hackathon';
import type { Team } from '@/types/team';
import type { Submission } from '@/types/submission';

interface CurrentStageCardProps {
  stage: StageConfig | null;
  team: Team | null;
  submissions: Submission[];
}

export function CurrentStageCard({ stage, team, submissions }: CurrentStageCardProps) {
  if (!stage || !team) {
    return (
      <Card className="p-5">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bg-elevated">
            <Clock className="h-6 w-6 text-text-muted" />
          </div>
          <h3 className="font-semibold text-text-primary">No Active Stage</h3>
          <p className="mt-1 text-sm text-text-muted max-w-xs">
            {team && team.status === 'LOCKED'
              ? 'Your team is locked. Waiting for the admin to promote you to a stage.'
              : 'Join or create a team to start participating in stages.'}
          </p>
        </div>
      </Card>
    );
  }

  const stageSubmission = submissions.find((s) => s.stageId === stage.id);
  const endDate = stage.endDate;
  const urgent = endDate ? isUrgent(endDate) : false;
  const overdue = endDate ? new Date(endDate) < new Date() : false;
  const submitted = stageSubmission && stageSubmission.status !== 'DRAFT';

  let progressValue = 0;
  if (submitted && stageSubmission) {
    progressValue = stageSubmission.status === 'LOCKED' ? 100 : stageSubmission.status === 'SUBMITTED' ? 80 : 30;
  } else if (stageSubmission) {
    progressValue = 20;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="overflow-hidden">
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                Current Stage
              </p>
              <h3 className="mt-1 text-xl font-bold text-text-primary">{stage.name}</h3>
              {stage.description && (
                <p className="mt-1 text-sm text-text-muted line-clamp-1">{stage.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {overdue ? (
                <Badge variant="error">Overdue</Badge>
              ) : urgent ? (
                <Badge variant="warning">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Due soon
                </Badge>
              ) : endDate ? (
                <Badge variant="accent">Active</Badge>
              ) : (
                <Badge variant="accent">Active</Badge>
              )}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Progress</span>
                <span className="font-medium text-text-primary">
                  {submitted ? (stageSubmission!.status === 'LOCKED' ? 'Locked' : 'Submitted') : 'Not started'}
                </span>
              </div>
              <Progress value={progressValue} className="mt-1.5" variant="gradient" />
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              {endDate && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-text-muted" />
                  <span className={urgent || overdue ? 'text-warning font-medium' : 'text-text-secondary'}>
                    {overdue ? 'Deadline passed' : `${timeUntil(endDate)} remaining`}
                  </span>
                </div>
              )}
              {stage.evaluationCriteria && stage.evaluationCriteria.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <ChevronRight className="h-4 w-4 text-text-muted" />
                  <span className="text-text-secondary">{stage.evaluationCriteria.length} criteria</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
