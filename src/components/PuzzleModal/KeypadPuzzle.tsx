import { useState } from 'react';
import type { Puzzle } from '../../types/game.types';

interface Props {
  puzzle: Puzzle;
  onSolve: () => void;
}

export function KeypadPuzzle({ puzzle, onSolve }: Props) {
  const maxDigits = puzzle.maxDigits ?? 4;
  const [input, setInput] = useState('');
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [errorFlash, setErrorFlash] = useState(false);

  const handlePress = (val: string) => {
    if (input.length >= maxDigits || flash) return;
    setPressedKey(val);
    setTimeout(() => setPressedKey(null), 150);
    setInput((prev) => prev + val);
  };

  const handleDelete = () => {
    if (flash) return;
    setPressedKey('del');
    setTimeout(() => setPressedKey(null), 150);
    setInput((prev) => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (flash) return;
    if (input === puzzle.answer) {
      setFlash(true);
      setTimeout(onSolve, 1000);
    } else {
      setShake(true);
      setErrorFlash(true);
      setInput('');
      setTimeout(() => { setShake(false); setErrorFlash(false); }, 600);
    }
  };

  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16,
    }}>

      {/* Status line */}
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        padding: '6px 14px',
        background: 'rgba(0,0,0,0.35)',
        borderRadius: 7,
        border: '1px solid rgba(255,255,255,0.05)',
      }}>
        <span style={{ fontFamily: 'Courier New', fontSize: 9, color: '#334155', letterSpacing: 2 }}>
          SECURE KEYPAD
        </span>
        <span style={{
          fontFamily: 'Courier New', fontSize: 9, letterSpacing: 2,
          color: flash ? '#34d399' : errorFlash ? '#f87171' : '#38bdf8',
          textShadow: flash ? '0 0 8px #34d399' : errorFlash ? '0 0 8px #f87171' : 'none',
          transition: 'all 0.2s',
        }}>
          {flash ? '● UNLOCKED' : errorFlash ? '✕ DENIED' : `${input.length}/${maxDigits} DIGITS`}
        </span>
      </div>

      {/* Panel keypad */}
      <div style={{
        background: flash
          ? 'linear-gradient(160deg, #022c22 0%, #064e3b 100%)'
          : errorFlash
            ? 'linear-gradient(160deg, #1c0a0a 0%, #1f1315 100%)'
            : 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: 14,
        border: `1px solid ${flash
          ? 'rgba(52,211,153,0.4)'
          : errorFlash
            ? 'rgba(239,68,68,0.3)'
            : 'rgba(56,189,248,0.1)'}`,
        padding: '20px 18px',
        width: '100%',
        boxSizing: 'border-box' as const,
        boxShadow: flash
          ? '0 0 30px rgba(52,211,153,0.15), inset 0 0 40px rgba(52,211,153,0.05)'
          : errorFlash
            ? '0 0 20px rgba(239,68,68,0.15)'
            : '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
        animation: shake ? 'shakeKp 0.6s' : 'none',
        transition: 'all 0.4s ease',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Grid dots */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(56,189,248,0.06) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
          pointerEvents: 'none',
        }} />

        {/* Display input */}
        <div style={{
          background: 'rgba(0,0,0,0.55)',
          borderRadius: 9,
          padding: '14px 18px',
          marginBottom: 16,
          border: `1px solid ${flash
            ? 'rgba(52,211,153,0.3)'
            : errorFlash
              ? 'rgba(239,68,68,0.3)'
              : 'rgba(255,255,255,0.07)'}`,
          boxShadow: 'inset 0 3px 10px rgba(0,0,0,0.7)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Scanline */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)',
            pointerEvents: 'none',
          }} />

          <div style={{
            display: 'flex', gap: 10,
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 40,
          }}>
            {Array.from({ length: maxDigits }).map((_, i) => {
              const filled = i < input.length;
              const isActive = i === input.length && !flash;
              const dotColor = flash ? '#34d399' : errorFlash ? '#f87171' : '#38bdf8';

              return (
                <div key={i} style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 4,
                }}>
                  <div style={{
                    width: 10, height: 10,
                    borderRadius: '50%',
                    background: filled ? dotColor : 'transparent',
                    border: `1.5px solid ${filled ? dotColor : (isActive ? dotColor : '#1e293b')}`,
                    boxShadow: filled ? `0 0 10px ${dotColor}` : 'none',
                    transition: 'all 0.2s',
                    animation: isActive ? 'blinkCursor 1.1s ease-in-out infinite' : 'none',
                  }} />
                  <div style={{
                    width: 28, height: 1,
                    background: filled
                      ? `linear-gradient(90deg, transparent, ${dotColor}, transparent)`
                      : 'rgba(255,255,255,0.08)',
                    transition: 'all 0.2s',
                  }} />
                </div>
              );
            })}
          </div>

          {flash && (
            <div style={{
              textAlign: 'center', marginTop: 8,
              fontFamily: 'Courier New', fontSize: 11, fontWeight: 700,
              color: '#34d399', letterSpacing: 4,
              textShadow: '0 0 10px rgba(52,211,153,0.8)',
              animation: 'fadeInUp 0.3s',
            }}>
              ACCESS GRANTED
            </div>
          )}
        </div>

        {/* Grid tombol */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
          position: 'relative',
        }}>
          {keys.map((key, idx) => {
            if (key === '') {
              return <div key={idx} />;
            }
            const isBackspace = key === '⌫';
            const isPressed = pressedKey === (isBackspace ? 'del' : key);
            return (
              <NumKey
                key={idx}
                label={key}
                pressed={isPressed}
                isBackspace={isBackspace}
                flash={flash}
                onClick={() => {
                  if (isBackspace) handleDelete();
                  else handlePress(key);
                }}
              />
            );
          })}
        </div>

        {/* Tombol OK */}
        <button
          onClick={handleSubmit}
          disabled={input.length < maxDigits || flash}
          style={{
            width: '100%',
            marginTop: 8,
            padding: '11px 0',
            fontFamily: 'Courier New',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 3,
            cursor: (input.length < maxDigits || flash) ? 'not-allowed' : 'pointer',
            borderRadius: 8,
            border: `1px solid ${input.length === maxDigits && !flash
              ? 'rgba(56,189,248,0.45)'
              : 'rgba(255,255,255,0.05)'}`,
            background: flash
              ? 'rgba(52,211,153,0.1)'
              : input.length === maxDigits
                ? 'rgba(56,189,248,0.1)'
                : 'rgba(255,255,255,0.03)',
            color: flash
              ? '#34d399'
              : input.length === maxDigits
                ? '#38bdf8'
                : '#334155',
            boxShadow: input.length === maxDigits && !flash
              ? '0 0 16px rgba(56,189,248,0.18), inset 0 1px 0 rgba(56,189,248,0.08)'
              : 'none',
            textShadow: input.length === maxDigits && !flash
              ? '0 0 10px rgba(56,189,248,0.5)'
              : 'none',
            transition: 'all 0.2s',
          }}
        >
          ✓  CONFIRM
        </button>
      </div>

      <style>{`
        @keyframes shakeKp {
          0%,100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }
        @keyframes blinkCursor {
          0%,100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Num Key ──────────────────────────────────────────────────────────────────
function NumKey({ label, pressed, isBackspace, flash, onClick }: {
  label: string;
  pressed: boolean;
  isBackspace: boolean;
  flash: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={flash}
      style={{
        padding: '14px 0',
        fontFamily: isBackspace ? 'system-ui' : 'Courier New',
        fontSize: isBackspace ? 16 : 18,
        fontWeight: 700,
        cursor: flash ? 'default' : 'pointer',
        borderRadius: 8,
        border: `1px solid ${
          pressed
            ? 'rgba(56,189,248,0.5)'
            : hovered
              ? 'rgba(255,255,255,0.14)'
              : 'rgba(255,255,255,0.06)'
        }`,
        background: pressed
          ? 'rgba(56,189,248,0.12)'
          : hovered
            ? 'rgba(255,255,255,0.07)'
            : 'rgba(255,255,255,0.03)',
        color: flash
          ? '#1e3a2f'
          : isBackspace
            ? (hovered ? '#f87171' : '#ef4444')
            : (hovered ? '#e2e8f0' : '#94a3b8'),
        boxShadow: pressed
          ? 'inset 0 2px 6px rgba(0,0,0,0.5), 0 0 12px rgba(56,189,248,0.2)'
          : hovered
            ? '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)'
            : '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
        transform: pressed ? 'translateY(2px) scale(0.96)' : 'translateY(0) scale(1)',
        transition: 'all 0.12s ease',
        textShadow: hovered && !flash && !isBackspace
          ? '0 0 10px rgba(148,163,184,0.4)'
          : 'none',
      }}
    >
      {label}
    </button>
  );
}