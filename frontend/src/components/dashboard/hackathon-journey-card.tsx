import { motion } from 'framer-motion';
import { Check, Circle, X, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/utils/cn';
import type { Hackathon, StageConfig } from '@/types/hackathon';
import type { Registration } from '@/types/registration';
import type { Team } from '@/types/team';

interface HackathonJourneyCardProps {
  hackathon: Hackathon | null;
  registration: Registration | null;
  team: Team | null;
  stages: StageConfig[];
}

interface JourneyStep {
  label: string;
  status: 'done' | 'current' | 'upcoming' | 'skipped';
  icon: React.ElementType;
}

export function HackathonJourneyCard({ hackathon, registration, team, stages }: HackathonJourneyCardProps) {
  if (!hackathon) return null;

  const registered = !!registration;
  const approved = registration?.status === 'APPROVED';
  const hasTeam = !!team;
  const teamLocked = team?.status === 'LOCKED';
  const disqualified = team?.status === 'DISQUALIFIED';
  const promotedOrder = team?.promotedToStageOrder ?? 0;

  const steps: JourneyStep[] = [
    { label: 'Registered', status: registered ? 'done' : 'upcoming', icon: Check },
    { label: 'Approved', status: !registered ? 'upcoming' : approved ? 'done' : 'current', icon: approved ? Check : Circle },
    { label: 'Team Formed', status: !approved || disqualified ? 'upcoming' : hasTeam ? (teamLocked ? 'done' : 'current') : 'upcoming', icon: hasTeam ? (teamLocked ? Check : Circle) : Circle },
    ...stages.map((s) => ({
      label: s.name,
      status: (disqualified ? 'skipped' : s.order < promotedOrder ? 'done' : s.order === promotedOrder ? 'current' : 'upcoming') as JourneyStep['status'],
      icon: s.order < promotedOrder ? Check : s.order === promotedOrder ? Circle : Circle,
    })),
    { label: 'Complete', status: (promotedOrder > 0 && promotedOrder > (stages[stages.length - 1]?.order ?? 0)) ? 'done' : 'upcoming', icon: Check },
  ];

  if (disqualified) {
    steps.push({ label: 'Disqualified', status: 'skipped', icon: X });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-5">
        <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-text-muted">
          Hackathon Journey
        </h3>
        <div className="flex flex-wrap items-center gap-1">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === steps.length - 1;

            return (
              <div key={step.label} className="flex items-center gap-1">
                <div
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                    step.status === 'done' && 'bg-accent/10 text-accent',
                    step.status === 'current' && 'bg-accent/15 text-accent ring-1 ring-accent/30',
                    step.status === 'upcoming' && 'bg-bg-elevated text-text-muted',
                    step.status === 'skipped' && 'bg-error-bg text-error',
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {step.label}
                </div>
                {!isLast && (
                  <ArrowRight className="h-3 w-3 text-text-muted/40" />
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}
