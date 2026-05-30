import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            'w-full rounded-md border bg-bg-surface px-3 py-2 text-sm text-text-primary',
            'placeholder:text-text-muted resize-y min-h-[80px]',
            'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
            error ? 'border-error' : 'border-border hover:border-border-hover',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';

export { Textarea };
