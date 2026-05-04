import { useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';

type AuthInputFieldProps = {
  label: string;
  icon: ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  trailing?: ReactNode;
  autoComplete?: string;
};

export default function AuthInputField({
  label,
  icon,
  type,
  placeholder,
  value,
  onChange,
  error,
  trailing,
  autoComplete,
}: AuthInputFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>{label}</label>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderRadius: '10px',
          border: error ? '1.5px solid #ef4444' : focused ? '1.5px solid #2563eb' : '1.5px solid #e5e7eb',
          background: '#fff',
          boxShadow: focused && !error ? '0 0 0 3px rgba(37,99,235,0.1)' : error && focused ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
          transition: 'border-color 0.18s, box-shadow 0.18s',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            paddingLeft: '13px',
            color: focused ? '#2563eb' : '#9ca3af',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            transition: 'color 0.18s',
          }}
        >
          {icon}
        </span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            padding: '12px 12px',
            fontSize: '14.5px',
            fontFamily: "'DM Sans', sans-serif",
            color: '#111827',
          }}
        />
        {trailing}
      </div>
      {error && <p style={{ margin: '5px 0 0 2px', fontSize: '12px', color: '#ef4444', fontWeight: 500 }}>{error}</p>}
    </div>
  );
}
