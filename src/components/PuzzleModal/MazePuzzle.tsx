import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Cell {
  x: number;
  y: number;
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
  visited: boolean;
}

interface MazeConfig {
  cols: number;
  rows: number;
  label: string;
  color: string;
  glowColor: string;
  threatLabel: string;
}

interface Props {
  onSolve: () => void;
  onClose: () => void;
  maxStages?: number;
    startStage?: number; // ← tambah

}

// ─── Maze Stage Configs (Dibuat Landscape) ────────────────────────────────────
const STAGES: MazeConfig[] = [
  {
    cols: 14, rows: 6,
    label: 'SECTOR α — FIREWALL',
    color: '#38bdf8', // sky-400
    glowColor: 'rgba(56, 189, 248, 0.15)',
    threatLabel: 'FIREWALL',
  },
  {
    cols: 18, rows: 8,
    label: 'SECTOR β — ENCRYPTION',
    color: '#a78bfa', // violet-400
    glowColor: 'rgba(167, 139, 250, 0.15)',
    threatLabel: 'ENCRYPTION',
  },
  {
    cols: 22, rows: 10,
    label: 'SECTOR γ — NEURAL',
    color: '#34d399', // emerald-400
    glowColor: 'rgba(52, 211, 153, 0.15)',
    threatLabel: 'NEURAL GRID',
  },
  {
    cols: 26, rows: 12,
    label: 'SECTOR δ — CORE',
    color: '#fb923c', // orange-400
    glowColor: 'rgba(251, 146, 60, 0.15)',
    threatLabel: 'CORE LOCK',
  },
];

// ─── Maze Generator (Recursive Backtracker) ───────────────────────────────────
function generateMaze(cols: number, rows: number, seed: number): Cell[][] {
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };

  const grid: Cell[][] = Array.from({ length: rows }, (_, y) =>
    Array.from({ length: cols }, (_, x) => ({
      x, y,
      walls: { top: true, right: true, bottom: true, left: true },
      visited: false,
    }))
  );

  const stack: Cell[] = [];
  const start = grid[0][0];
  start.visited = true;
  stack.push(start);

  const neighbors = (cell: Cell) => {
    const dirs = [
      { dx: 0, dy: -1, wall: 'top' as const, opp: 'bottom' as const },
      { dx: 1, dy: 0, wall: 'right' as const, opp: 'left' as const },
      { dx: 0, dy: 1, wall: 'bottom' as const, opp: 'top' as const },
      { dx: -1, dy: 0, wall: 'left' as const, opp: 'right' as const },
    ];
    return dirs
      .map(d => ({ ...d, nx: cell.x + d.dx, ny: cell.y + d.dy }))
      .filter(d => d.nx >= 0 && d.nx < cols && d.ny >= 0 && d.ny < rows && !grid[d.ny][d.nx].visited);
  };

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const avail = neighbors(current);
    if (avail.length === 0) {
      stack.pop();
    } else {
      const chosen = avail[Math.floor(rand() * avail.length)];
      current.walls[chosen.wall] = false;
      grid[chosen.ny][chosen.nx].walls[chosen.opp] = false;
      grid[chosen.ny][chosen.nx].visited = true;
      stack.push(grid[chosen.ny][chosen.nx]);
    }
  }

  return grid;
}

