import { motion } from 'framer-motion';
import { Users, Shield, MoreHorizontal, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { Team } from '@/types/team';

interface TeamCardProps {
  team: Team | null;
  maxTeamSize?: number;
}

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'accent'> = {
  ACTIVE: 'success',
  LOCKED: 'accent',
  DISQUALIFIED: 'error',
};

export function TeamCard({ team, maxTeamSize = 10 }: TeamCardProps) {
  const navigate = useNavigate();

  if (!team) {
    return (
      <Card className="p-5">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bg-elevated">
            <Users className="h-6 w-6 text-text-muted" />
          </div>
          <h3 className="font-semibold text-text-primary">No Team Yet</h3>
          <p className="mt-1 text-sm text-text-muted max-w-xs">
            Create or join a team to start competing in stages.
          </p>
          <Button size="sm" className="mt-4" onClick={() => navigate('/team/create')}>
            Create Team
          </Button>
        </div>
      </Card>
    );
  }

  const lead = team.members?.find((m) => m.role === 'LEAD');
  const members = team.members?.filter((m) => m.role === 'MEMBER') ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Users className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">{team.name}</h3>
              <Badge variant={statusVariant[team.status] ?? 'default'} size="sm">
                {team.status}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => navigate(`/team/${team.id}`)}
          >
            View <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          {lead && (
            <div className="flex items-center gap-3 rounded-lg bg-bg-elevated p-2">
              <Avatar name={lead.user.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{lead.user.name}</p>
                <p className="text-xs text-text-muted">Team Lead</p>
              </div>
              <Shield className="h-4 w-4 text-accent" />
            </div>
          )}
          {members.slice(0, 3).map((member) => (
            <div key={member.id} className="flex items-center gap-3 px-2 py-1.5">
              <Avatar name={member.user.name} size="sm" />
              <p className="text-sm text-text-secondary truncate">{member.user.name}</p>
            </div>
          ))}
          {members.length > 3 && (
            <button className="flex items-center gap-2 px-2 py-1 text-xs text-text-muted hover:text-text-secondary transition-colors">
              <MoreHorizontal className="h-3 w-3" />
              {members.length - 3} more members
            </button>
          )}
          <p className="text-xs text-text-muted pt-1">
            {team.members?.length ?? 0} / {maxTeamSize} members
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
