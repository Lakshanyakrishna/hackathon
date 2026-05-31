import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Users, CheckCircle2, AlertTriangle } from 'lucide-react';
import { teamService } from '@/services/teams';
import { hackathonService } from '@/services/hackathons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { Hackathon } from '@/types/hackathon';
import type { Team } from '@/types/team';
import { unwrapData } from '@/utils/unwrap-data';

export function CreateTeamPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const hackathonId = searchParams.get('hackathonId');

  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: hackathon, isLoading: hackathonLoading } = useQuery({
    queryKey: ['hackathon', hackathonId],
    queryFn: () => hackathonService.getById(hackathonId!).then((r) => unwrapData<Hackathon>(r)),
    enabled: !!hackathonId,
  });

  const createMutation = useMutation({
    mutationFn: () => {
      if (!name.trim()) throw new Error('Team name is required');
      if (!hackathonId) throw new Error('Hackathon ID is required');
      return teamService.create({ hackathonId: hackathonId, name: name.trim() });
    },
    onSuccess: (res) => {
      const team = unwrapData<Team>(res);
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-teams'] });
      navigate(`/team/${team.id}`);
    },
    onError: (err: Error) => setError(err.message),
  });

  if (hackathonLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-text-primary">Create Team</h1>
        </div>

        {hackathon && (
          <Card className="p-4 bg-accent/[0.02]">
            <p className="text-sm text-text-muted">
              For: <span className="font-medium text-text-primary">{hackathon.title}</span>
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              Team size: {hackathon.minTeamSize}–{hackathon.maxTeamSize} members
              {hackathon.minTeamSize === 1 && ' · Solo allowed'}
            </p>
          </Card>
        )}

        {error && (
          <div className="rounded-lg bg-error-bg p-3 text-sm text-error flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Users className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="font-semibold text-text-primary">Team Name</h2>
              <p className="text-xs text-text-muted">Choose a unique name for your team</p>
            </div>
          </div>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your team name"
            maxLength={100}
          />
          <div className="mt-4 flex gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2 bg-gradient-to-r from-accent to-accent-dim hover:opacity-90"
              disabled={!name.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Create Team
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
