import React from 'react';

interface Props {
  children?: React.ReactNode;
  label?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isLocked?: boolean;
  danger?: boolean;
  small?: boolean;
}

export function MetalButton({
  children,
  label,
  onClick,
  isLocked = false,
  danger = false,
  small = false,
}: Props) {
  const disabled = isLocked;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',

        padding: small ? '10px 22px' : '14px 36px',
        minWidth: small ? 110 : 160,

        background: danger
          ? 'linear-gradient(180deg, #6b2d2d 0%, #3d1818 50%, #1f0e0e 100%)'
          : 'linear-gradient(180deg, #6b6b6b 0%, #3a3a3a 50%, #1a1a1a 100%)',

        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 6,

        color: '#e8e0d0',
        fontFamily: "'Georgia', serif",
        fontSize: small ? 12 : 14,
        fontWeight: 700,
        letterSpacing: 3,
        textTransform: 'uppercase',
        textShadow: '0 1px 3px rgba(0,0,0,0.6)',

        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.35 : 1,

        boxShadow: disabled
          ? 'inset 0 1px 0 rgba(255,255,255,0.03)'
          : `
            inset 0 1px 0 rgba(255,255,255,0.12),
            inset 0 -1px 0 rgba(0,0,0,0.4),
            0 4px 16px rgba(0,0,0,0.5),
            0 0 0 1px rgba(0,0,0,0.3)
          `,

        transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (disabled) return;

        e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
        e.currentTarget.style.boxShadow = danger
          ? `
            inset 0 1px 0 rgba(255,255,255,0.15),
            0 6px 24px rgba(0,0,0,0.6),
            0 0 20px rgba(180,60,60,0.15)
          `
          : `
            inset 0 1px 0 rgba(255,255,255,0.18),
            0 6px 24px rgba(0,0,0,0.6),
            0 0 20px rgba(200,180,140,0.12)
          `;
      }}
      onMouseLeave={(e) => {
        if (disabled) return;

        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
        e.currentTarget.style.boxShadow = `
          inset 0 1px 0 rgba(255,255,255,0.12),
          inset 0 -1px 0 rgba(0,0,0,0.4),
          0 4px 16px rgba(0,0,0,0.5),
          0 0 0 1px rgba(0,0,0,0.3)
        `;
      }}
    >
      {/* Shine effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)',
          pointerEvents: 'none',
          borderRadius: '6px 6px 0 0',
        }}
      />
      {/* Bottom edge highlight */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '10%',
          right: '10%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
          pointerEvents: 'none',
        }}
      />
      <span style={{ position: 'relative', zIndex: 1 }}>
        {children ?? label}
      </span>
    </button>
  );
}
