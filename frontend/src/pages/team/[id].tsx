import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Users, Shield, Mail, Copy, CheckCircle2, XCircle,
  Clock, Loader2, UserPlus, LogOut, Lock,
  AlertTriangle, Send,
} from 'lucide-react';
import { useState } from 'react';
import { teamService } from '@/services/teams';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth-store';
import type { Team, TeamInvitation } from '@/types/team';

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [inviteInput, setInviteInput] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: team, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['team', id],
    queryFn: () => teamService.getById(id!).then((r) => (r.data ?? r) as Team),
    enabled: !!id,
    retry: 1,
  });

  const { data: pendingInvitations, refetch: refetchInvitations } = useQuery({
    queryKey: ['team-invitations', id],
    queryFn: () => teamService.invitations.teamPending(id!).then((r) => (r.data ?? r) as TeamInvitation[]),
    enabled: !!id,
  });

  const isOwner = team?.ownerId === currentUser?.id;
  const isMember = team?.members?.some((m) => m.userId === currentUser?.id);

  const joinMutation = useMutation({
    mutationFn: () => teamService.join(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-teams'] });
    },
    onError: (err: Error) => setInviteError(err.message),
  });

  const leaveMutation = useMutation({
    mutationFn: () => teamService.leave(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-teams'] });
      navigate('/dashboard');
    },
    onError: (err: Error) => setInviteError(err.message),
  });

  const lockMutation = useMutation({
    mutationFn: () => teamService.lock(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] });
    },
    onError: (err: Error) => setInviteError(err.message),
  });

  const sendInviteMutation = useMutation({
    mutationFn: () => {
      const input = inviteInput.trim();
      const isEmail = input.includes('@');
      return isEmail
        ? teamService.invitations.send({ teamId: id!, email: input })
        : teamService.invitations.send({ teamId: id!, username: input });
    },
    onSuccess: () => {
      setInviteInput('');
      setInviteError(null);
      refetchInvitations();
    },
    onError: (err: Error) => setInviteError(err.message),
  });

  const cancelInviteMutation = useMutation({
    mutationFn: (invId: string) => teamService.invitations.cancel(invId),
    onSuccess: () => refetchInvitations(),
  });

  const copyInviteLink = () => {
    const link = `${window.location.origin}/team/${id}?join=1`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (isError || !team) {
    return (
      <ErrorState
        title="Team not found"
        message={(error as Error)?.message ?? 'Team not found'}
        onRetry={() => refetch()}
      />
    );
  }

  const lead = team.members?.find((m) => m.role === 'LEAD');
  const members = team.members?.filter((m) => m.role === 'MEMBER') ?? [];

  return (
    <div className="mx-auto max-w-3xl py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">{team.name}</h1>
              <Badge variant={team.status === 'LOCKED' ? 'accent' : team.status === 'DISQUALIFIED' ? 'error' : 'success'} size="sm">
                {team.status}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            {isOwner && team.status === 'ACTIVE' && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => lockMutation.mutate()}>
                <Lock className="h-4 w-4" /> Lock
              </Button>
            )}
            {isMember && (
              <Button variant="outline" size="sm" className="gap-1.5 text-error" onClick={() => leaveMutation.mutate()}>
                <LogOut className="h-4 w-4" /> Leave
              </Button>
            )}
          </div>
        </div>

        {inviteError && (
          <div className="rounded-lg bg-error-bg p-3 text-sm text-error flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {inviteError}
          </div>
        )}

        <Tabs defaultValue="members">
          <TabsList>
            <TabsTrigger value="members">Members ({team.members?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="invitations">Invitations ({pendingInvitations?.length ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-5 w-5 text-text-muted" />
                <h3 className="font-medium text-text-primary">Team Members</h3>
              </div>
              <div className="space-y-2">
                {lead && (
                  <div className="flex items-center gap-3 rounded-lg bg-accent/5 p-3">
                    <Avatar name={lead.user.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary">{lead.user.name}</p>
                      <p className="text-xs text-text-muted">{lead.user.email}</p>
                    </div>
                    <Shield className="h-4 w-4 text-accent" />
                    <Badge variant="accent" size="sm">Lead</Badge>
                  </div>
                )}
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 rounded-lg bg-bg-elevated p-3">
                    <Avatar name={member.user.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary">{member.user.name}</p>
                      <p className="text-xs text-text-muted">{member.user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {!isMember && team.status === 'ACTIVE' && (
              <Button className="w-full gap-2" onClick={() => joinMutation.mutate()}>
                <UserPlus className="h-4 w-4" /> Join Team
              </Button>
            )}
          </TabsContent>

          <TabsContent value="invitations" className="space-y-4">
            {isOwner && (
              <Card className="p-5">
                <h3 className="font-medium text-text-primary mb-3">Send Invitation</h3>
                <div className="flex gap-2">
                  <Input
                    value={inviteInput}
                    onChange={(e) => setInviteInput(e.target.value)}
                    placeholder="Email or username..."
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    className="gap-1.5"
                    disabled={!inviteInput.trim() || sendInviteMutation.isPending}
                    onClick={() => sendInviteMutation.mutate()}
                  >
                    {sendInviteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="mt-2 gap-1.5" onClick={copyInviteLink}>
                  {copied ? <CheckCircle2 className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copied!' : 'Copy invite link'}
                </Button>
              </Card>
            )}

            {pendingInvitations && pendingInvitations.length > 0 ? (
              <div className="space-y-2">
                {pendingInvitations.map((inv) => (
                  <Card key={inv.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-text-muted" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {inv.invitee?.name ?? inv.email ?? inv.username ?? 'Pending'}
                        </p>
                        <p className="text-xs text-text-muted flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Expires {new Date(inv.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant={inv.status === 'PENDING' ? 'warning' : 'default'} size="sm">
                        {inv.status}
                      </Badge>
                      {isOwner && inv.status === 'PENDING' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-error"
                          onClick={() => cancelInviteMutation.mutate(inv.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No pending invitations"
                description="Invite team members using email or username."
              />
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
