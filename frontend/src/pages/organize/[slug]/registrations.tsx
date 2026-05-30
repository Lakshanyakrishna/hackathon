import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Check, X, RefreshCw, Search, Users, Loader2,
  DollarSign, Calendar, Filter, AlertTriangle,
} from 'lucide-react';
import { useState } from 'react';
import { registrationService } from '@/services/registrations';
import { hackathonService } from '@/services/hackathons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Loading } from '@/components/shared/loading';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import type { Registration } from '@/types/registration';
import type { Hackathon } from '@/types/hackathon';

const statusColors: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
  PENDING_PAYMENT: 'warning',
  PENDING_APPROVAL: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  CANCELLED: 'default',
};

export function RegistrationsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: hackathon } = useQuery({
    queryKey: ['hackathon', slug],
    queryFn: () => hackathonService.getBySlug(slug!).then((r) => (r.data ?? r) as Hackathon),
    enabled: !!slug,
  });

  const { data: registrations, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['registrations', hackathon?.id],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      return registrationService.list(params).then((r) => (r.data ?? r) as Registration[]);
    },
    enabled: !!hackathon?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ['registration-stats', hackathon?.id],
    queryFn: () => registrationService.stats(hackathon!.id).then((r) => r.data ?? r) as Promise<Record<string, number>>,
    enabled: !!hackathon?.id,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => registrationService.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['registration-stats'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => registrationService.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['registration-stats'] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (isError || !hackathon) {
    return (
      <ErrorState
        title="Failed to load registrations"
        message={(error as Error)?.message ?? 'Something went wrong'}
        onRetry={() => refetch()}
      />
    );
  }

  const allRegs = registrations ?? [];
  const filtered = search
    ? allRegs.filter((r) =>
        [r.id, r.userId, r.teamId ?? ''].some((f) => f.toLowerCase().includes(search.toLowerCase())),
      )
    : allRegs;

  const pendingApproval = filtered.filter((r) => r.status === 'PENDING_APPROVAL');
  const pendingPayment = filtered.filter((r) => r.status === 'PENDING_PAYMENT');
  const approved = filtered.filter((r) => r.status === 'APPROVED');
  const rejected = filtered.filter((r) => r.status === 'REJECTED' || r.status === 'CANCELLED');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Registrations</h1>
          <p className="text-sm text-text-muted mt-1">{hackathon.title}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: 'Total', count: allRegs.length, color: 'text-text-primary' },
          { label: 'Pending', count: pendingApproval.length + pendingPayment.length, color: 'text-warning' },
          { label: 'Approved', count: approved.length, color: 'text-success' },
          { label: 'Rejected', count: rejected.length, color: 'text-error' },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 text-center">
            <p className="text-2xl font-bold" className2={stat.color}>{stat.count}</p>
            <p className="text-xs text-text-muted mt-0.5">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID or user..."
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({filtered.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingApproval.length + pendingPayment.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <RegistrationsList
            registrations={filtered}
            onApprove={(id) => approveMutation.mutate(id)}
            onReject={(id) => rejectMutation.mutate(id)}
          />
        </TabsContent>
        <TabsContent value="pending">
          <RegistrationsList
            registrations={[...pendingApproval, ...pendingPayment]}
            onApprove={(id) => approveMutation.mutate(id)}
            onReject={(id) => rejectMutation.mutate(id)}
          />
        </TabsContent>
        <TabsContent value="approved">
          <RegistrationsList registrations={approved} onApprove={() => {}} onReject={() => {}} />
        </TabsContent>
        <TabsContent value="rejected">
          <RegistrationsList registrations={rejected} onApprove={() => {}} onReject={() => {}} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

function RegistrationsList({
  registrations,
  onApprove,
  onReject,
}: {
  registrations: Registration[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  if (registrations.length === 0) {
    return <EmptyState title="No registrations found" description="No registrations match the current filter." />;
  }

  return (
    <div className="space-y-2">
      {registrations.map((reg, i) => (
        <motion.div
          key={reg.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.03 }}
        >
          <Card className="p-4">
            <div className="flex items-start gap-4">
              <Avatar name={reg.userId} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary text-sm">
                  Registration: <span className="font-mono text-xs">{reg.id.slice(0, 8)}</span>
                </p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-text-muted">
                  <Badge variant={statusColors[reg.status] ?? 'default'} size="sm">{reg.status}</Badge>
                  {reg.team?.name && <span>Team: {reg.team.name}</span>}
                  <span>{new Date(reg.registeredAt).toLocaleDateString()}</span>
                  {reg.payment?.status && <span>Payment: {reg.payment.status}</span>}
                </div>
              </div>
              {(reg.status === 'PENDING_APPROVAL' || reg.status === 'PENDING_PAYMENT') && (
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-error"
                    onClick={() => onReject(reg.id)}
                  >
                    <X className="h-3 w-3" /> Reject
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1 bg-gradient-to-r from-accent to-pink hover:opacity-90"
                    onClick={() => onApprove(reg.id)}
                  >
                    <Check className="h-3 w-3" /> Approve
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
