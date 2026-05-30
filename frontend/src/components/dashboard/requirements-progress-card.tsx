import { motion } from 'framer-motion';
import { CheckCircle2, Circle, HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/utils/cn';
import type { StageConfig } from '@/types/hackathon';
import type { Team } from '@/types/team';
import type { Submission } from '@/types/submission';

interface RequirementField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
}

interface RequirementsProgressCardProps {
  stage: StageConfig | null;
  team: Team | null;
  submissions: Submission[];
}

export function RequirementsProgressCard({ stage, team, submissions }: RequirementsProgressCardProps) {
  if (!stage || !team) {
    return (
      <Card className="p-5">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bg-elevated">
            <HelpCircle className="h-6 w-6 text-text-muted" />
          </div>
          <h3 className="font-semibold text-text-primary">Stage Requirements</h3>
          <p className="mt-1 text-sm text-text-muted">
            {!stage ? 'No active stage yet' : 'Form a team to start submitting'}
          </p>
        </div>
      </Card>
    );
  }

  const rawReqs = stage.requirements;
  const requirements: RequirementField[] = Array.isArray(rawReqs) ? rawReqs as RequirementField[] : [];

  if (requirements.length === 0) {
    return (
      <Card className="p-5">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bg-elevated">
            <CheckCircle2 className="h-6 w-6 text-text-muted" />
          </div>
          <h3 className="font-semibold text-text-primary">No Requirements</h3>
          <p className="mt-1 text-sm text-text-muted">
            This stage has no submission requirements configured
          </p>
        </div>
      </Card>
    );
  }

  const stageSubmission = submissions.find((s) => s.stageId === stage.id);
  const submissionData = stageSubmission?.data as Record<string, unknown> | null ?? {};

  const completedCount = requirements.filter((req) => {
    const val = submissionData[req.key];
    return val !== undefined && val !== null && val !== '';
  }).length;

  const percentage = Math.round((completedCount / requirements.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium uppercase tracking-wider text-text-muted">
            Requirements Progress
          </h3>
          <span className="text-xs font-medium text-text-muted">
            {completedCount}/{requirements.length}
          </span>
        </div>

        <Progress value={percentage} className="mb-4" variant="gradient" />

        <div className="space-y-2">
          {requirements.map((req) => {
            const hasValue = submissionData[req.key] !== undefined && submissionData[req.key] !== null && submissionData[req.key] !== '';
            return (
              <div
                key={req.key}
                className={cn(
                  'flex items-center gap-3 rounded-lg p-2 transition-colors',
                  hasValue ? 'bg-accent/5' : 'bg-bg-elevated/50',
                )}
              >
                {hasValue ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-text-muted" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm', hasValue ? 'text-text-primary' : 'text-text-muted')}>
                    {req.label}
                  </p>
                  <p className="text-xs text-text-muted">
                    {req.required ? 'Required' : 'Optional'}
                    {' · '}
                    {req.type}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}
