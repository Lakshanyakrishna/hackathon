import { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: string;
  onExpire?: () => void;
  className?: string;
}

export function CountdownTimer({ targetDate, onExpire, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number } | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const tick = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setExpired(true);
        setTimeLeft(null);
        onExpire?.();
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      });
    };

    tick();
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, [targetDate, onExpire]);

  if (expired) {
    return (
      <span className={cn('flex items-center gap-1 text-xs text-error', className)}>
        <AlertTriangle className="h-3 w-3" />
        Expired
      </span>
    );
  }

  if (!timeLeft) return null;

  return (
    <span className={cn('text-xs font-medium tabular-nums', className)}>
      {timeLeft.days > 0 && <span className="text-text-primary">{timeLeft.days}d </span>}
      <span className={timeLeft.days === 0 ? 'text-warning' : 'text-text-muted'}>
        {timeLeft.hours}h {timeLeft.minutes}m
      </span>
    </span>
  );
}
