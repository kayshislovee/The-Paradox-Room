import { useState, useCallback } from 'react';
import { useSFX } from '../../hooks/useSFX';

interface Props {
  onSuccess: () => void;
  onClose: () => void;
}

type Connections = [boolean, boolean, boolean, boolean]; // [atas, kanan, bawah, kiri]

interface Node {
  id: string;
  connections: Connections;
  rotation: number; // 0, 1, 2, 3 (x90°)
  type: 'input' | 'output' | 'node' | 'empty';
  label?: string;
}

// Rotasi koneksi 90° searah jarum jam
function rotate(conn: Connections): Connections {
  return [conn[3], conn[0], conn[1], conn[2]];
}

function getRotatedConnections(conn: Connections, rot: number): Connections {
  let c = conn;
  for (let i = 0; i < rot; i++) c = rotate(c);
  return c;
}

// Cek apakah dua node terhubung di sisi tertentu
// side: 0=atas, 1=kanan, 2=bawah, 3=kiri
function connected(a: Connections, b: Connections, side: number): boolean {
  const opposite = [2, 3, 0, 1];
  return a[side] && b[opposite[side]];
}

const INITIAL_GRID: { type: Node['type']; conn: Connections; label?: string; rotatable: boolean }[][] = [
  [
    { type: 'empty', conn: [false, false, false, false], rotatable: false },
    { type: 'empty', conn: [false, false, false, false], rotatable: false },
    { type: 'empty', conn: [false, false, false, false], rotatable: false },
    { type: 'empty', conn: [false, false, false, false], rotatable: false },
    { type: 'empty', conn: [false, false, false, false], rotatable: false },
  ],
  [
    { type: 'input', conn: [false, true, false, false], label: 'A', rotatable: false },
    { type: 'node', conn: [false, true, true, true], rotatable: true },   // T-Junction: kanan + bawah + kiri
    { type: 'node', conn: [false, true, false, true], rotatable: true }, // Lurus: kanan + kiri
    { type: 'node', conn: [true, true, false, true], rotatable: true },  // T-Junction: atas + kanan + kiri
    { type: 'output', conn: [false, false, false, true], label: 'X', rotatable: false },
  ],
  [
    { type: 'input', conn: [false, true, false, false], label: 'B', rotatable: false },
    { type: 'node', conn: [false, true, false, true], rotatable: true }, // Lurus: kanan + kiri
    { type: 'node', conn: [true, true, true, true], rotatable: true },  // Cross: semua arah
    { type: 'node', conn: [false, true, false, true], rotatable: true }, // Lurus: kanan + kiri
    { type: 'output', conn: [false, false, false, true], label: 'Y', rotatable: false },
  ],
  [
    { type: 'input', conn: [false, true, false, false], label: 'C', rotatable: false },
    { type: 'node', conn: [true, true, false, true], rotatable: true },  // T-Junction: atas + kanan + kiri
    { type: 'node', conn: [false, true, false, true], rotatable: true }, // Lurus: kanan + kiri
    { type: 'node', conn: [false, true, true, true], rotatable: true }, // T-Junction: kanan + bawah + kiri
    { type: 'output', conn: [false, false, false, true], label: 'Z', rotatable: false },
  ],
  [
    { type: 'empty', conn: [false, false, false, false], rotatable: false },
    { type: 'empty', conn: [false, false, false, false], rotatable: false },
    { type: 'empty', conn: [false, false, false, false], rotatable: false },
    { type: 'empty', conn: [false, false, false, false], rotatable: false },
    { type: 'empty', conn: [false, false, false, false], rotatable: false },
  ],
];

const PATH_COLORS = {
  X: '#38bdf8',
  Y: '#a78bfa',
  Z: '#34d399',
} as const;
type PathColorKey = keyof typeof PATH_COLORS;

const CELL_SIZE = 64;
const CENTER = 32;
const PADDING = 4;

