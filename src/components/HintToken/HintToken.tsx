import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';

const MAX_TOKENS = 5;
const REFILL_MS = 60 * 1000;

interface Props {
  compact?: boolean; // true = HUD ingame, false = menu utama
}

export function HintToken({ compact }: Props) {
  const hintTokens = useGameStore((s) => s.hintTokens ?? 5);
  const lastHintRefill = useGameStore((s) => s.lastHintRefill ?? Date.now());
  const [countdown, setCountdown] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (hintTokens >= MAX_TOKENS) {
      setCountdown(0);
      return;
    }

    const update = () => {
      const elapsed = Date.now() - lastHintRefill;
      const remaining = Math.max(0, REFILL_MS - elapsed);
      setCountdown(remaining);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [hintTokens, lastHintRefill]);

  const seconds = Math.ceil(countdown / 1000);
  const isFull = hintTokens >= MAX_TOKENS;

  // --- MODE COMPACT (Ingame HUD) ---
  if (compact) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          background: 'rgba(15, 15, 20, 0.6)',
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(251, 191, 36, 0.25)',
          borderRadius: 20,
        }}
      >
        <span style={{ fontSize: 12, lineHeight: 1 }}>💡</span>
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 12,
            fontWeight: 700,
            color: '#fbbf24',
          }}
        >
          {hintTokens}/{MAX_TOKENS}
        </span>
        {!isFull && countdown > 0 && (
          <span style={{ color: '#a8a29e', fontSize: 10, fontFamily: 'monospace' }}>
            ({seconds}s)
          </span>
        )}
      </div>
    );
  }

  // --- MODE FULL (Menu Utama - Dibuat Ringkas & Sleek) ---
  return (
    <div
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px',
        background: 'rgba(15, 15, 20, 0.65)',
        backdropFilter: 'blur(8px)',
        borderRadius: 20,
        border: '1px solid rgba(251, 191, 36, 0.25)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        cursor: 'default',
        userSelect: 'none',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Ikon Lampu dengan efek Glow jika Penuh */}
      <span
        style={{
          fontSize: '1rem',
          lineHeight: 1,
          filter: isFull ? 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.8))' : 'opacity(0.6)',
          transition: 'filter 0.3s ease',
        }}
      >
        💡
      </span>

      {/* Angka Counter */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
        <span
          style={{
            fontFamily: "'Eczar', 'Georgia', serif",
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#fbbf24',
            lineHeight: 1,
          }}
        >
          {hintTokens}
        </span>
        <span
          style={{
            fontFamily: "'Eczar', 'Georgia', serif",
            fontSize: '0.85rem',
            color: 'rgba(255, 255, 255, 0.4)',
            lineHeight: 1,
          }}
        >
          /{MAX_TOKENS}
        </span>
      </div>

      {/* Timer Kecil di Sebelah Angka Jika Belum Penuh */}
      {!isFull && countdown > 0 && (
        <span
          style={{
            color: '#78716c',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            marginLeft: 2,
          }}
        >
          +{seconds}s
        </span>
      )}

      {/* Tooltip Keterangan Saat Hover */}
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            bottom: '130%',
            right: 0,
            whiteSpace: 'nowrap',
            background: 'rgba(10, 10, 15, 0.95)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: 6,
            padding: '5px 10px',
            fontSize: '0.75rem',
            color: '#e8d5b7',
            fontFamily: 'sans-serif',
            boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
            pointerEvents: 'none',
            zIndex: 100,
          }}
        >
          {isFull
            ? 'Token Penuh!'
            : `Refill +1 token dalam ${seconds} detik`}
        </div>
      )}
    </div>
  );
}