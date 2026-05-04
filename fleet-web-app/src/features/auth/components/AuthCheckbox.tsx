import type { ReactNode } from 'react';

type AuthCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
};

export default function AuthCheckbox({ checked, onChange, label }: AuthCheckboxProps) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '9px', cursor: 'pointer', userSelect: 'none', fontSize: '14px', color: '#374151' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '5px',
          flexShrink: 0,
          border: checked ? '2px solid #2563eb' : '1.5px solid #d1d5db',
          background: checked ? '#2563eb' : '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s',
          cursor: 'pointer',
        }}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      {label}
    </label>
  );
}
