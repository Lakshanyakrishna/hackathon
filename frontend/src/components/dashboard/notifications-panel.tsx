import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  UserPlus,
  Megaphone,
  ArrowUp,
  Upload,
  ChevronRight,
  Mail,
  CheckCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import type { Notification } from '@/types/api';

interface NotificationsPanelProps {
  notifications: Notification[];
  pendingInvitations: number;
}

const typeIcons: Record<string, React.ElementType> = {
  TEAM_INVITATION: UserPlus,
  ANNOUNCEMENT: Megaphone,
  PROMOTION: ArrowUp,
  SUBMISSION_REMINDER: Upload,
};

const typeColors: Record<string, string> = {
  TEAM_INVITATION: 'bg-accent/10 text-accent',
  ANNOUNCEMENT: 'bg-pink/10 text-pink',
  PROMOTION: 'bg-accent/10 text-accent',
  SUBMISSION_REMINDER: 'bg-warning/10 text-warning',
};

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function NotificationsPanel({ notifications, pendingInvitations }: NotificationsPanelProps) {
  const navigate = useNavigate();
  const hasItems = notifications.length > 0 || pendingInvitations > 0;

  if (!hasItems) {
    return (
      <Card className="p-5">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bg-elevated">
            <Bell className="h-6 w-6 text-text-muted" />
          </div>
          <h3 className="font-semibold text-text-primary">All Clear</h3>
          <p className="mt-1 text-sm text-text-muted">No new notifications</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-text-muted" />
          <h3 className="text-sm font-medium uppercase tracking-wider text-text-muted">Notifications</h3>
          {pendingInvitations > 0 && (
            <Badge variant="error" size="sm">{pendingInvitations} new</Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate('/notifications')}>
          <CheckCheck className="h-3 w-3" />
          View all
        </Button>
      </div>

      <div className="space-y-1">
        {pendingInvitations > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 rounded-lg bg-accent/5 p-3 transition-colors hover:bg-accent/10 cursor-pointer"
            onClick={() => navigate('/team')}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
              <Mail className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">Team Invitations</p>
              <p className="text-xs text-text-muted">You have {pendingInvitations} pending invitation{pendingInvitations > 1 ? 's' : ''}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {notifications.slice(0, 5).map((notif) => {
            const Icon = typeIcons[notif.type] ?? Bell;
            const colorClass = typeColors[notif.type] ?? 'bg-bg-elevated text-text-muted';

            return (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={cn(
                  'flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-bg-elevated cursor-pointer',
                  !notif.isRead && 'bg-accent/[0.02]',
                )}
                onClick={() => navigate('/notifications')}
              >
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', colorClass)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm truncate', notif.isRead ? 'text-text-secondary' : 'font-medium text-text-primary')}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-text-muted truncate mt-0.5">{notif.message}</p>
                  <p className="text-[11px] text-text-muted mt-1">{getTimeAgo(notif.createdAt)}</p>
                </div>
                {!notif.isRead && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Card>
  );
}
