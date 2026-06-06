import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties, ReactNode } from 'react';
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

// Z-index scale (all portals render as siblings of the modal at document.body level):
//   modal outer container : z-[9999]  (GlobalCard)
//   dropdown portal        : 10000    ← must beat the modal
//   toasts/notifications   : 11000+
const DROPDOWN_Z = 10000;
const LIST_MAX_H = 288; // max-h-72 = 18 × 16 = 288 px
const GAP = 4;          // gap between trigger bottom and list top

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
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(() => options.find((opt) => opt.value === value), [options, value]);

  // Calculates position for the portal list.
  // Flips the list ABOVE the trigger when there is not enough viewport space below.
  const calcPosition = () => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const vh = window.innerHeight;

    const spaceBelow = vh - rect.bottom - GAP;
    const spaceAbove = rect.top - GAP;
    const renderAbove = spaceBelow < LIST_MAX_H && spaceAbove > spaceBelow;

    if (renderAbove) {
      setDropdownStyle({
        position: 'fixed',
        bottom: vh - rect.top + GAP,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(LIST_MAX_H, spaceAbove),
        zIndex: DROPDOWN_Z,
      });
    } else {
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + GAP,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(LIST_MAX_H, Math.max(spaceBelow, 120)),
        zIndex: DROPDOWN_Z,
      });
    }
  };

  // Outside-click closes the dropdown; checks both the trigger wrapper and the portal list.
  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!wrapperRef.current?.contains(t) && !dropdownRef.current?.contains(t)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  // Close on any ancestor scroll so the list doesn't float away from the trigger.
  useEffect(() => {
    if (!open) return;
    const onScroll = (e: Event) => {
      if (dropdownRef.current?.contains(e.target as Node)) return; // allow internal list scroll
      setOpen(false);
    };
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [open]);

  const handleToggle = () => {
    if (!open) calcPosition();
    setOpen((prev) => !prev);
  };

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full px-4 py-2.5 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between gap-3 disabled:opacity-60 disabled:cursor-not-allowed ${themed(
          dark,
          'border-slate-200 bg-white/90 text-slate-800 hover:border-slate-300',
          'border-slate-600 bg-slate-800/70 text-slate-100 hover:border-slate-500'
        )}`}
      >
        <span className="min-w-0 flex items-center gap-2">
          {selected?.icon && <span className="shrink-0">{selected.icon}</span>}
          <span className="truncate">{selected?.label || placeholder}</span>
        </span>
        <FiChevronDown className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Portal: escapes every overflow / stacking context in the modal.
          Position is fixed so parent transforms have no effect.
          maxHeight flips above the trigger when space below is insufficient. */}
      {open && !disabled && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className={`overflow-y-auto rounded-2xl border p-2 shadow-xl ${themed(
            dark,
            'border-slate-200 bg-white',
            'border-slate-700 bg-slate-900'
          )}`}
        >
          <ul className="space-y-1">
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
                        ? themed(dark, 'bg-blue-50 text-blue-700', 'bg-blue-500/15 text-blue-300')
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
        </div>,
        document.body
      )}
    </div>
  );
};

export default Select;
