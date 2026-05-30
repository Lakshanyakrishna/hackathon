import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'h-10 w-full rounded-md border bg-bg-surface px-3 py-2 text-sm text-text-primary',
            'placeholder:text-text-muted',
            'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-error' : 'border-border hover:border-border-hover',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-error">{error}</p>}
        {helperText && !error && <p className="text-xs text-text-muted">{helperText}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';

export { Input };
