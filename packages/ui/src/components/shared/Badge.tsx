import { cn } from '../../utils/cn.js';

export interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = 'neutral',
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'kc:inline-flex kc:items-center kc:rounded-full kc:px-2 kc:py-0.5 kc:text-xs kc:font-medium',
        variant === 'primary' && 'kc:bg-accent/10 kc:text-accent',
        variant === 'success' && 'kc:bg-positive-light kc:text-positive',
        variant === 'warning' && 'kc:bg-amber-50 kc:text-amber-700',
        variant === 'neutral' && 'kc:bg-gray-100 kc:text-gray-700',
        className
      )}
    >
      {children}
    </span>
  );
}
