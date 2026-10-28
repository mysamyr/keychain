'use client';

import { forwardRef, useId } from 'react';

import { cn } from '../../utils/cn.js';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelAdornment?: React.ReactNode;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, label, labelAdornment, error, icon, id: externalId, ...props },
    ref
  ) => {
    const generatedId = useId();
    const id = externalId ?? generatedId;

    return (
      <div className="kc:w-full kc:space-y-1.5">
        {label && (
          <div className="kc:flex kc:items-center kc:justify-between kc:gap-2">
            <label
              htmlFor={id}
              className="kc:block kc:text-sm kc:font-medium kc:text-gray-700"
            >
              {label}
            </label>
            {labelAdornment}
          </div>
        )}
        <div className="kc:relative">
          {icon && (
            <span className="kc:pointer-events-none kc:absolute kc:left-3 kc:top-1/2 kc:-translate-y-1/2 kc:text-gray-400">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              'kc:min-h-11 kc:w-full kc:rounded-input kc:border kc:bg-white kc:px-3 kc:py-2.5 kc:text-sm kc:text-gray-900 kc:placeholder:text-gray-400 kc:transition-colors',
              'kc:focus:border-accent kc:focus:outline-none kc:focus:ring-2 kc:focus:ring-accent/20',
              'kc:disabled:cursor-not-allowed kc:disabled:bg-gray-50 kc:disabled:text-gray-500',
              error
                ? 'kc:border-critical kc:focus:border-critical kc:focus:ring-critical/20'
                : 'kc:border-gray-300',
              icon && 'kc:pl-10',
              className
            )}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p
            id={`${id}-error`}
            className="kc:text-xs kc:text-critical"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
