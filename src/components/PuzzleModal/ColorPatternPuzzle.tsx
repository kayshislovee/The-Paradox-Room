import { useState, useEffect } from 'react';

const COLORS = ['merah', 'orange', 'kuning', 'hijau', 'pink', 'putih', 'biru', 'ungu'];

const COLOR_MAP: Record<string, string> = {
  merah:  '#e74c3c',
  orange: '#e67e22',
  kuning: '#f1c40f',
  hijau:  '#27ae60',
  pink:   '#e91e8c',
  putih:  '#ecf0f1',
  biru:   '#2980b9',
  ungu:   '#8e44ad',
};

const ANSWER = ['merah','orange','kuning','hijau','putih','hijau','hijau','pink','biru'];
const STORAGE_KEY = 'puzzle1_color_grid';

interface Props {
  onSolve: () => void;
  onClose: () => void;
}

export function ColorPatternPuzzle({ onSolve, onClose }: Props) {
  const [grid, setGrid] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : Array(9).fill('merah');
    } catch {
      return Array(9).fill('merah');
    }
  });
  const [solved, setSolved] = useState(false);
  const [shake, setShake] = useState(false);

  // Simpan ke localStorage setiap grid berubah
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(grid));
  }, [grid]);

  const handleClick = (idx: number) => {
    if (solved) return;
    setGrid((prev) => {
      const next = [...prev];
      const ci = COLORS.indexOf(next[idx]);
      next[idx] = COLORS[(ci + 1) % COLORS.length];
      return next;
    });
  };

  const handleSubmit = () => {
    const correct = ANSWER.every((c, i) => grid[i] === c);
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
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
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
          <div style={{ color: '#00c8ff', fontSize: 11, letterSpacing: 4, marginBottom: 4 }}>COLOR PATTERN PUZZLE</div>
          <div style={{ color: '#e8d5b7', fontSize: 20, fontWeight: 700, letterSpacing: 2 }}>Cocokkan Pola Warna Bunga</div>
          <div style={{ color: '#6a6a8a', fontSize: 11, marginTop: 4, fontFamily: 'sans-serif' }}>Klik kotak untuk mengubah warna</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 80px)', gap: 10 }}>
          {grid.map((color, idx) => (
            <button
              key={idx}
              onClick={() => handleClick(idx)}
              style={{
                width: 80, height: 80,
                background: COLOR_MAP[color],
                border: '3px solid rgba(255,255,255,0.2)',
                borderRadius: 10, cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: `0 0 15px ${COLOR_MAP[color]}66`,
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            />
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 280 }}>
          {COLORS.map((c) => (
            <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: COLOR_MAP[c], border: '1px solid rgba(255,255,255,0.2)' }} />
              <span style={{ color: '#8a8aaa', fontSize: 10, fontFamily: 'sans-serif' }}>{c}</span>
            </div>
          ))}
        </div>

        {solved && <div style={{ color: '#00ff88', fontSize: 14, letterSpacing: 2 }}>✓ POLA BENAR!</div>}

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