'use client';

import { forwardRef } from 'react';

import { Slot } from '@radix-ui/react-slot';

import { cn } from '../../utils/cn.js';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      asChild = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        className={cn(
          'kc:inline-flex kc:items-center kc:justify-center kc:font-medium kc:transition-colors kc:focus-visible:outline-2 kc:focus-visible:outline-offset-2 kc:focus-visible:outline-accent kc:disabled:pointer-events-none kc:disabled:opacity-50',
          'kc:rounded-input',
          {
            'kc:bg-accent kc:text-white kc:hover:bg-accent-hover kc:focus-visible:outline-accent':
              variant === 'primary',
            'kc:border kc:border-gray-300 kc:bg-white kc:text-gray-700 kc:hover:bg-gray-50':
              variant === 'secondary',
            'kc:text-gray-700 kc:hover:bg-gray-100': variant === 'ghost',
            'kc:bg-critical kc:text-white kc:hover:bg-critical-hover':
              variant === 'danger',
          },
          {
            'kc:h-11 kc:px-3 kc:text-sm kc:sm:h-8': size === 'sm',
            'kc:h-11 kc:px-4 kc:text-sm kc:sm:h-10': size === 'md',
            'kc:h-12 kc:px-6 kc:text-base': size === 'lg',
          },
          className
        )}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <span
            aria-hidden="true"
            className="kc:mr-2 kc:inline-block kc:h-4 kc:w-4 kc:animate-spin kc:rounded-full kc:border-2 kc:border-current kc:border-t-transparent"
          />
        ) : null}
        {children}
      </Comp>
    );
  }
);

Button.displayName = 'Button';
