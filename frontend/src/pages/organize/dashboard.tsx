import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, ExternalLink, Calendar, Users, Globe, Trash2, Loader2 } from 'lucide-react';
import { hackathonService } from '@/services/hackathons';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { CreateHackathonDialog } from '@/components/dashboard/create-hackathon-dialog';
import type { Hackathon } from '@/types/hackathon';
import { unwrapData } from '@/utils/unwrap-data';
import { useState } from 'react';

export function OrganizeDashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: hackathons, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-hackathons', user?.id],
    queryFn: () => hackathonService.list({ organizerId: user!.id }).then((r) => unwrapData<Hackathon[]>(r)),
    enabled: !!user?.id,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => hackathonService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-hackathons'] }); addToast({ type: 'success', title: 'Hackathon deleted' }); },
    onError: (e: Error) => addToast({ type: 'error', title: 'Failed to delete', message: (e as any).response?.data?.message ?? e.message }),
  });

  const list = hackathons ?? [];

  const badgeVariant = (s: string) =>
    s === 'PUBLISHED' ? 'success' as const : s === 'ONGOING' ? 'accent' as const : s === 'COMPLETED' ? 'neutral' as const : 'warning' as const;

  if (isError) {
    return (
      <ErrorState
        title="Failed to load hackathons"
        message="Could not load your hackathons. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <CreateHackathonDialog open={showCreateDialog} onClose={() => { setShowCreateDialog(false); refetch(); }} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">My Hackathons</h1>
          <p className="text-sm text-text-muted mt-0.5">{list.length} hackathon{list.length !== 1 && 's'}</p>
        </div>
        <Button size="sm" className="gap-1.5 bg-gradient-to-r from-accent to-accent-dim hover:opacity-90" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" /> Create Hackathon
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          title="No hackathons yet"
          description="Create your first hackathon to get started."
          action={{ label: 'Create Hackathon', onClick: () => setShowCreateDialog(true) }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((h, i) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="p-5 cursor-pointer transition-all hover:shadow-lg hover:border-accent/30 group h-full flex flex-col"
                onClick={() => navigate(`/organize/${h.slug}`)}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-text-primary group-hover:text-accent transition-colors line-clamp-2">{h.title}</h3>
                  <Badge variant={badgeVariant(h.status)} size="sm">{h.status}</Badge>
                </div>
                <p className="text-xs text-text-muted line-clamp-2 mb-4 flex-1">{h.description}</p>
                <div className="space-y-1.5 text-xs text-text-muted mt-auto">
                  <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{new Date(h.startDate).toLocaleDateString()} – {new Date(h.endDate).toLocaleDateString()}</div>
                  <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{h.minTeamSize}–{h.maxTeamSize} per team · {h.mode}</div>
                  <div className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />{h.registrationMode === 'OPEN' ? 'Open registration' : 'Approval required'}</div>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1 text-error hover:text-error"
                    onClick={(e) => { e.stopPropagation(); if (window.confirm(`Delete "${h.title}"? This cannot be undone.`)) deleteMut.mutate(h.id); }}
                    disabled={deleteMut.isPending}
                  >
                    {deleteMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    Delete
                  </Button>
                  <Button size="sm" variant="ghost" className="gap-1 text-accent">
                    Manage <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
