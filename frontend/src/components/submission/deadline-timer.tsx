import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface DeadlineTimerProps {
  deadline: string | null | undefined;
  className?: string;
}

export function DeadlineTimer({ deadline, className }: DeadlineTimerProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!deadline) return null;

  const target = new Date(deadline).getTime();
  const diff = target - now;

  if (diff <= 0) {
    return (
      <div className={cn('flex items-center gap-1.5 text-sm text-error', className)}>
        <AlertTriangle className="h-4 w-4" />
        Submission closed
      </div>
    );
  }

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  const isUrgent = diff < 86400000; // less than 24h

  if (days > 0) {
    return (
      <div className={cn('flex items-center gap-1.5 text-sm', isUrgent ? 'text-warning' : 'text-text-muted', className)}>
        <Clock className="h-4 w-4" />
        <span className={isUrgent ? 'font-medium' : ''}>
          {days}d {hours}h remaining
        </span>
        {isUrgent && <AlertTriangle className="h-3 w-3 text-warning" />}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1.5 text-sm font-medium text-warning', className)}>
      <AlertTriangle className="h-4 w-4" />
      {hours > 0 ? `${hours}h ${mins}m` : `${mins}m ${secs}s`} remaining
    </div>
  );
}