export function HackingMinigame({ onSuccess, onClose }: Props) {
  const sfx = useSFX();

  // Inisialisasi rotasi acak untuk node yang bisa dirotasi
  const [rotations, setRotations] = useState<number[][]>(() =>
    INITIAL_GRID.map((row, _r) =>
      row.map((cell, _c) => {
        if (!cell.rotatable) return 0;
        // Acak rotasi awal (hindari langsung benar)
        const rnd = Math.floor(Math.random() * 3) + 1;
        return (0 + rnd) % 4;
      })
    )
  );

  const [solved, setSolved] = useState(false);
  const [solvedPaths, setSolvedPaths] = useState<Set<string>>(new Set());

  // Warna per jalur berdasarkan label output
  const getPathColor = (label: PathColorKey): string => PATH_COLORS[label] || '#647489';

  // Cek koneksi dari input ke output
  const checkConnections = useCallback(
    (rots: number[][]) => {
      const newSolved = new Set<string>();

      // Untuk setiap baris input (row 1,2,3) cek jalur ke output
      for (let inputRow = 1; inputRow <= 3; inputRow++) {
        // Trace dari col 0 ke col 4
        let canReach = true;

        for (let col = 0; col < 4; col++) {
          const curr = getRotatedConnections(
            INITIAL_GRID[inputRow][col].conn,
            rots[inputRow][col]
          );
          const next = getRotatedConnections(
            INITIAL_GRID[inputRow][col + 1].conn,
            rots[inputRow][col + 1]
          );

          if (!connected(curr, next, 1)) { // cek sisi kanan (1)
            canReach = false;
            break;
          }
        }

        if (canReach) {
          // Output label berdasarkan inputRow: 1→X, 2→Y, 3→Z
          const outputLabel = ['X', 'Y', 'Z'][inputRow - 1];
          newSolved.add(outputLabel);
        }
      }

      setSolvedPaths(newSolved);

      if (newSolved.has('X') && newSolved.has('Y') && newSolved.has('Z')) {
        setSolved(true);
        sfx.playSuccess();
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    },
    []
  );

  const handleRotate = useCallback(
    (row: number, col: number) => {
      if (solved) return;
      if (!INITIAL_GRID[row][col].rotatable) return;
      sfx.playClick();

      setRotations((prev) => {
        const next = prev.map((r) => [...r]);
        next[row][col] = (next[row][col] + 1) % 4;
        checkConnections(next);
        return next;
      });
    },
    [solved, checkConnections]
  );

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, backdropFilter: 'blur(12px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(160deg, #0a0f1e 0%, #111827 100%)',
          border: '1px solid rgba(56,189,248,0.2)',
          borderRadius: 16,
          padding: '28px 32px',
          display: 'flex', flexDirection: 'column', gap: 24,
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03) inset',
          width: 720, maxWidth: '95vw',
          maxHeight: '85vh', overflowY: 'auto',
          animation: 'slideUp 0.3s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{
              margin: 0,
              fontFamily: 'Courier New, monospace',
              fontSize: 11,
              color: '#38bdf8',
              letterSpacing: 3,
              textTransform: 'uppercase',
              background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Security System Hack
            </h2>
            <p style={{
              margin: '4px 0 0',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: 13,
              color: '#64748b',
              lineHeight: 1.5,
            }}>
              Rotasi node-node untuk menyambungkan jalur input ke output yang sesuai
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: 20,
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: 8,
              transition: 'all 0.15s',
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0';
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
              (e.currentTarget as HTMLButtonElement).style.background = 'none';
            }}
          >
            ×
          </button>
        </div>

        {/* Status jalur */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {['X', 'Y', 'Z'].map((label) => {
            const color = PATH_COLORS[label as PathColorKey];
            const isSolved = solvedPaths.has(label);
            return (
              <div key={label} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: isSolved ? color : '#334155',
                  boxShadow: isSolved ? `0 0 6px ${color}` : 'none',
                  transition: 'all 0.3s',
                }} />
                <span style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: 9,
                  color: isSolved ? color : '#64748b',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 64px)',
          gridTemplateRows: 'repeat(5, 64px)',
          gap: 2,
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 10,
          padding: 8,
        }}>
          {INITIAL_GRID.map((row, _r) =>
            row.map((_cell, _c) => renderNode(_r, _c, rotations[_r][_c]))
          )}
        </div>

        {/* Hint */}
        <div style={{
          fontFamily: 'Courier New, monospace',
          fontSize: 11,
          color: '#334155',
          letterSpacing: 1,
          textAlign: 'center',
          background: 'rgba(56,189,248,0.06)',
          border: '1px solid rgba(56,189,248,0.15)',
          borderRadius: 8,
          padding: '12px 16px',
        }}>
          Klik node untuk merotasi 90° setiap arah koneksi. Samburkan jalur dari A→X, B→Y, dan C→Z sekaligus.
        </div>
      </div>

      {/* Animations */}
      <style>
        {
          `
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `
        }
      </style>
    </div>
  );

  // Fungsi render node untuk SVG connections
  function renderNode(row: number, col: number, rot: number) {
    const cell = INITIAL_GRID[row][col];
    if (cell.type === 'empty') {
      return <div key={`${row}-${col}`} style={{ width: 64, height: 64 }} />;
    }

    const conn = getRotatedConnections(cell.conn, rot);
    const isInputOutput = cell.type === 'input' || cell.type === 'output';
    const pathLabel = row >= 1 && row <= 3 ? (['X', 'Y', 'Z'][row - 1] as PathColorKey) : null;
    const isSolvedPath = pathLabel && solvedPaths.has(pathLabel);
    const pathColor = isSolvedPath ? getPathColor(pathLabel) : '#647489';
    const isActive = isSolvedPath && cell.rotatable;

    return (
      <div
        key={`${row}-${col}`}
        onClick={() => handleRotate(row, col)}
        style={{
          width: 64, height: 64,
          position: 'relative',
          cursor: cell.rotatable ? 'pointer' : 'default',
          transition: 'all 0.15s',
        }}
      >
        {/* Background node */}
        <div style={{
          position: 'absolute', inset: PADDING,
          background: isInputOutput
            ? `rgba(56,189,248,0.06)`
            : cell.rotatable
              ? (isActive ? `rgba(56,189,248,0.12)` : 'rgba(255,255,255,0.03)')
              : 'transparent',
          border: cell.rotatable
            ? `1px solid ${isActive ? 'rgba(56,189,248,0.5)' : 'rgba(255,255,255,0.1)'}`
            : (cell.type as string) !== 'empty' ? `1px solid #64748933` : 'none',
          borderRadius: 8,
          transition: 'all 0.3s',
          boxShadow: isActive && cell.rotatable ? '0 0 10px rgba(56,189,248,0.25)' : 'none',
        }} />

        {/* Label input/output */}
        {isInputOutput && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Courier New, monospace',
            fontSize: 11, fontWeight: 700,
            color: isActive ? pathColor : '#647489',
            zIndex: 2,
            transition: 'color 0.3s',
            textShadow: isActive ? `0 0 6px ${pathColor}` : 'none',
          }}>
            {cell.label}
          </div>
        )}

        {/* SVG kabel */}
        <svg
          viewBox="0 0 64 64"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            overflow: 'visible',
            pointerEvents: 'none',
          }}
        >
          {/* Titik tengah */}
          {(cell.type as string) !== 'empty' && (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={5}
              fill={isActive ? pathColor : '#334155'}
              style={{ transition: 'fill 0.3s' }}
            />
          )}

          {/* Garis Atas (sisi 0) */}
          {conn[0] && (
            <line
              x1={CENTER}
              y1={PADDING}
              x2={CENTER}
              y2={CELL_SIZE - PADDING}
              stroke={isActive ? pathColor : '#334155'}
              strokeWidth={3}
              strokeLinecap="round"
              style={{ transition: 'stroke 0.3s' }}
            />
          )}

          {/* Garis Kanan (sisi 1) */}
          {conn[1] && (
            <line
              x1={CELL_SIZE - PADDING}
              y1={CENTER}
              x2={PADDING}
              y2={CENTER}
              stroke={isActive ? pathColor : '#334155'}
              strokeWidth={3}
              strokeLinecap="round"
              style={{ transition: 'stroke 0.3s' }}
            />
          )}

          {/* Garis Bawah (sisi 2) */}
          {conn[2] && (
            <line
              x1={CENTER}
              y1={CELL_SIZE - PADDING}
              x2={CENTER}
              y2={PADDING}
              stroke={isActive ? pathColor : '#334155'}
              strokeWidth={3}
              strokeLinecap="round"
              style={{ transition: 'stroke 0.3s' }}
            />
          )}

          {/* Garis Kiri (sisi 3) */}
          {conn[3] && (
            <line
              x1={PADDING}
              y1={CENTER}
              x2={CELL_SIZE - PADDING}
              y2={CENTER}
              stroke={isActive ? pathColor : '#334155'}
              strokeWidth={3}
              strokeLinecap="round"
              style={{ transition: 'stroke 0.3s' }}
            />
          )}
        </svg>

        {/* Indikator rotasi */}
        {cell.rotatable && (
          <div style={{
            position: 'absolute', bottom: 5, right: 5,
            fontFamily: 'Courier New, monospace',
            fontSize: 7,
            color: 'rgba(255,255,255,0.2)',
          }}>
            {rot * 90}°
          </div>
        )}
      </div>
    );
  }
}