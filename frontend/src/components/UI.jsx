import { useState } from 'react';

export function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, color: '#f1f5f9' }}>{title}</h1>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{subtitle}</p>
    </div>
  );
}

export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 12, padding: 24, marginBottom: 20, ...style,
    }}>{children}</div>
  );
}

export function CardTitle({ children }) {
  return (
    <div style={{
      fontSize: 13, fontWeight: 600, color: 'var(--accent2)',
      marginBottom: 16, paddingBottom: 12,
      borderBottom: '1px solid var(--border)',
    }}>{children}</div>
  );
}

export function Input({ label, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      <input {...props} style={{
        background: 'var(--bg)', border: '1px solid var(--border)',
        borderRadius: 8, color: 'var(--text)', padding: '9px 12px',
        fontSize: 13, outline: 'none', fontFamily: 'inherit',
        transition: 'border-color 0.15s',
        ...props.style,
      }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  );
}

export function Select({ label, options = [], ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      <select {...props} style={{
        background: 'var(--bg)', border: '1px solid var(--border)',
        borderRadius: 8, color: 'var(--text)', padding: '9px 12px',
        fontSize: 13, outline: 'none', fontFamily: 'inherit',
        ...props.style,
      }}>
        <option value="">Select...</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function Btn({ children, variant = 'primary', ...props }) {
  const colors = {
    primary: { background: '#3b82f6', color: '#ffffff', border: 'none' },
    success: { background: '#10b981', color: '#ffffff', border: 'none' },
    danger:  { background: '#ef4444', color: '#ffffff', border: 'none' },
    outline: { background: 'transparent', color: '#60a5fa', border: '1px solid #3b82f6' },
    ghost:   { background: '#111f35', color: '#e2eaf5', border: '1px solid #1a2d4a' },
  };
  const s = colors[variant] || colors.primary;
  return (
    <button
      {...props}
      style={{
        padding: '9px 18px',
        border: s.border,
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'opacity 0.15s',
        background: s.background,
        color: s.color,
        ...props.style,
      }}
      onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
      onMouseOut={e => e.currentTarget.style.opacity = '1'}
    >
      {children}
    </button>
  );
}

export function Badge({ children, color = 'blue' }) {
  const map = {
    blue:  { bg: '#1e3a5f', color: '#60a5fa' },
    green: { bg: '#064e3b', color: '#34d399' },
    red:   { bg: '#450a0a', color: '#f87171' },
    amber: { bg: '#451a03', color: '#fbbf24' },
  };
  const s = map[color] || map.blue;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px',
      borderRadius: 20, fontSize: 11, fontWeight: 700, ...s,
    }}>{children}</span>
  );
}

export function Table({ headers, rows, empty = 'No data found' }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{
                background: 'var(--bg)', color: 'var(--accent2)',
                fontWeight: 600, padding: '10px 14px', textAlign: 'left',
                borderBottom: '1px solid var(--border)',
                fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length}
              style={{ textAlign: 'center', color: 'var(--muted)',
                padding: '32px', fontStyle: 'italic' }}>{empty}</td></tr>
          ) : rows.map((r, i) => (
            <tr key={i} style={{ transition: 'background 0.1s' }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--bg3)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
              {r.map((cell, j) => (
                <td key={j} style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--border)',
                  color: 'var(--text)',
                }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Grid({ cols = 2, children }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: 16,
    }}>{children}</div>
  );
}

export function Toast({ message, type }) {
  if (!message) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      padding: '12px 20px', borderRadius: 10,
      background: type === 'error' ? '#450a0a' : '#064e3b',
      color: type === 'error' ? '#f87171' : '#34d399',
      border: `1px solid ${type === 'error' ? 'var(--red)' : 'var(--green)'}`,
      fontSize: 13, fontWeight: 500, zIndex: 9999,
      maxWidth: 380, boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      animation: 'fadeIn 0.2s ease',
    }}>{message}</div>
  );
}

export function useToast() {
  const [toast, setToast] = useState(null);
  const show = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };
  return [toast, show];
}

export function StatCard({ label, value, color = 'var(--accent2)' }) {
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '20px 24px',
    }}>
      <div style={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1 }}>
        {value ?? '—'}
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8,
        textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
        {label}
      </div>
    </div>
  );
}

export function ProgressBar({ value }) {
  const color = value >= 75 ? 'var(--green)' : value >= 50 ? 'var(--amber)' : 'var(--red)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 100, height: 5, background: 'var(--bg3)',
        borderRadius: 10, overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.min(value, 100)}%`, height: '100%',
          background: color, borderRadius: 10, transition: 'width 0.4s',
        }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color, minWidth: 42 }}>
        {value}%
      </span>
    </div>
  );
}