import { useState } from 'react';
import type { Puzzle } from '../../types/game.types';

interface Props {
  puzzle: Puzzle;
  onSolve: () => void;
}

export function LeverPuzzle({ puzzle, onSolve }: Props) {
  const answer = typeof puzzle.answer === 'string' ? puzzle.answer : puzzle.answer.join('');
  const leverCount = answer.length; // 8

  const [levers, setLevers] = useState<boolean[]>(Array(leverCount).fill(false));
  const [shaking, setShaking] = useState(false);
  const [flash, setFlash] = useState(false);

  const toggleLever = (i: number) => {
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
      setTimeout(() => onSolve(), 900);
    } else {
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
    }
  };

  const handleReset = () => setLevers(Array(leverCount).fill(false));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>

      {/* Panel frame */}
      <div style={{
        background: flash ? '#065f46' : '#1a1a2e',
        border: '3px solid #4a5568',
        borderRadius: 16,
        padding: '28px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        transition: 'background 0.4s',
        animation: shaking ? 'shake 0.6s' : 'none',
        boxShadow: '0 0 30px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.05)',
      }}>

        {/* Panel label */}
        <div style={{
          color: '#a78bfa',
          fontSize: 11,
          letterSpacing: 4,
          fontWeight: 700,
          textTransform: 'uppercase',
        }}>
           DOOR CONTROL SYSTEM 
        </div>

        {/* Lever row */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end' }}>
          {levers.map((isOn, i) => (
            <LeverSwitch
              key={i}
              index={i}
              isOn={isOn}
              onClick={() => toggleLever(i)}
            />
          ))}
        </div>

       

      

        {flash && (
          <div style={{
            color: '#10b981',
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 2,
            animation: 'pulse 0.5s',
          }}>
            ✅ AKSES DIBERIKAN
          </div>
        )}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={handleReset}
          style={{
            background: '#374151',
            border: '2px solid #4b5563',
            color: '#d1d5db',
            borderRadius: 10,
            padding: '10px 20px',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
           Reset
        </button>
        <button
          onClick={handleCheck}
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
            border: '2px solid #a78bfa',
            color: '#fff',
            borderRadius: 10,
            padding: '10px 24px',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 700,
            boxShadow: '0 0 15px rgba(124,58,237,0.4)',
          }}
        >
           Aktifkan Sistem
        </button>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

// ── Individual Lever ──────────────────────────────────────────────────────────
function LeverSwitch({ index, isOn, onClick }: {
  index: number;
  isOn: boolean;
  onClick: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      {/* Lever number */}
      <span style={{ color: '#6b7280', fontSize: 10, fontWeight: 600 }}>
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Lever slot */}
      <div
        onClick={onClick}
        title={`Tuas ${index + 1}: ${isOn ? 'NYALA' : 'MATI'}`}
        style={{
          width: 36,
          height: 80,
          background: '#0f172a',
          border: `2px solid ${isOn ? '#10b981' : '#374151'}`,
          borderRadius: 18,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: isOn ? 'flex-start' : 'flex-end',
          padding: 4,
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOn
            ? '0 0 12px rgba(16,185,129,0.5), inset 0 0 8px rgba(16,185,129,0.1)'
            : 'inset 0 0 8px rgba(0,0,0,0.3)',
          position: 'relative',
        }}
      >
        {/* Lever handle */}
        <div style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: isOn
            ? 'radial-gradient(circle at 35% 35%, #34d399, #059669)'
            : 'radial-gradient(circle at 35% 35%, #ef4444, #991b1b)',
          boxShadow: isOn
            ? '0 0 10px rgba(52,211,153,0.8)'
            : '0 0 6px rgba(239,68,68,0.5)',
          transition: 'all 0.25s',
          flexShrink: 0,
        }} />

        {/* Track line */}
        <div style={{
          position: 'absolute',
          width: 3,
          height: '65%',
          background: '#1e293b',
          borderRadius: 2,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 0,
        }} />
      </div>

      {/* ON/OFF label */}
      <span style={{
        color: isOn ? '#10b981' : '#ef4444',
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: 1,
        transition: 'color 0.2s',
      }}>
        {isOn ? 'ON' : 'OFF'}
      </span>
    </div>
  );
}
