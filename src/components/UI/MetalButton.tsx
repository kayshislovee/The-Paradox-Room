import { useState } from 'react';

interface Props {
  onClick: (e: React.MouseEvent) => void;
  label: string;
  danger?: boolean;
  small?: boolean;
}

export function MetalButton({ onClick, label, danger, small }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: '100%',
        padding: small ? '12px 0' : '18px 0',
        background: danger
          ? hovered
            ? 'linear-gradient(180deg, #6b2020 0%, #3a0f0f 100%)'
            : 'linear-gradient(180deg, #4a1515 0%, #280a0a 100%)'
          : hovered
          ? 'linear-gradient(180deg, #5a5a5a 0%, #2a2a2a 40%, #1a1a1a 60%, #3a3a3a 100%)'
          : 'linear-gradient(180deg, #4a4a4a 0%, #1e1e1e 40%, #111111 60%, #2e2e2e 100%)',
        border: 'none',
        borderRadius: 4,
        cursor: 'pointer',
        transition: 'all 0.2s',
        transform: hovered ? 'scale(1.02)' : 'scale(1)',
        boxShadow: hovered
          ? '0 0 20px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.15)'
          : 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.5)',
      }}
    >
      {/* Dekorasi kiri */}
      <div style={{
        position: 'absolute', left: 16, top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <div style={{ width: 16, height: 1, background: '#666' }} />
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#555' }} />
      </div>
      {/* Dekorasi kanan */}
      <div style={{
        position: 'absolute', right: 16, top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex', alignItems: 'center', gap: 6, flexDirection: 'row-reverse',
      }}>
        <div style={{ width: 16, height: 1, background: '#666' }} />
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#555' }} />
      </div>

      <span style={{
        color: danger
          ? hovered ? '#ff8888' : '#cc6666'
          : hovered ? '#ffffff' : '#cccccc',
        fontSize: small ? 12 : 15,
        fontWeight: 600,
        letterSpacing: small ? 4 : 6,
        textTransform: 'uppercase',
        fontFamily: "'Georgia', serif",
        textShadow: hovered ? '0 0 12px rgba(255,255,255,0.3)' : 'none',
        transition: 'all 0.2s',
      }}>
        {label}
      </span>

      <div style={{
        position: 'absolute', inset: 0, borderRadius: 4,
        border: `1px solid ${hovered ? '#666' : '#444'}`,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 3, borderRadius: 2,
        border: `1px solid ${hovered ? '#555' : '#333'}`,
        pointerEvents: 'none',
      }} />
    </button>
  );
}