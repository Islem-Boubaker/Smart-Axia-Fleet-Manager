import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', disabled, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[13px] text-gray-500 dark:text-slate-400 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={`w-full bg-white/90 dark:bg-slate-800/60 border text-gray-900 dark:text-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.03)] placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all
            ${disabled
              ? 'px-2.5 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm cursor-not-allowed opacity-70'
              : 'px-4 py-2.5 text-sm'
            }
            ${error
              ? 'border-red-500 dark:border-red-500/80'
              : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-500'
            }
            ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs sm:text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-xs sm:text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;