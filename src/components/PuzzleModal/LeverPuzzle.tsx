import { useState } from 'react';
import type { Puzzle } from '../../types/game.types';

interface Props {
  puzzle: Puzzle;
  onSolve: () => void;
}

export function LeverPuzzle({ puzzle, onSolve }: Props) {
  const answer = typeof puzzle.answer === 'string' ? puzzle.answer : puzzle.answer.join('');
  const leverCount = answer.length;

  const [levers, setLevers] = useState<boolean[]>(Array(leverCount).fill(false));
  const [shaking, setShaking] = useState(false);
  const [flash, setFlash] = useState(false);

  const toggleLever = (i: number) => {
    if (flash) return;
    setLevers((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  const handleCheck = () => {
    const playerPattern = levers.map((on) => (on ? '1' : '0')).join('');
    if (playerPattern === answer) {
      setFlash(true);
      setTimeout(() => onSolve(), 1000);
    } else {
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
    }
  };

  const handleReset = () => {
    if (flash) return;
    setLevers(Array(leverCount).fill(false));
  };

  const activeCount = levers.filter(Boolean).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

      {/* Status bar atas */}
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        background: 'rgba(0,0,0,0.4)',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ fontFamily: 'Courier New', fontSize: 10, color: '#64748b', letterSpacing: 2 }}>
          CIRCUIT BOARD v2.4
        </span>
        <span style={{
          fontFamily: 'Courier New', fontSize: 10,
          color: flash ? '#34d399' : activeCount > 0 ? '#fbbf24' : '#475569',
          letterSpacing: 2,
          textShadow: flash ? '0 0 8px #34d399' : 'none',
          transition: 'all 0.3s',
        }}>
          {flash ? '● UNLOCKED' : `${activeCount}/${leverCount} ACTIVE`}
        </span>
      </div>

      {/* Panel utama */}
      <div style={{
        width: '100%',
        background: flash
          ? 'linear-gradient(160deg, #022c22 0%, #064e3b 100%)'
          : 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: 14,
        border: `1px solid ${flash ? 'rgba(52,211,153,0.4)' : 'rgba(99,179,237,0.12)'}`,
        padding: '24px 20px 20px',
        boxShadow: flash
          ? '0 0 30px rgba(52,211,153,0.2), inset 0 0 60px rgba(52,211,153,0.05)'
          : '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
        animation: shaking ? 'shake 0.6s' : 'none',
        transition: 'all 0.5s ease',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Grid dots background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(56,189,248,0.08) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          pointerEvents: 'none',
        }} />

        {/* Label panel */}
        <div style={{
          textAlign: 'center',
          marginBottom: 20,
          position: 'relative',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(0,0,0,0.4)',
            border: `1px solid ${flash ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 20,
            padding: '4px 16px',
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: flash ? '#34d399' : '#38bdf8',
              boxShadow: flash ? '0 0 8px #34d399' : '0 0 6px #38bdf8',
              animation: 'pulse-dot 1.5s ease-in-out infinite',
            }} />
            <span style={{
              fontFamily: 'Courier New', fontSize: 9,
              color: flash ? '#6ee7b7' : '#64748b',
              letterSpacing: 3, textTransform: 'uppercase',
            }}>
              {flash ? 'SISTEM AKTIF' : 'PANEL KONTROL'}
            </span>
          </div>
        </div>

        {/* Levers row */}
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          flexWrap: 'wrap',
          position: 'relative',
        }}>
          {levers.map((isOn, i) => (
            <Lever3D
              key={i}
              index={i}
              isOn={isOn}
              flash={flash}
              onClick={() => toggleLever(i)}
            />
          ))}
        </div>

        {/* Binary display bawah */}
        <div style={{
          marginTop: 20,
          display: 'flex',
          gap: 4,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {levers.map((isOn, i) => (
            <div key={i} style={{
              width: 20, height: 20,
              borderRadius: 4,
              background: isOn
                ? (flash ? 'rgba(52,211,153,0.3)' : 'rgba(56,189,248,0.25)')
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isOn
                ? (flash ? 'rgba(52,211,153,0.6)' : 'rgba(56,189,248,0.5)')
                : 'rgba(255,255,255,0.07)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.25s',
              boxShadow: isOn && !flash ? '0 0 8px rgba(56,189,248,0.3)' : 'none',
            }}>
              <span style={{
                fontFamily: 'Courier New', fontSize: 9, fontWeight: 700,
                color: isOn
                  ? (flash ? '#34d399' : '#38bdf8')
                  : '#1e293b',
                transition: 'all 0.25s',
              }}>
                {isOn ? '1' : '0'}
              </span>
            </div>
          ))}
        </div>

        {flash && (
          <div style={{
            textAlign: 'center', marginTop: 16,
            fontFamily: 'Courier New', fontSize: 13, fontWeight: 700,
            color: '#34d399', letterSpacing: 4,
            textShadow: '0 0 16px rgba(52,211,153,0.8)',
            animation: 'fadeIn 0.4s',
          }}>
            ✓ AKSES DIBERIKAN
          </div>
        )}
      </div>

      {/* Tombol aksi */}
      <div style={{ display: 'flex', gap: 10, width: '100%' }}>
        <ActionBtn
          label="↺  RESET"
          onClick={handleReset}
          disabled={flash}
          variant="secondary"
        />
        <ActionBtn
          label="⚡  AKTIFKAN"
          onClick={handleCheck}
          disabled={flash}
          variant="primary"
        />
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }
        @keyframes pulse-dot {
          0%,100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Lever 3D ────────────────────────────────────────────────────────────────
function Lever3D({ index, isOn, onClick, flash }: {
  index: number;
  isOn: boolean;
  onClick: () => void;
  flash: boolean;
}) {
  const [pressed, setPressed] = useState(false);

  const color = flash ? '#34d399' : '#38bdf8';
  const colorDark = flash ? '#059669' : '#0284c7';
  const colorGlow = flash ? 'rgba(52,211,153,0.6)' : 'rgba(56,189,248,0.5)';

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 6,
        userSelect: 'none',
      }}
      onClick={() => {
        if (flash) return;
        setPressed(true);
        setTimeout(() => setPressed(false), 180);
        onClick();
      }}
    >
      {/* Index label */}
      <span style={{
        fontFamily: 'Courier New', fontSize: 8, fontWeight: 700,
        color: isOn ? color : '#334155',
        letterSpacing: 1,
        transition: 'color 0.3s',
      }}>
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Lever housing */}
      <div style={{
        width: 34, height: 76,
        borderRadius: 17,
        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        border: `1px solid ${isOn ? colorGlow : 'rgba(255,255,255,0.06)'}`,
        boxShadow: isOn
          ? `0 0 12px ${colorGlow}, inset 0 2px 8px rgba(0,0,0,0.6)`
          : 'inset 0 2px 8px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.4)',
        position: 'relative',
        cursor: flash ? 'default' : 'pointer',
        transition: 'all 0.3s',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: isOn ? 'flex-start' : 'flex-end',
        padding: 4,
        alignItems: 'center',
      }}>
        {/* Track groove */}
        <div style={{
          position: 'absolute',
          left: '50%', top: '12%', bottom: '12%',
          width: 3,
          transform: 'translateX(-50%)',
          background: 'linear-gradient(180deg, #0a0a0a, #1e293b, #0a0a0a)',
          borderRadius: 2,
        }} />

        {/* Handle knob — 3D sphere */}
        <div style={{
          width: 26, height: 26,
          borderRadius: '50%',
          background: isOn
            ? `radial-gradient(circle at 35% 30%, ${color}, ${colorDark})`
            : 'radial-gradient(circle at 35% 30%, #475569, #1e293b)',
          boxShadow: isOn
            ? `0 2px 8px rgba(0,0,0,0.6), 0 0 12px ${colorGlow}, inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.3)`
            : '0 2px 8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.3)',
          transition: 'all 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: pressed ? 'scale(0.88)' : 'scale(1)',
          position: 'relative',
          zIndex: 1,
          flexShrink: 0,
        }}>
          {/* Specular highlight */}
          <div style={{
            position: 'absolute',
            top: 4, left: 5,
            width: 8, height: 5,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.3)',
            filter: 'blur(2px)',
          }} />
        </div>
      </div>

      {/* ON / OFF label */}
      <span style={{
        fontFamily: 'Courier New', fontSize: 7, fontWeight: 800,
        color: isOn ? color : '#1e293b',
        letterSpacing: 1,
        textShadow: isOn ? `0 0 8px ${colorGlow}` : 'none',
        transition: 'all 0.3s',
      }}>
        {isOn ? 'ON' : 'OFF'}
      </span>
    </div>
  );
}

// ── Action Button ────────────────────────────────────────────────────────────
function ActionBtn({ label, onClick, disabled, variant }: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant: 'primary' | 'secondary';
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const isPrimary = variant === 'primary';

  return (
    <button
      onClick={() => {
        if (disabled) return;
        setPressed(true);
        setTimeout(() => setPressed(false), 160);
        onClick();
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      disabled={disabled}
      style={{
        flex: isPrimary ? 2 : 1,
        padding: '11px 0',
        fontFamily: 'Courier New',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 2.5,
        textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
        borderRadius: 8,
        border: `1px solid ${disabled
          ? 'rgba(255,255,255,0.04)'
          : isPrimary
            ? (hovered ? 'rgba(56,189,248,0.6)' : 'rgba(56,189,248,0.25)')
            : (hovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)')}`,
        background: disabled
          ? 'rgba(0,0,0,0.2)'
          : pressed
            ? (isPrimary ? 'rgba(56,189,248,0.08)' : 'rgba(255,255,255,0.03)')
            : hovered
              ? (isPrimary ? 'rgba(56,189,248,0.14)' : 'rgba(255,255,255,0.07)')
              : (isPrimary ? 'rgba(56,189,248,0.07)' : 'rgba(255,255,255,0.04)'),
        color: disabled
          ? '#334155'
          : isPrimary
            ? (hovered ? '#7dd3fc' : '#38bdf8')
            : (hovered ? '#94a3b8' : '#64748b'),
        boxShadow: disabled || !isPrimary ? 'none'
          : hovered
            ? '0 0 20px rgba(56,189,248,0.2), inset 0 1px 0 rgba(56,189,248,0.1)'
            : '0 0 10px rgba(56,189,248,0.08)',
        transform: pressed ? 'translateY(1px)' : 'translateY(0)',
        transition: 'all 0.15s ease',
        textShadow: isPrimary && !disabled && hovered ? '0 0 10px rgba(56,189,248,0.6)' : 'none',
      }}
    >
      {label}
    </button>
  );
}