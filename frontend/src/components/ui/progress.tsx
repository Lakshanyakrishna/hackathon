import { cn } from '@/utils/cn';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  variant?: 'default' | 'gradient';
}

export function Progress({ value, max = 100, className, variant = 'gradient' }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-bg-elevated', className)}>
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500',
          variant === 'gradient'
            ? 'bg-gradient-to-r from-accent to-accent-dim'
            : 'bg-accent',
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
