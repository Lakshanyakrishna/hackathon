import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import { notificationService } from '@/services/notifications';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { unwrapData } from '@/utils/unwrap-data';
import type { Notification } from '@/types/api';

export function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: raw, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.list({ limit: '50' }).then((r) => unwrapData<Notification[]>(r)),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = raw ?? [];
  const unread = notifications.filter((n) => !n.isRead).length;

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <h1 className="text-2xl font-semibold text-text-primary mb-6">Notifications</h1>
        <ErrorState title="Failed to load notifications" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Notifications</h1>
          <p className="text-sm text-text-muted mt-0.5">{unread > 0 ? `${unread} unread` : 'All caught up'}</p>
        </div>
        <div className="flex gap-2">
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="gap-1.5" disabled={markAllMutation.isPending} onClick={() => markAllMutation.mutate()}>
              <CheckCheck className="h-4 w-4" /> Mark all read
            </Button>
          )}
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState title="No notifications" description="You'll see notifications here when something happens." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card
                className={`p-4 cursor-pointer transition-colors ${!n.isRead ? 'border-accent/30 bg-accent/[0.02]' : ''}`}
                onClick={() => { if (!n.isRead) markOneMutation.mutate(n.id); }}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${!n.isRead ? 'bg-accent' : 'bg-transparent'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.isRead ? 'font-medium text-text-primary' : 'text-text-secondary'}`}>{n.message}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                      <Clock className="h-3 w-3" />
                      {timeAgo(n.createdAt)}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
