import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';

// === Ganti path di bawah ini sesuai lokasi file aset gambar Anda ===
import bgFrameImg from '/objects/base.png';    // Gambar 1: Frame Oranye / Copper
import buttonBgImg from '/objects/tombol.png';  // Gambar 2: Basework Tombol Abu-abu
import outputBgImg from '/objects/output.png';  // Gambar 3: Frame Output Biru Gelap

const ANSWER = [2, 3, 75, 27];
const LABELS = ['', '', '°F', '%'];
const MIN = [0, 0, 0, 0];
const MAX = [99, 99, 999, 99];
const DEFAULT_VALUES = [5, 2, 78, 23];

interface Props {
  onSolve: () => void;
  onClose: () => void;
  onInputChange?: (input: number[]) => void;
  sharedInput?: number[];
  sharedBy?: string;
}

export function ArrowInputPuzzle({ onSolve, onClose, onInputChange, sharedInput, sharedBy }: Props) {
  const setPuzzleInputState = useGameStore((s) => s.setPuzzleInputState);
  const savedState = useGameStore((s) => s.puzzleInputStates['puzzle_arrow_input']);
  const [values, setValues] = useState<number[]>(savedState ?? DEFAULT_VALUES);
  const [solved, setSolved] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (sharedInput && Array.isArray(sharedInput) && sharedInput.length === values.length) {
      setValues(sharedInput);
    }
  }, [sharedInput]);

  const adjust = (idx: number, delta: number) => {
    if (solved) return;
    setValues((prev) => {
      const next = [...prev];
      next[idx] = Math.max(MIN[idx], Math.min(MAX[idx], next[idx] + delta));
      onInputChange?.(next);
      setPuzzleInputState('puzzle_arrow_input', next);
      return next;
    });
  };

  const handleSubmit = () => {
    const correct = ANSWER.every((a, i) => values[i] === a);
    if (correct) {
      setSolved(true);
      setTimeout(onSolve, 1000);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Georgia', serif",
      }}
    >
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .puzzle-btn {
          transition: transform 0.1s ease, filter 0.1s ease;
        }
        .puzzle-btn:active {
          transform: scale(0.93);
          filter: brightness(1.2);
        }
      `}</style>

      {/* Main Panel Box */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          animation: shake ? 'shake 0.5s ease' : 'none',
        }}
      >
        {/* Header Title */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#00c8ff', fontSize: 12, letterSpacing: 4, marginBottom: 4 }}>
            PARAMETER CONTROL
          </div>
          <div style={{ color: '#e8d5b7', fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>
            Atur Kombinasi Parameter
          </div>
          <div style={{ color: '#a0a0c0', fontSize: 12, marginTop: 4, fontFamily: 'sans-serif' }}>
            Gunakan ▲ ▼ untuk mengubah nilai
          </div>
        </div>

        {/* Gambar 1: Background Base Outer Frame */}
        <div
          style={{
            backgroundImage: `url(${bgFrameImg})`,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            padding: '36px 40px',
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            minWidth: 380,
            boxShadow: '0 0 30px rgba(0,200,255,0.2)',
          }}
        >
          {/* Shared status indicator */}
          {sharedBy && (
            <div
              style={{
                padding: '6px 16px',
                background: 'rgba(124, 58, 237, 0.3)',
                border: '1px solid rgba(167, 139, 250, 0.5)',
                borderRadius: 7,
                fontFamily: 'monospace',
                fontSize: 11,
                color: '#d8b4fe',
                letterSpacing: 1,
                textAlign: 'center',
              }}
            >
              ✏ {sharedBy} sedang mengatur parameter...
            </div>
          )}

          {/* Input Grid Columns */}
          <div style={{ display: 'flex', gap: 16 }}>
            {values.map((val, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                {/* Tombol Panah Atas (Gambar 2 Base) */}
                <button
                  className="puzzle-btn"
                  onClick={() => adjust(idx, 1)}
                  disabled={solved}
                  style={{
                    width: 60,
                    height: 54,
                    backgroundImage: `url(${buttonBgImg})`,
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#00c8ff',
                    cursor: solved ? 'default' : 'pointer',
                    fontSize: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textShadow: '0 0 8px rgba(0,200,255,0.8)',
                  }}
                >
                  ▲
                </button>

                {/* Box Output Nilai (Gambar 3 Base) */}
                <div
                  style={{
                    width: 72,
                    height: 68,
                    backgroundImage: `url(${outputBgImg})`,
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      color: '#00c8ff',
                      fontSize: 22,
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      textShadow: '0 0 10px rgba(0,200,255,0.6)',
                      lineHeight: 1,
                    }}
                  >
                    {val}
                  </div>
                  {LABELS[idx] && (
                    <div
                      style={{
                        color: '#7090b0',
                        fontSize: 11,
                        fontFamily: 'sans-serif',
                        marginTop: 2,
                      }}
                    >
                      {LABELS[idx]}
                    </div>
                  )}
                </div>

                {/* Tombol Panah Bawah (Gambar 2 Base) */}
                <button
                  className="puzzle-btn"
                  onClick={() => adjust(idx, -1)}
                  disabled={solved}
                  style={{
                    width: 60,
                    height: 54,
                    backgroundImage: `url(${buttonBgImg})`,
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#00c8ff',
                    cursor: solved ? 'default' : 'pointer',
                    fontSize: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textShadow: '0 0 8px rgba(0,200,255,0.8)',
                  }}
                >
                  ▼
                </button>
              </div>
            ))}
          </div>

          {/* Solved Banner */}
          {solved && (
            <div
              style={{
                color: '#00ff88',
                fontSize: 14,
                letterSpacing: 2,
                fontWeight: 700,
                textShadow: '0 0 10px rgba(0,255,136,0.6)',
                marginTop: 6,
              }}
            >
              ✓ KOMBINASI BENAR!
            </div>
          )}
        </div>

        {/* Action Buttons (Konfirmasi & Tutup) */}
        <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
          <button
            className="puzzle-btn"
            onClick={handleSubmit}
            disabled={solved}
            style={{
              padding: '10px 28px',
              background: 'linear-gradient(135deg, rgba(0,200,255,0.15), rgba(0,200,255,0.35))',
              border: '1px solid #00c8ff',
              borderRadius: 8,
              color: '#00c8ff',
              cursor: solved ? 'default' : 'pointer',
              fontSize: 12,
              letterSpacing: 2,
              fontWeight: 700,
              fontFamily: "'Georgia', serif",
              boxShadow: '0 0 15px rgba(0,200,255,0.2)',
            }}
          >
            KONFIRMASI
          </button>
          <button
            className="puzzle-btn"
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(200,184,154,0.3)',
              borderRadius: 8,
              color: '#a0a0b0',
              cursor: 'pointer',
              fontSize: 12,
              letterSpacing: 2,
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