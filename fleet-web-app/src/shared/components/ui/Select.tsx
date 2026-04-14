import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { FiCheck, FiChevronDown } from 'react-icons/fi';

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  dark?: boolean;
  className?: string;
}

const themed = (dark: boolean | undefined, lightClass: string, darkClass: string) => {
  if (typeof dark === 'boolean') return dark ? darkClass : lightClass;
  return `${lightClass} dark:${darkClass}`;
};

export const Select = ({
  value,
  options,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  dark,
  className = '',
}: SelectProps) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(() => options.find((opt) => opt.value === value), [options, value]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full px-4 py-2.5 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between gap-3 disabled:opacity-60 disabled:cursor-not-allowed ${themed(
          dark,
          'border-slate-200 bg-white text-slate-800 hover:border-slate-300',
          'border-slate-600 bg-slate-800/80 text-slate-100 hover:border-slate-500'
        )}`}
      >
        <span className="min-w-0 flex items-center gap-2">
          {selected?.icon && <span className="shrink-0">{selected.icon}</span>}
          <span className="truncate">{selected?.label || placeholder}</span>
        </span>
        <FiChevronDown className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && !disabled && (
        <div
          className={`absolute z-50 mt-2 w-full rounded-2xl border p-2 shadow-xl backdrop-blur-lg ${themed(
            dark,
            'border-slate-200 bg-white/95',
            'border-slate-700 bg-slate-900/95'
          )}`}
        >
          <ul className="max-h-72 overflow-auto space-y-1">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    disabled={option.disabled}
                    onClick={() => {
                      if (option.disabled) return;
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl text-left text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                      isSelected
                        ? themed(dark, 'bg-orange-50 text-orange-600', 'bg-orange-500/15 text-orange-300')
                        : themed(dark, 'text-slate-600 hover:bg-slate-100', 'text-slate-300 hover:bg-slate-800')
                    }`}
                  >
                    {option.icon && <span className="shrink-0">{option.icon}</span>}
                    <span className="truncate flex-1">{option.label}</span>
                    {isSelected && <FiCheck className="shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Select;
