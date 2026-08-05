import { useState, useEffect } from 'react';

const ANSWER = [2, 3, 75, 27];
const LABELS = ['', '', '°F', '%'];
const MIN    = [0, 0, 0, 0];
const MAX    = [99, 99, 999, 99];
const DEFAULT_VALUES = [5, 2, 78, 23]; // default baru sesuai permintaan
const STORAGE_KEY = 'puzzle2_arrow_values_v2';

interface Props {
  onSolve: () => void;
  onClose: () => void;
}

export function ArrowInputPuzzle({ onSolve, onClose }: Props) {
  const [values, setValues] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_VALUES;
    } catch {
      return DEFAULT_VALUES;
    }
  });
  const [solved, setSolved] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  }, [values]);

  const adjust = (idx: number, delta: number) => {
    if (solved) return;
    setValues((prev) => {
      const next = [...prev];
      next[idx] = Math.max(MIN[idx], Math.min(MAX[idx], next[idx] + delta));
      return next;
    });
  };

  const handleSubmit = () => {
    const correct = ANSWER.every((a, i) => values[i] === a);
    if (correct) {
      setSolved(true);
      localStorage.removeItem(STORAGE_KEY);
      setTimeout(onSolve, 1000);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Georgia', serif",
    }}>
      <div style={{
        background: 'linear-gradient(160deg, #0a0a1a, #1a1a2e)',
        border: '2px solid rgba(0,200,255,0.3)',
        borderRadius: 16, padding: '28px 32px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
        boxShadow: '0 0 40px rgba(0,200,255,0.15)',
        animation: shake ? 'shake 0.5s ease' : 'none',
      }}>
        <style>{`
          @keyframes shake {
            0%,100%{transform:translateX(0)}
            20%{transform:translateX(-8px)}
            40%{transform:translateX(8px)}
            60%{transform:translateX(-6px)}
            80%{transform:translateX(6px)}
          }
        `}</style>

        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#00c8ff', fontSize: 11, letterSpacing: 4, marginBottom: 4 }}>PARAMETER CONTROL</div>
          <div style={{ color: '#e8d5b7', fontSize: 20, fontWeight: 700, letterSpacing: 2 }}>Atur Kombinasi Parameter</div>
          <div style={{ color: '#6a6a8a', fontSize: 11, marginTop: 4, fontFamily: 'sans-serif' }}>Gunakan ▲ ▼ untuk mengubah nilai</div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          {values.map((val, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <button onClick={() => adjust(idx, 1)} style={{
                width: 52, height: 36,
                background: 'rgba(0,200,255,0.1)',
                border: '1px solid rgba(0,200,255,0.4)',
                borderRadius: 6, color: '#00c8ff',
                cursor: 'pointer', fontSize: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>▲</button>

              <div style={{
                width: 72, height: 64,
                background: 'rgba(0,0,0,0.5)',
                border: '2px solid rgba(0,200,255,0.5)',
                borderRadius: 8,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 10px rgba(0,200,255,0.2) inset',
              }}>
                <div style={{ color: '#00c8ff', fontSize: 24, fontWeight: 700, fontFamily: 'monospace' }}>
                  {val}
                </div>
                {LABELS[idx] && (
                  <div style={{ color: '#6a8aaa', fontSize: 11, fontFamily: 'sans-serif' }}>{LABELS[idx]}</div>
                )}
              </div>

              <button onClick={() => adjust(idx, -1)} style={{
                width: 52, height: 36,
                background: 'rgba(0,200,255,0.1)',
                border: '1px solid rgba(0,200,255,0.4)',
                borderRadius: 6, color: '#00c8ff',
                cursor: 'pointer', fontSize: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>▼</button>
            </div>
          ))}
        </div>

        {solved && <div style={{ color: '#00ff88', fontSize: 14, letterSpacing: 2 }}>✓ KOMBINASI BENAR!</div>}

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handleSubmit} disabled={solved} style={{
            padding: '10px 28px',
            background: 'linear-gradient(135deg, #00c8ff22, #00c8ff44)',
            border: '1px solid #00c8ff', borderRadius: 8, color: '#00c8ff',
            cursor: 'pointer', fontSize: 12, letterSpacing: 3, fontFamily: "'Georgia', serif",
          }}>KONFIRMASI</button>
          <button onClick={onClose} style={{
            padding: '10px 20px', background: 'transparent',
            border: '1px solid rgba(200,184,154,0.3)', borderRadius: 8, color: '#6a6a8a',
            cursor: 'pointer', fontSize: 12, letterSpacing: 2, fontFamily: "'Georgia', serif",
          }}>TUTUP</button>
        </div>
      </div>
    </div>
  );
}