import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const inputVariants = cva(
  // Base styles
  'flex w-full rounded-lg bg-white/5 text-white placeholder:text-white/40 transition-all duration-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border border-white/10 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
        ghost:
          'border-transparent hover:bg-white/10 focus:bg-white/10',
        filled:
          'bg-white/10 border-transparent focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
        glass:
          'bg-white/5 backdrop-blur-xl border border-white/10 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20',
      },
      inputSize: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-4 text-base',
      },
      state: {
        default: '',
        error: 'border-error focus:border-error focus:ring-error/20',
        success: 'border-success focus:border-success focus:ring-success/20',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'md',
      state: 'default',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      inputSize,
      state,
      label,
      helperText,
      errorMessage,
      leftIcon,
      rightIcon,
      type = 'text',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    const hasError = state === 'error' || !!errorMessage;
    const actualState = hasError ? 'error' : state;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-white/85"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70">
               {leftIcon}
             </div>
           )}
          <input
            type={type}
            id={inputId}
            className={cn(
              inputVariants({ variant, inputSize, state: actualState }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            ref={ref}
            aria-invalid={hasError}
            aria-describedby={
              errorMessage
                ? `${inputId}-error`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70">
              {rightIcon}
            </div>
          )}
        </div>
        {errorMessage && (
          <p
            id={`${inputId}-error`}
            className="text-xs text-error flex items-center gap-1"
          >
            <svg
              className="h-3 w-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {errorMessage}
          </p>
        )}
        {helperText && !errorMessage && (
          <p id={`${inputId}-helper`} className="text-xs text-white/60">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };
