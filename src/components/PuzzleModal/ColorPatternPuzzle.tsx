import { useState, useEffect, CSSProperties } from 'react';
import { useGameStore } from '../../store/gameStore';

const COLORS = ['merah', 'orange', 'kuning', 'hijau', 'pink', 'putih', 'biru', 'ungu'];
const COLOR_MAP: Record<string, string> = {
  merah: '#e74c3c',
  orange: '#e67e22',
  kuning: '#f1c40f',
  hijau: '#27ae60',
  pink: '#e91e8c',
  putih: '#ffffff',
  biru: '#2980b9',
  ungu: '#8e44ad',
};

const ANSWER = ['merah', 'orange', 'kuning', 'hijau', 'putih', 'hijau', 'hijau', 'pink', 'biru'];

interface Props {
  onSolve: () => void;
  onClose: () => void;
  onInputChange?: (input: string[]) => void;
  sharedInput?: string[];
  sharedBy?: string;
  bgImage?: string;
}

export function ColorPatternPuzzle({
  onSolve,
  onClose,
  onInputChange,
  sharedInput,
  sharedBy,
  bgImage = '/objects/codegarden2.png',
}: Props) {
  const setPuzzleInputState = useGameStore((s) => s.setPuzzleInputState);
  const savedState = useGameStore((s) => s.puzzleInputStates['puzzle_color_pattern']);
  const [grid, setGrid] = useState<string[]>(savedState ?? Array(9).fill('merah'));
  const [solved, setSolved] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (sharedInput && Array.isArray(sharedInput) && sharedInput.length === 9) {
      setGrid(sharedInput);
    }
  }, [sharedInput]);

  const handleClick = (idx: number) => {
    if (solved) return;
    setGrid((prev) => {
      const next = [...prev];
      const ci = COLORS.indexOf(next[idx]);
      next[idx] = COLORS[(ci + 1) % COLORS.length];
      onInputChange?.(next);
      setPuzzleInputState('puzzle_color_pattern', next);
      return next;
    });
  };

  const handleSubmit = () => {
    const correct = ANSWER.every((c, i) => grid[i] === c);
    if (correct) {
      setSolved(true);
      setTimeout(onSolve, 1000);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <div style={styles.overlay}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .color-box-interactive {
          transition: transform 0.15s ease, filter 0.15s ease, box-shadow 0.2s ease;
        }
        .color-box-interactive:hover {
          transform: scale(1.05);
          filter: brightness(1.15);
          z-index: 10;
        }
        .color-box-interactive:active {
          transform: scale(0.95);
        }
      `}</style>

      <div
        style={{
          ...styles.modalContainer,
          animation: shake ? 'shake 0.5s ease' : 'none',
        }}
      >
        {/* Status kolaborasi multiplayer */}
        {sharedBy && (
          <div style={styles.sharedBadge}>
            ✏ {sharedBy} sedang memilih warna...
          </div>
        )}

        {/* CONTAINER ASSET BASE PUZZLE */}
        <div style={{ ...styles.assetFrame, backgroundImage: `url(${bgImage})` }}>
          {/* CONTAINER PATTERN GRID (Ukuran pattern diatur dari sini) */}
          <div style={styles.patternContainer}>
            {grid.map((color, idx) => {
              const colorHex = COLOR_MAP[color] || '#ffffff';

              return (
                <button
                  key={idx}
                  type="button"
                  className="color-box-interactive"
                  onClick={() => handleClick(idx)}
                  title={`Klik untuk mengubah warna (Saat ini: ${color})`}
                  style={{
                    backgroundColor: colorHex,
                    border: '2px solid rgba(255, 255, 255, 0.7)',
                    borderRadius: '10px',
                    cursor: solved ? 'default' : 'pointer',
                    boxShadow: `0 0 12px ${colorHex}99, inset 0 0 8px rgba(0,0,0,0.25)`,
                    outline: 'none',
                    opacity: 0.88,
                    width: '100%',
                    height: '100%',
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* NOTIFIKASI JIKA PUZZLE SELESAI */}
        {solved && <div style={styles.solvedText}>✓ POLA BENAR!</div>}

        {/* TOMBOL AKSI */}
        <div style={styles.buttonGroup}>
          <button
            onClick={handleSubmit}
            disabled={solved}
            style={{
              ...styles.btnSubmit,
              opacity: solved ? 0.6 : 1,
              cursor: solved ? 'not-allowed' : 'pointer',
            }}
          >
            KONFIRMASI
          </button>
          <button onClick={onClose} style={styles.btnClose}>
            TUTUP
          </button>
        </div>
      </div>
    </div>
  );
}

// STYLES CSS-IN-JS
const styles: Record<string, CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 999,
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Georgia', serif",
  },
  modalContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: '12px',
    maxWidth: '100vw',
  },
  sharedBadge: {
    padding: '6px 14px',
    background: 'rgba(124, 58, 237, 0.25)',
    border: '1px solid rgba(124, 58, 237, 0.5)',
    borderRadius: 8,
    fontFamily: 'Courier New, monospace',
    fontSize: 11,
    color: '#c4b5fd',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  // FRAME ASSET BASE PUZZLE (Ukuran background tidak berubah)
  assetFrame: {
    position: 'relative',
    width: 'min(680px, 92vw, calc(100vh - 180px))',
    height: 'min(680px, 92vw, calc(100vh - 180px))',
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    filter: 'drop-shadow(0 0 25px rgba(0, 200, 255, 0.25))',
  },
  // SUB-CONTAINER PATTERN (Atur ukuran & presisi posisi kotak di sini)
  patternContainer: {
    position: 'absolute',
    top: '32%',       // Geser posisi vertikal
    left: '28%',      // Geser posisi horizontal
    width: '43%',     // Ubah nilai % ini untuk memperkecil/memperbesar pattern
    height: '40%',    // Ubah nilai % ini untuk menyesuaikan tinggi pattern
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gridTemplateRows: 'repeat(3, 1fr)',
    gap: '12px',      // Jarak antar kotak warna
  },
  solvedText: {
    color: '#00ff88',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 2,
    textShadow: '0 0 10px rgba(0, 255, 136, 0.5)',
  },
  buttonGroup: {
    display: 'flex',
    gap: 12,
    width: 'min(100%, 360px)',
  },
  btnSubmit: {
    flex: 1,
    padding: '12px 16px',
    background: 'linear-gradient(135deg, rgba(0, 200, 255, 0.2), rgba(0, 200, 255, 0.4))',
    border: '1px solid #00c8ff',
    borderRadius: 8,
    color: '#00c8ff',
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: 'bold',
    fontFamily: "'Georgia', serif",
    transition: 'all 0.2s',
  },
  btnClose: {
    flex: 1,
    padding: '12px 16px',
    background: 'transparent',
    border: '1px solid rgba(200, 184, 154, 0.4)',
    borderRadius: 8,
    color: '#a0a0c0',
    fontSize: 12,
    letterSpacing: 2,
    fontFamily: "'Georgia', serif",
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};