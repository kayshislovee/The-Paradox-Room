import { useState } from 'react';
import type { Puzzle } from '../../types/game.types';
import { useSFX } from '../../hooks/useSFX';

interface Props {
  puzzle: Puzzle;
  onSolve: () => void;
}

export function KeypadPuzzle({ puzzle, onSolve }: Props) {
  const sfx = useSFX();
  const maxDigits = puzzle.maxDigits ?? 4;
  const [input, setInput] = useState('');
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [errorFlash, setErrorFlash] = useState(false);

  const handlePress = (val: string) => {
      sfx.playClick();
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
      sfx.playSuccess(); 
      setFlash(true);
      setTimeout(onSolve, 1000);
    } else {
      sfx.playError(); 
      setShake(true);
      setErrorFlash(true);
      setInput('');
      setTimeout(() => { setShake(false); setErrorFlash(false); }, 600);
    }
  };

  // ✓ di posisi index 10 (antara * dan 0), ⌫ di posisi 11
  const keys = ['1','2','3','4','5','6','7','8','9','✓','0','⌫'];

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

        {/* Display input — tampilkan angka asli */}
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
              const char = input[i];
              const isActive = i === input.length && !flash;
              const dotColor = flash ? '#34d399' : errorFlash ? '#f87171' : '#38bdf8';

              return (
                <div key={i} style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 4,
                }}>
                  {/* Angka asli ditampilkan */}
                  <span style={{
                    fontFamily: 'Courier New',
                    fontSize: 22,
                    fontWeight: 700,
                    color: dotColor,
                    textShadow: char ? `0 0 10px ${dotColor}` : 'none',
                    minWidth: 16,
                    textAlign: 'center',
                    minHeight: 28,
                    display: 'block',
                    animation: isActive ? 'blinkCursor 1.1s ease-in-out infinite' : 'none',
                    opacity: char ? 1 : (isActive ? 0.4 : 0.1),
                  }}>
                    {char ?? (isActive ? '|' : '_')}
                  </span>
                  <div style={{
                    width: 28, height: 1,
                    background: char
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

        {/* Grid tombol 3 kolom */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
          position: 'relative',
        }}>
          {keys.map((key, idx) => {
            const isBackspace = key === '⌫';
            const isConfirm = key === '✓';
            const isStar = key === '*';
            const isPressed = pressedKey === (isBackspace ? 'del' : key);

            return (
              <NumKey
                key={idx}
                label={key}
                pressed={isPressed}
                isBackspace={isBackspace}
                isConfirm={isConfirm}
                isStar={isStar}
                flash={flash}
                disabled={isConfirm
                  ? input.length < maxDigits || flash
                  : isStar
                  ? true
                  : flash}
                onClick={() => {
                  if (isConfirm) handleSubmit();
                  else if (isBackspace) handleDelete();
                  else if (!isStar) handlePress(key);
                }}
              />
            );
          })}
        </div>
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
function NumKey({ label, pressed, isBackspace, isConfirm, isStar, flash, disabled, onClick }: {
  label: string;
  pressed: boolean;
  isBackspace: boolean;
  isConfirm: boolean;
  isStar: boolean;
  flash: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const getBg = () => {
    if (isConfirm) {
      if (disabled) return 'rgba(255,255,255,0.02)';
      if (pressed) return 'rgba(16,185,129,0.2)';
      if (hovered) return 'rgba(16,185,129,0.15)';
      return 'rgba(16,185,129,0.08)';
    }
    if (pressed) return 'rgba(56,189,248,0.12)';
    if (hovered) return 'rgba(255,255,255,0.07)';
    return 'rgba(255,255,255,0.03)';
  };

  const getBorder = () => {
    if (isConfirm) {
      if (disabled) return 'rgba(255,255,255,0.04)';
      if (pressed || hovered) return 'rgba(16,185,129,0.6)';
      return 'rgba(16,185,129,0.3)';
    }
    if (pressed) return 'rgba(56,189,248,0.5)';
    if (hovered) return 'rgba(255,255,255,0.14)';
    return 'rgba(255,255,255,0.06)';
  };

  const getColor = () => {
    if (isConfirm) return disabled ? '#1e3a2f' : '#10b981';
    if (isStar) return '#1e293b';
    if (flash) return '#1e3a2f';
    if (isBackspace) return hovered ? '#f87171' : '#ef4444';
    return hovered ? '#e2e8f0' : '#94a3b8';
  };

  const getShadow = () => {
    if (isConfirm && !disabled) {
      return pressed
        ? 'inset 0 2px 6px rgba(0,0,0,0.5), 0 0 12px rgba(16,185,129,0.3)'
        : hovered
        ? '0 4px 12px rgba(0,0,0,0.4), 0 0 16px rgba(16,185,129,0.2)'
        : '0 0 8px rgba(16,185,129,0.1)';
    }
    if (pressed) return 'inset 0 2px 6px rgba(0,0,0,0.5), 0 0 12px rgba(56,189,248,0.2)';
    if (hovered) return '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)';
    return '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)';
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      style={{
        padding: '14px 0',
        fontFamily: isBackspace ? 'system-ui' : 'Courier New',
        fontSize: isBackspace ? 16 : isConfirm ? 20 : 18,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        borderRadius: 8,
        border: `1px solid ${getBorder()}`,
        background: getBg(),
        color: getColor(),
        boxShadow: getShadow(),
        transform: pressed ? 'translateY(2px) scale(0.96)' : 'translateY(0) scale(1)',
        transition: 'all 0.12s ease',
        textShadow: isConfirm && !disabled
          ? `0 0 10px rgba(16,185,129,0.6)`
          : hovered && !flash && !isBackspace && !isConfirm
          ? '0 0 10px rgba(148,163,184,0.4)'
          : 'none',
      }}
    >
      {label}
    </button>
  );
}