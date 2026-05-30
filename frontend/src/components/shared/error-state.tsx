import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12 text-center', className)}>
      <div className="rounded-full bg-error-bg p-3">
        <AlertTriangle className="h-8 w-8 text-error" />
      </div>
      <h3 className="text-lg font-medium text-text-primary">{title}</h3>
      <p className="max-w-md text-sm text-text-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-2 gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}
