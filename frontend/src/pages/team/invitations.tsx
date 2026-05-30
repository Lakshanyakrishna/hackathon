import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Check, X, Clock, Mail, RefreshCw } from 'lucide-react';
import { teamService } from '@/services/teams';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Loading } from '@/components/shared/loading';
import type { TeamInvitation } from '@/types/team';

export function PendingInvitationsPage() {
  const queryClient = useQueryClient();

  const { data: invitations, isLoading, isError, refetch } = useQuery({
    queryKey: ['pending-invitations'],
    queryFn: () => teamService.invitations.pending().then((r) => (r.data ?? r) as TeamInvitation[]),
    refetchInterval: 30_000,
  });

  if (isError) {
    return (
      <ErrorState
        title="Failed to load invitations"
        message="Could not load your pending invitations. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  const acceptMutation = useMutation({
    mutationFn: (id: string) => teamService.invitations.accept(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-teams'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-registrations'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => teamService.invitations.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-invitations'] });
    },
  });

  if (isLoading) return <Loading className="py-16" message="Loading invitations..." />;

  const pending = invitations?.filter((i) => i.status === 'PENDING') ?? [];

  return (
    <div className="mx-auto max-w-2xl py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Pending Invitations</h1>
            <p className="text-sm text-text-muted mt-1">
              {pending.length} invitation{pending.length !== 1 ? 's' : ''} awaiting your response
            </p>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        {pending.length === 0 ? (
          <EmptyState
            title="No pending invitations"
            description="When someone invites you to a team, it will appear here."
          />
        ) : (
          <div className="space-y-3">
            {pending.map((inv, i) => (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
                      <Mail className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary">
                        {inv.team?.name ?? 'Team Invitation'}
                      </p>
                      <p className="text-sm text-text-muted mt-0.5">
                        Invited by{' '}
                        <span className="font-medium text-text-secondary">
                          {inv.inviter?.name ?? 'Someone'}
                        </span>
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
                        <Clock className="h-3 w-3" />
                        Expires {new Date(inv.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-error"
                        disabled={rejectMutation.isPending}
                        onClick={() => rejectMutation.mutate(inv.id)}
                      >
                        <X className="h-4 w-4" /> Decline
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1 bg-gradient-to-r from-accent to-pink hover:opacity-90"
                        disabled={acceptMutation.isPending}
                        onClick={() => acceptMutation.mutate(inv.id)}
                      >
                        <Check className="h-4 w-4" /> Accept
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {invitations && invitations.filter((i) => i.status !== 'PENDING').length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-medium uppercase tracking-wider text-text-muted mb-3">History</h2>
            <div className="space-y-2">
              {invitations.filter((i) => i.status !== 'PENDING').map((inv) => (
                <Card key={inv.id} className="p-3 flex items-center gap-3 opacity-60">
                  <Badge variant={inv.status === 'ACCEPTED' ? 'success' : inv.status === 'REJECTED' ? 'error' : 'default'} size="sm">
                    {inv.status}
                  </Badge>
                  <p className="text-sm text-text-muted">{inv.team?.name ?? 'Team'}</p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
