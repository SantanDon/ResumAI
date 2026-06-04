import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const textareaVariants = cva(
  // Base styles
  'flex w-full rounded-lg bg-white/5 text-white placeholder:text-white/40 transition-all duration-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none',
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
      state: {
        default: '',
        error: 'border-error focus:border-error focus:ring-error/20',
        success: 'border-success focus:border-success focus:ring-success/20',
      },
    },
    defaultVariants: {
      variant: 'default',
      state: 'default',
    },
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant,
      state,
      label,
      helperText,
      errorMessage,
      id,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const textareaId = id || React.useId();
    const hasError = state === 'error' || !!errorMessage;
    const actualState = hasError ? 'error' : state;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-white/85"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            textareaVariants({ variant, state: actualState }),
            'px-4 py-3 text-sm',
            className
          )}
          ref={ref}
          rows={rows}
          aria-invalid={hasError}
          aria-describedby={
            errorMessage
              ? `${textareaId}-error`
              : helperText
              ? `${textareaId}-helper`
              : undefined
          }
          {...props}
        />
        {errorMessage && (
          <p
            id={`${textareaId}-error`}
            className="text-xs text-error flex items-center gap-1"
          >
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
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
          <p id={`${textareaId}-helper`} className="text-xs text-white/60">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea, textareaVariants };
