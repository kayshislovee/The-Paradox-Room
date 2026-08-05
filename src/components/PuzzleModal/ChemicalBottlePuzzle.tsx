import { useState } from 'react';

const COLORS = ['biru', 'kuning', 'pink', 'merah', 'hijau', 'ungu', 'putih', 'orange'];

const COLOR_MAP: Record<string, string> = {
  biru:   '#2980b9',
  kuning: '#f1c40f',
  pink:   '#e91e8c',
  merah:  '#e74c3c',
  hijau:  '#27ae60',
  ungu:   '#8e44ad',
  putih:  '#ecf0f1',
  orange: '#e67e22',
};

// Jawaban: biru, kuning, biru, pink
const ANSWER = ['biru', 'kuning', 'biru', 'pink'];

interface Props {
  onSolve: () => void;
  onClose: () => void;
}

export function ChemicalBottlePuzzle({ onSolve, onClose }: Props) {
  const [bottles, setBottles] = useState<string[]>(['putih', 'putih', 'putih', 'putih']);
  const [solved, setSolved] = useState(false);
  const [shake, setShake] = useState(false);

  const handleClick = (idx: number) => {
    if (solved) return;
    setBottles((prev) => {
      const next = [...prev];
      const ci = COLORS.indexOf(next[idx]);
      next[idx] = COLORS[(ci + 1) % COLORS.length];
      return next;
    });
  };

  const handleSubmit = () => {
    const correct = ANSWER.every((c, i) => bottles[i] === c);
    if (correct) {
      setSolved(true);
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
            60%{transform:translateX(-8px)}
            80%{transform:translateX(8px)}
          }
          @keyframes bubble {
            0%,100%{transform:translateY(0)}
            50%{transform:translateY(-4px)}
          }
        `}</style>

        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#00c8ff', fontSize: 11, letterSpacing: 4, marginBottom: 4 }}>
            CHEMICAL BOTTLES
          </div>
          <div style={{ color: '#e8d5b7', fontSize: 20, fontWeight: 700, letterSpacing: 2 }}>
            Isi Botol dengan Cairan yang Benar
          </div>
          <div style={{ color: '#6a6a8a', fontSize: 11, marginTop: 4, fontFamily: 'sans-serif' }}>
            Klik botol untuk mengubah warna cairan
          </div>
        </div>

        {/* 4 Bottles */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end' }}>
          {bottles.map((color, idx) => (
            <div
              key={idx}
              onClick={() => handleClick(idx)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            >
              {/* Bottle shape */}
              <div style={{ position: 'relative', width: 56, height: 110 }}>
                {/* Bottle neck */}
                <div style={{
                  position: 'absolute', top: 0, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 20, height: 28,
                  background: 'rgba(180,220,255,0.15)',
                  border: '2px solid rgba(0,200,255,0.4)',
                  borderBottom: 'none',
                  borderRadius: '4px 4px 0 0',
                }} />
                {/* Bottle stopper */}
                <div style={{
                  position: 'absolute', top: -8, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 14, height: 10,
                  background: '#555',
                  border: '1px solid #777',
                  borderRadius: 2,
                }} />
                {/* Bottle body */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0,
                  width: 56, height: 80,
                  background: 'rgba(180,220,255,0.08)',
                  border: '2px solid rgba(0,200,255,0.4)',
                  borderRadius: '4px 4px 8px 8px',
                  overflow: 'hidden',
                }}>
                  {/* Liquid */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    height: '75%',
                    background: COLOR_MAP[color],
                    opacity: 0.85,
                    transition: 'background 0.3s ease',
                    animation: 'bubble 2s ease-in-out infinite',
                  }} />
                  {/* Glass shine */}
                  <div style={{
                    position: 'absolute', top: 8, left: 6,
                    width: 6, height: 30,
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: 3,
                  }} />
                </div>
                {/* Bottle number */}
                <div style={{
                  position: 'absolute', bottom: -24, left: '50%',
                  transform: 'translateX(-50%)',
                  color: '#6a8aaa', fontSize: 11,
                  fontFamily: 'sans-serif',
                }}>
                  #{idx + 1}
                </div>
              </div>

              {/* Color label */}
              <div style={{
                marginTop: 28,
                color: COLOR_MAP[color],
                fontSize: 10, letterSpacing: 1,
                fontFamily: 'sans-serif',
                textShadow: `0 0 8px ${COLOR_MAP[color]}`,
              }}>
                {color.toUpperCase()}
              </div>
            </div>
          ))}
        </div>

        {solved && (
          <div style={{ color: '#00ff88', fontSize: 14, letterSpacing: 2, marginTop: 8 }}>
            ✓ KOMBINASI BENAR!
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            onClick={handleSubmit}
            disabled={solved}
            style={{
              padding: '10px 28px',
              background: 'linear-gradient(135deg, #00c8ff22, #00c8ff44)',
              border: '1px solid #00c8ff',
              borderRadius: 8, color: '#00c8ff',
              cursor: 'pointer', fontSize: 12, letterSpacing: 3,
              fontFamily: "'Georgia', serif",
            }}
          >
            KONFIRMASI
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: '1px solid rgba(200,184,154,0.3)',
              borderRadius: 8, color: '#6a6a8a',
              cursor: 'pointer', fontSize: 12, letterSpacing: 2,
              fontFamily: "'Georgia', serif",
            }}
          >
            TUTUP
          </button>
        </div>
      </div>
    </div>
  );
}