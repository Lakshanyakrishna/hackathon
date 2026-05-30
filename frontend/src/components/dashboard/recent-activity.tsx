import { motion } from 'framer-motion';
import { Activity, ChevronRight, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { ActivityLog } from '@/services/activity-logs';

interface RecentActivityProps {
  logs: ActivityLog[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

function getActivityIcon(action: string): string {
  if (action.includes('SUBMIT')) return '📝';
  if (action.includes('TEAM') || action.includes('INVITATION')) return '👥';
  if (action.includes('PAYMENT')) return '💳';
  if (action.includes('REGISTRATION') || action.includes('APPROV')) return '✅';
  if (action.includes('PROMOT')) return '🚀';
  if (action.includes('SCORE') || action.includes('EVALUAT')) return '⭐';
  if (action.includes('STAGE')) return '🏗️';
  if (action.includes('ACCOUNT') || action.includes('AUTH')) return '🔐';
  return '📌';
}

function formatTime(dateStr: string): string {
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

function formatAction(action: string): string {
  return action
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function RecentActivity({ logs, isLoading, error, onRetry }: RecentActivityProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-5 w-5 animate-spin text-text-muted" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-5">
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <p className="text-sm text-text-muted">Failed to load activity</p>
          {onRetry && (
            <Button variant="ghost" size="sm" className="mt-2 gap-1" onClick={onRetry}>
              <RefreshCw className="h-3 w-3" /> Retry
            </Button>
          )}
        </div>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className="p-5">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bg-elevated">
            <Activity className="h-6 w-6 text-text-muted" />
          </div>
          <h3 className="font-semibold text-text-primary">No Recent Activity</h3>
          <p className="mt-1 text-sm text-text-muted">Your activity will appear here</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-text-muted" />
          <h3 className="text-sm font-medium uppercase tracking-wider text-text-muted">Recent Activity</h3>
        </div>
      </div>

      <div className="space-y-1">
        {logs.slice(0, 5).map((log, i) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-bg-elevated"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/5">
              <span className="text-sm">{getActivityIcon(log.action)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-secondary">
                {formatAction(log.action)} — <span className="text-text-muted">{log.entity}</span>
              </p>
              <p className="text-xs text-text-muted mt-0.5">{formatTime(log.createdAt)}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <Button variant="ghost" size="sm" className="mt-3 w-full gap-1 text-xs" onClick={() => navigate('/notifications')}>
        View all activity <ChevronRight className="h-3 w-3" />
      </Button>
    </Card>
  );
}