// ─── Maze Renderer ────────────────────────────────────────────────────────────
function MazeCanvas({
  grid,
  playerPos,
  config,
  onCellClick,
}: {
  grid: Cell[][];
  playerPos: { x: number; y: number };
  config: MazeConfig;
  onCellClick: (x: number, y: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tickRef = useRef(0);

  const CELL = Math.min(
    Math.floor(800 / config.cols),
    Math.floor(400 / config.rows)
  );
  const W = config.cols * CELL;
  const H = config.rows * CELL;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      tickRef.current += 0.03;
      const t = tickRef.current;
  if (!grid || grid.length === 0) return; // ← tambah ini

      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = `${config.color}15`;
      for (let y = 0; y <= config.rows; y++) {
        for (let x = 0; x <= config.cols; x++) {
          ctx.fillRect(x * CELL - 1, y * CELL - 1, 2, 2);
        }
      }

      const ex = (config.cols - 1) * CELL;
      const ey = (config.rows - 1) * CELL;
      
      ctx.fillStyle = config.glowColor;
      ctx.fillRect(ex + CELL * 0.15, ey + CELL * 0.15, CELL * 0.7, CELL * 0.7);
      
      ctx.strokeStyle = config.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ex + CELL * 0.15, ey + CELL * 0.15, CELL * 0.7, CELL * 0.7);

      ctx.strokeStyle = '#334155'; // slate-700
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      for (let row = 0; row < config.rows; row++) {
        for (let col = 0; col < config.cols; col++) {
          const cell = grid[row][col];
          const cx = col * CELL;
          const cy = row * CELL;

          ctx.beginPath();
          if (cell.walls.top) { ctx.moveTo(cx, cy); ctx.lineTo(cx + CELL, cy); }
          if (cell.walls.right) { ctx.moveTo(cx + CELL, cy); ctx.lineTo(cx + CELL, cy + CELL); }
          if (cell.walls.bottom) { ctx.moveTo(cx, cy + CELL); ctx.lineTo(cx + CELL, cy + CELL); }
          if (cell.walls.left) { ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + CELL); }
          ctx.stroke();
        }
      }

      const px = playerPos.x * CELL + CELL / 2;
      const py = playerPos.y * CELL + CELL / 2;
      
      const pulsePx = 1 + 0.05 * Math.sin(t * 3);
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(pulsePx, pulsePx);
      
      ctx.fillStyle = config.color;
      ctx.beginPath();
      ctx.arc(0, 0, CELL * 0.25, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, CELL * 0.1, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [grid, playerPos, config, CELL, W, H]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const cx = Math.floor(((e.clientX - rect.left) * scaleX) / CELL);
    const cy = Math.floor(((e.clientY - rect.top) * scaleY) / CELL);
    if (cx >= 0 && cx < config.cols && cy >= 0 && cy < config.rows) {
      onCellClick(cx, cy);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      onClick={handleCanvasClick}
      style={{
        display: 'block',
        margin: '0 auto',
        maxWidth: '100%',
        cursor: 'crosshair',
        borderRadius: '6px',
        border: `1px solid ${config.color}30`,
      }}
    />
  );
}

// ─── Path Finder (BFS) untuk tap-to-move ─────────────────────────────────────
function findPath(
  grid: Cell[][],
  from: { x: number; y: number },
  to: { x: number; y: number },
  cols: number,
  rows: number
): { x: number; y: number }[] {
  const key = (x: number, y: number) => `${x},${y}`;
  const visited = new Set<string>();
  const queue: { x: number; y: number; path: { x: number; y: number }[] }[] = [
    { x: from.x, y: from.y, path: [] },
  ];
  visited.add(key(from.x, from.y));

  const dirs = [
    { dx: 0, dy: -1, wall: 'top' as const },
    { dx: 1, dy: 0, wall: 'right' as const },
    { dx: 0, dy: 1, wall: 'bottom' as const },
    { dx: -1, dy: 0, wall: 'left' as const },
  ];

  while (queue.length > 0) {
    const { x, y, path } = queue.shift()!;
    if (x === to.x && y === to.y) return path.concat({ x, y });

    for (const d of dirs) {
      const nx = x + d.dx;
      const ny = y + d.dy;
      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
      if (grid[y][x].walls[d.wall]) continue;
      if (visited.has(key(nx, ny))) continue;
      visited.add(key(nx, ny));
      queue.push({ x: nx, y: ny, path: path.concat({ x, y }) });
    }
  }

  return [];
}

// ─── Stage Complete Overlay (Clean Version) ───────────────────────────────────
function StageCompleteOverlay({ config, stage, total, onNext }: {
  config: MazeConfig; stage: number; total: number; onNext: () => void;
}) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 20,
      background: 'rgba(15, 23, 42, 0.85)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 20, backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.3s ease',
      borderRadius: '6px',
    }}>
      <div style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 20, fontWeight: 600,
        color: config.color, letterSpacing: 1,
      }}>
        {config.threatLabel} BYPASSED
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        fontSize: 12, color: '#94a3b8', letterSpacing: 2,
      }}>
        SECTOR {stage} / {total}
      </div>
      {stage < total ? (
        <button
          onClick={onNext}
          style={{
            marginTop: 10,
            background: config.color,
            border: 'none',
            borderRadius: 6, color: '#0f172a',
            fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            fontWeight: 700, fontSize: 13, letterSpacing: 1,
            padding: '12px 28px', cursor: 'pointer',
            transition: 'opacity 0.2s, transform 0.1s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          NEXT STAGE →
        </button>
      ) : null}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function MazePuzzle({ onSolve, onClose, maxStages, startStage = 0 }: Props) {
  const [stageIndex, setStageIndex] = useState(startStage);
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [stageComplete, setStageComplete] = useState(false);
  const [allComplete, setAllComplete] = useState(false);
  const [moveQueue, setMoveQueue] = useState<{ x: number; y: number }[]>([]);
  const moveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completionHandledRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  const config = STAGES[stageIndex];
  
  // Menentukan total stage aktual yang akan dimainkan (maksimal sesuai array STAGES jika undefined)
  const totalStages = Math.min(maxStages ?? STAGES.length, STAGES.length);

  // Init atau reset maze saat stage berubah
  useEffect(() => {
    const seed = Date.now() + stageIndex * 9999;
    const newGrid = generateMaze(config.cols, config.rows, seed);
    setGrid(newGrid);
    setPlayerPos({ x: 0, y: 0 });
    setStageComplete(false);
    setMoveQueue([]);
  }, [stageIndex, config.cols, config.rows]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  // Cek apakah player sudah sampai exit
  useEffect(() => {
    if (!grid.length) return;
    if (playerPos.x === config.cols - 1 && playerPos.y === config.rows - 1) {
      setStageComplete(true);
      setMoveQueue([]);
      
      if (stageIndex + 1 >= totalStages) {
        setAllComplete(true);
        if (!completionHandledRef.current) {
          completionHandledRef.current = true;
          onSolve();
        }
      }
    }
  }, [playerPos, config.cols, config.rows, grid.length, stageIndex, totalStages, onSolve]);

  // Proses move queue (tap-to-move)
  useEffect(() => {
    if (moveQueue.length === 0) return;
    moveTimerRef.current = setTimeout(() => {
      const [next, ...rest] = moveQueue;
      setPlayerPos(next);
      setMoveQueue(rest);
    }, 50);
    return () => { if (moveTimerRef.current) clearTimeout(moveTimerRef.current); };
  }, [moveQueue]);

  // Keyboard handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (stageComplete) return;
    if (!grid.length) return;

    const keyMap: Record<string, { dx: number; dy: number; wall: 'top' | 'right' | 'bottom' | 'left' }> = {
      ArrowUp:    { dx: 0, dy: -1, wall: 'top' },
      ArrowDown:  { dx: 0, dy: 1,  wall: 'bottom' },
      ArrowLeft:  { dx: -1, dy: 0, wall: 'left' },
      ArrowRight: { dx: 1, dy: 0,  wall: 'right' },
      w: { dx: 0, dy: -1, wall: 'top' },
      s: { dx: 0, dy: 1,  wall: 'bottom' },
      a: { dx: -1, dy: 0, wall: 'left' },
      d: { dx: 1, dy: 0,  wall: 'right' },
    };

    const dir = keyMap[e.key];
    if (!dir) return;
    e.preventDefault();

    setPlayerPos(prev => {
      const nx = prev.x + dir.dx;
      const ny = prev.y + dir.dy;
      if (nx < 0 || nx >= config.cols || ny < 0 || ny >= config.rows) return prev;
      if (grid[prev.y][prev.x].walls[dir.wall]) return prev;
      return { x: nx, y: ny };
    });
  }, [grid, config.cols, config.rows, stageComplete]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Tap/click cell
  const handleCellClick = useCallback((cx: number, cy: number) => {
    if (stageComplete || !grid.length) return;
    const path = findPath(grid, playerPos, { x: cx, y: cy }, config.cols, config.rows);
    if (path.length > 1) {
      setMoveQueue(path.slice(1)); 
    }
  }, [grid, playerPos, config.cols, config.rows, stageComplete]);

  const handleNext = () => {
    const nextIndex = stageIndex + 1;
    if (nextIndex >= totalStages) {
      setAllComplete(true);
      if (!completionHandledRef.current) {
        completionHandledRef.current = true;
        onSolve();
      }
    } else {
      setStageIndex(nextIndex);
    }
  };

  // Kalkulasi persentase disesuaikan dengan `totalStages` bukan `STAGES.length`
  const progressPct = ((stageIndex + (stageComplete ? 1 : 0)) / totalStages) * 100;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 860,
          maxWidth: '100%',
          background: '#0f172a',
          border: `1px solid #1e293b`,
          borderRadius: 12,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header - Simple */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid #1e293b',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: config.color,
            }} />
            <span style={{
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              fontSize: 14, fontWeight: 600, color: '#e2e8f0',
            }}>
              {config.label}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              fontFamily: "'Inter', sans-serif",
              fontSize: 24, lineHeight: 1, cursor: 'pointer',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
          >
            ×
          </button>
        </div>

        {/* Minimal Progress Line */}
        <div style={{ width: '100%', height: 2, background: '#1e293b' }}>
          <div style={{
            height: '100%',
            width: `${progressPct}%`,
            background: config.color,
            transition: 'width 0.4s ease, background-color 0.4s ease',
          }} />
        </div>

        {/* Maze Area */}
        <div style={{
          position: 'relative',
          padding: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 300,
        }}>
          {grid.length > 0 && (
            <MazeCanvas
              grid={grid}
              playerPos={playerPos}
              config={config}
              onCellClick={handleCellClick}
            />
          )}

          {/* Stage complete overlay */}
          {stageComplete && !allComplete && (
            <StageCompleteOverlay
              config={config}
              stage={stageIndex + 1}
              total={totalStages} // Mem-passing totalStages disini agar tulisan SECTOR X / Y pas
              onNext={handleNext}
            />
          )}

          {/* All complete overlay */}
          {allComplete && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 20,
              background: 'rgba(15, 23, 42, 0.9)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 16, backdropFilter: 'blur(4px)',
              animation: 'fadeIn 0.3s ease',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: '#34d399', color: '#022c22',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, fontWeight: 'bold'
              }}>✓</div>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 24, fontWeight: 600, color: '#f8fafc',
              }}>
                ACCESS GRANTED
              </div>
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #1e293b',
          display: 'flex', justifyContent: 'space-between',
          color: '#64748b', fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          fontSize: 12,
        }}>
          <span>WASD / ARROWS : MOVE</span>
          <span>CLICK / TAP : AUTO-PATH</span>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}