import { motion } from 'framer-motion';
import { CalendarDays, Trophy, Users } from 'lucide-react';
import type { Hackathon } from '@/types/hackathon';
import type { Team } from '@/types/team';
import type { Registration } from '@/types/registration';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface WelcomeHeaderProps {
  name: string;
  hackathon: Hackathon | null;
  team: Team | null;
  registration: Registration | null;
}

const statusLabel: Record<string, { label: string; variant: 'warning' | 'success' | 'accent' | 'error' | 'default' }> = {
  PENDING_PAYMENT: { label: 'Pending Payment', variant: 'warning' },
  PENDING_APPROVAL: { label: 'Pending Approval', variant: 'warning' },
  APPROVED: { label: 'Approved', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'error' },
  CANCELLED: { label: 'Cancelled', variant: 'default' },
};

export function WelcomeHeader({ name, hackathon, team, registration }: WelcomeHeaderProps) {
  const stats = [
    { icon: CalendarDays, label: 'Hackathons', value: registration ? 1 : 0 },
    { icon: Users, label: 'Team Members', value: team?.members?.length ?? 0 },
    { icon: Trophy, label: 'Stage', value: team?.promotedToStageOrder ? `Stage ${team.promotedToStageOrder}` : 'N/A' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-4">
        <Avatar name={name} size="lg" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
            Welcome back, {name?.split(' ')[0] ?? 'there'}
          </h1>
          {hackathon ? (
            <p className="mt-1 text-sm text-text-muted flex items-center gap-2">
              Currently in <span className="font-medium text-text-secondary">{hackathon.title}</span>
              {registration && (
                <Badge
                  variant={statusLabel[registration.status]?.variant ?? 'default'}
                  size="sm"
                >
                  {statusLabel[registration.status]?.label ?? registration.status}
                </Badge>
              )}
            </p>
          ) : (
            <p className="mt-1 text-sm text-text-muted">No active hackathon yet</p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="flex items-center gap-2 rounded-lg border border-border bg-bg-surface px-3 py-2"
          >
            <stat.icon className="h-4 w-4 text-text-muted" />
            <div>
              <p className="text-xs text-text-muted">{stat.label}</p>
              <p className="text-sm font-semibold text-text-primary">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
