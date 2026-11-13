import { useState, useEffect } from 'react';
import { useSFX } from '../../hooks/useSFX';

// ── SVG Symbols ───────────────────────────────────────────────────────────────
const SYMBOLS: Record<string, JSX.Element> = {
  bintang: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon
        points="20,3 24.9,14.6 37.6,15.5 28.2,23.6 31.3,36 20,29.2 8.7,36 11.8,23.6 2.4,15.5 15.1,14.6"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  segitiga: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon
        points="20,4 37,35 3,35"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  bulat: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  ),
  kotak: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="5" width="30" height="30" rx="2"
        stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  ),
  bulan: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M28 20a12 12 0 1 1-12-12 9 9 0 0 0 12 12z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  hati: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 34s-14-9.5-14-18a8 8 0 0 1 14-5.3A8 8 0 0 1 34 16c0 8.5-14 18-14 18z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
};

const SYMBOL_KEYS = Object.keys(SYMBOLS);

interface Props {
  answer: string[];           // e.g. ['bintang', 'segitiga', 'bulat']
  onSolve: () => void;
  onInputChange?: (input: string[]) => void;
  sharedInput?: string[];
  sharedBy?: string;
}

export function SymbolSequencePuzzle({ answer, onSolve, onInputChange, sharedInput, sharedBy }: Props) {
  const sfx = useSFX();
  const [selected, setSelected] = useState<string[]>([]);
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);

  // Sync dari player lain
  useEffect(() => {
    if (sharedInput) setSelected(sharedInput);
  }, [sharedInput]);

  const handleSelect = (symbol: string) => {
    if (flash || selected.length >= answer.length) return;
    sfx.playClick();
    const next = [...selected, symbol];
    setSelected(next);
    onInputChange?.(next);

    // Cek urutan salah di tengah
    if (next[next.length - 1] !== answer[next.length - 1]) {
      sfx.playError();
      setShake(true);
      setTimeout(() => {
        setSelected([]);
        onInputChange?.([]);
        setShake(false);
      }, 600);
      return;
    }

    // Semua benar
    if (next.length === answer.length) {
      sfx.playSuccess();
      setFlash(true);
      onInputChange?.([]);
      setTimeout(() => onSolve(), 1000);
    }
  };

  const handleReset = () => {
    if (flash) return;
    setSelected([]);
    onInputChange?.([]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

      {/* Indikator player lain */}
      {sharedBy && (
        <div style={{
          width: '100%', padding: '6px 14px',
          background: 'rgba(124,58,237,0.15)',
          border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: 7, fontFamily: 'Courier New',
          fontSize: 10, color: '#a78bfa', letterSpacing: 2, textAlign: 'center',
        }}>
          ✏ {sharedBy} sedang memilih simbol...
        </div>
      )}

      {/* Status bar */}
      <div style={{
        width: '100%', display: 'flex', justifyContent: 'space-between',
        padding: '8px 16px', background: 'rgba(0,0,0,0.4)',
        borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ fontFamily: 'Courier New', fontSize: 10, color: '#64748b', letterSpacing: 2 }}>
          SYMBOL LOCK
        </span>
        <span style={{
          fontFamily: 'Courier New', fontSize: 10, letterSpacing: 2,
          color: flash ? '#34d399' : shake ? '#f87171' : '#38bdf8',
          transition: 'color 0.3s',
        }}>
          {flash ? '● UNLOCKED' : shake ? '✕ WRONG' : `${selected.length}/${answer.length} INPUT`}
        </span>
      </div>

      {/* Slot display */}
      <div style={{
        display: 'flex', gap: 12, justifyContent: 'center',
        padding: '16px 20px',
        background: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        border: `1px solid ${flash ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.07)'}`,
        width: '100%', boxSizing: 'border-box',
        animation: shake ? 'shakeSymbol 0.6s' : 'none',
        transition: 'border-color 0.4s',
      }}>
        {answer.map((_, i) => {
          const filled = selected[i];
          const isActive = i === selected.length && !flash;
          return (
            <div key={i} style={{
              width: 52, height: 52,
              borderRadius: 10,
              border: `1.5px solid ${filled
                ? (flash ? 'rgba(52,211,153,0.6)' : 'rgba(56,189,248,0.5)')
                : isActive
                  ? 'rgba(255,255,255,0.2)'
                  : 'rgba(255,255,255,0.06)'}`,
              background: filled
                ? (flash ? 'rgba(52,211,153,0.1)' : 'rgba(56,189,248,0.08)')
                : 'rgba(255,255,255,0.02)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: flash ? '#34d399' : '#38bdf8',
              transition: 'all 0.25s',
              boxShadow: filled && !flash
                ? '0 0 10px rgba(56,189,248,0.15)'
                : filled && flash
                  ? '0 0 12px rgba(52,211,153,0.3)'
                  : 'none',
            }}>
              {filled
                ? <div style={{ width: 32, height: 32 }}>{SYMBOLS[filled]}</div>
                : isActive
                  ? <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', animation: 'blinkDot 1s infinite' }} />
                  : null
              }
            </div>
          );
        })}
      </div>

      {/* Grid simbol */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10, width: '100%',
      }}>
        {SYMBOL_KEYS.map((key) => (
          <SymbolBtn
            key={key}
            symbolKey={key}
            symbol={SYMBOLS[key]}
            disabled={flash || selected.length >= answer.length}
            onClick={() => handleSelect(key)}
          />
        ))}
      </div>

      {/* Reset button */}
      <button
        onClick={handleReset}
        disabled={flash || selected.length === 0}
        style={{
          width: '100%', padding: '10px 0',
          fontFamily: 'Courier New', fontSize: 11, letterSpacing: 3,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8, color: '#475569',
          cursor: flash || selected.length === 0 ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s',
        }}
      >
        ↺ RESET
      </button>

      <style>{`
        @keyframes shakeSymbol {
          0%,100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }
        @keyframes blinkDot {
          0%,100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function SymbolBtn({ symbolKey, symbol, disabled, onClick }: {
  symbolKey: string;
  symbol: JSX.Element;
  disabled: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={() => {
        if (disabled) return;
        setPressed(true);
        setTimeout(() => setPressed(false), 150);
        onClick();
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      style={{
        padding: '14px 0',
        background: pressed
          ? 'rgba(56,189,248,0.12)'
          : hovered
            ? 'rgba(255,255,255,0.07)'
            : 'rgba(255,255,255,0.03)',
        border: `1px solid ${pressed || hovered
          ? 'rgba(56,189,248,0.4)'
          : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: hovered ? '#38bdf8' : '#64748b',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 6,
        transform: pressed ? 'scale(0.94)' : 'scale(1)',
        transition: 'all 0.12s ease',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <div style={{ width: 32, height: 32 }}>{symbol}</div>
      <span style={{ fontFamily: 'Courier New', fontSize: 8, letterSpacing: 2, textTransform: 'uppercase' }}>
        {symbolKey}
      </span>
    </button>
  );
}