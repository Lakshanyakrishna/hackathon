import { cn } from '@/utils/cn';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

const sizes = {
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
};

export function Loading({ size = 'md', message, className }: LoadingProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className={cn('relative', sizes[size])}>
        <div className="absolute inset-0 rounded-full border-2 border-bg-elevated" />
        <div className={`absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin ${sizes[size]}`} />
      </div>
      {message && <p className="text-sm text-text-muted">{message}</p>}
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex h-full min-h-[400px] items-center justify-center">
      <Loading size="lg" message="Loading..." />
    </div>
  );
}

export function TableLoading({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 flex-1 animate-pulse rounded bg-bg-elevated" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-8 flex-1 animate-pulse rounded bg-bg-elevated/50" />
          ))}
        </div>
      ))}
    </div>
  );
}
