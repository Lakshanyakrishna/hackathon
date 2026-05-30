import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, name, size = 'md', ...props }, ref) => {
    const initials = name
      ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
      : '?';

    if (src) {
      return (
        <div
          ref={ref}
          className={cn('overflow-hidden rounded-full', sizeMap[size], className)}
          {...props}
        >
          <img src={src} alt={name || 'Avatar'} className="h-full w-full object-cover" />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center rounded-full bg-gradient-to-br from-accent to-pink font-medium text-white',
          sizeMap[size],
          className,
        )}
        {...props}
      >
        {initials}
      </div>
    );
  },
);

Avatar.displayName = 'Avatar';

export { Avatar };
