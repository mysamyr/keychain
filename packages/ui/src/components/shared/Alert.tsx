'use client';

import { useEffect, useRef } from 'react';

import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

import { cn } from '../../utils/cn.js';

export interface AlertProps {
  variant?: 'error' | 'success' | 'info';
  message: string;
  className?: string;
}

const icons = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
};

export function Alert({ variant = 'info', message, className }: AlertProps) {
  const Icon = icons[variant];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (variant === 'error') ref.current?.focus();
  }, [variant, message]);

  return (
    <div
      ref={ref}
      role={variant === 'error' ? 'alert' : 'status'}
      tabIndex={-1}
      className={cn(
        'kc:flex kc:items-start kc:gap-2 kc:rounded-input kc:px-3 kc:py-2.5 kc:text-sm kc:outline-none',
        {
          'kc:bg-critical-light kc:text-critical': variant === 'error',
          'kc:bg-positive-light kc:text-positive': variant === 'success',
          'kc:bg-accent-light kc:text-accent': variant === 'info',
        },
        className
      )}
    >
      <Icon
        aria-hidden="true"
        className="kc:mt-0.5 kc:h-4 kc:w-4 kc:shrink-0"
      />
      <span>{message}</span>
    </div>
  );
}
