import { useState, useRef, useCallback, useEffect } from 'react';

interface Props {
  onSolve: () => void;
  onClose: () => void;
}

// ── Path assets (ganti dengan path asli nanti) ───────────────────────────────
const ASSET_BG         = '/backgrounds/reactor_final_bg.png';   // bg halaman baru
const ASSET_BUTTON     = '/puzzles/reactor_button.png';          // object tombol
const ASSET_LEVER_BG   = '/puzzles/lever_bg.png';               // bg panel lever
const ASSET_LEVER_BODY = '/puzzles/lever_body.png';              // gagang lever
const ASSET_HANDLE     = '/puzzles/lever_handle.png';            // handle merah

// Seberapa jauh lever harus ditarik (0-1) sebelum dianggap solve
const SOLVE_THRESHOLD = 0.85;

export function ReactorLeverScreen({ onSolve, onClose }: Props) {
  const [phase, setPhase] = useState<'button' | 'lever'>('button');
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 30); }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: mounted ? 1 : 0, transition: 'opacity 0.3s',
    }}>
      {/* Background */}
      <img src={ASSET_BG} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', zIndex: 0,
      }} onError={e => {
        // fallback bg jika asset belum ada
        (e.target as HTMLImageElement).style.display = 'none';
      }}/>
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse at center, #1a0a0a 0%, #0a0005 100%)',
      }}/>

      {/* Tombol close */}
      <button onClick={onClose} style={{
        position: 'absolute', top: 16, right: 16, zIndex: 10,
        background: 'rgba(0,0,0,0.5)', border: '1px solid #334155',
        color: '#64748b', borderRadius: 8, padding: '6px 14px',
        cursor: 'pointer', fontFamily: 'monospace', fontSize: 13,
      }}>✕</button>

      {/* Konten */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {phase === 'button' ? (
          <ButtonPhase onActivate={() => setPhase('lever')} />
        ) : (
          <LeverPhase onSolve={onSolve} />
        )}
      </div>
    </div>
  );
}

// ── Phase 1: Tombol ──────────────────────────────────────────────────────────
function ButtonPhase({ onActivate }: { onActivate: () => void }) {
  const [pressing, setPressing] = useState(false);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 32,
    }}>
      <div style={{
        color: '#ef4444', fontFamily: 'monospace', fontSize: 14,
        letterSpacing: 3, textShadow: '0 0 10px #ef4444',
      }}>
        ⚠ EMERGENCY OVERRIDE
      </div>

      {/* Tombol object */}
      <div
        onMouseDown={() => setPressing(true)}
        onMouseUp={() => { setPressing(false); onActivate(); }}
        onMouseLeave={() => setPressing(false)}
        onTouchStart={() => setPressing(true)}
        onTouchEnd={() => { setPressing(false); onActivate(); }}
        style={{
          cursor: 'pointer',
          transform: pressing ? 'scale(0.94)' : 'scale(1)',
          transition: 'transform 0.1s',
          userSelect: 'none',
        }}
      >
        <img src={ASSET_BUTTON} style={{ width: 160, height: 160, objectFit: 'contain' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        {/* Fallback dummy button */}
        <div style={{
          width: 160, height: 160,
          background: pressing
            ? 'radial-gradient(circle, #7f1d1d, #450a0a)'
            : 'radial-gradient(circle, #dc2626, #991b1b)',
          borderRadius: '50%',
          boxShadow: pressing
            ? '0 2px 8px rgba(220,38,38,0.4)'
            : '0 0 30px rgba(220,38,38,0.6), 0 6px 20px rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '4px solid #7f1d1d',
          position: 'relative', marginTop: -160, // overlap dengan img
        }}>
          <span style={{ fontSize: 40 }}>⚡</span>
        </div>
      </div>

      <div style={{
        color: '#64748b', fontFamily: 'monospace', fontSize: 11,
        letterSpacing: 2,
      }}>
        KLIK UNTUK AKTIVASI
      </div>
    </div>
  );
}

// ── Phase 2: Lever ───────────────────────────────────────────────────────────
function LeverPhase({ onSolve }: { onSolve: () => void }) {
  // progress: 0 = lever di atas, 1 = lever penuh ke bawah
  const [progress, setProgress] = useState(0);
  const [solved, setSolved] = useState(false);
  const [dragging, setDragging] = useState(false);

  const containerRef  = useRef<HTMLDivElement>(null);
  const dragStartYRef = useRef(0);
  const progStartRef  = useRef(0);

  // Tinggi track lever dalam px (jarak gerak handle)
  const TRACK_H = 260;

  const startDrag = useCallback((clientY: number) => {
    if (solved) return;
    setDragging(true);
    dragStartYRef.current  = clientY;
    progStartRef.current   = progress;
  }, [solved, progress]);

  const onMove = useCallback((clientY: number) => {
    if (!dragging || solved) return;
    const dy     = clientY - dragStartYRef.current;
    const delta  = dy / TRACK_H;
    const next   = Math.max(0, Math.min(1, progStartRef.current + delta));
    setProgress(next);

    if (next >= SOLVE_THRESHOLD) {
      setSolved(true);
      setDragging(false);
      setProgress(1);
      setTimeout(() => onSolve(), 1200);
    }
  }, [dragging, solved, onSolve]);

  const endDrag = useCallback(() => {
    if (solved) return;
    setDragging(false);
    // Kalau belum solve, snap kembali ke atas
    if (progress < SOLVE_THRESHOLD) {
      setProgress(0);
    }
  }, [solved, progress]);

  // Mouse events
  useEffect(() => {
    const mm = (e: MouseEvent) => onMove(e.clientY);
    const mu = () => endDrag();
    if (dragging) {
      window.addEventListener('mousemove', mm);
      window.addEventListener('mouseup', mu);
    }
    return () => {
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', mu);
    };
  }, [dragging, onMove, endDrag]);

  // Touch events
  useEffect(() => {
    const tm = (e: TouchEvent) => { e.preventDefault(); onMove(e.touches[0].clientY); };
    const tu = () => endDrag();
    if (dragging) {
      window.addEventListener('touchmove', tm, { passive: false });
      window.addEventListener('touchend', tu);
    }
    return () => {
      window.removeEventListener('touchmove', tm);
      window.removeEventListener('touchend', tu);
    };
  }, [dragging, onMove, endDrag]);

  // Posisi handle: 0% = atas track, 100% = bawah track
  const handleY = progress * TRACK_H;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 24,
    }}>
      {/* Label */}
      <div style={{
        color: solved ? '#34d399' : '#ef4444',
        fontFamily: 'monospace', fontSize: 13,
        letterSpacing: 3,
        textShadow: solved ? '0 0 10px #34d399' : '0 0 10px #ef4444',
        transition: 'all 0.5s',
      }}>
        {solved ? '✓ SISTEM DIAKTIFKAN' : '▼ TARIK TUAS KE BAWAH'}
      </div>

      {/* Panel lever */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: 220, height: 460,
          userSelect: 'none',
        }}
      >
        {/* Background panel lever */}
        <img src={ASSET_LEVER_BG} style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%', objectFit: 'fill',
          borderRadius: 16,
        }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}/>

        {/* Fallback bg panel */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, #374151, #1f2937)',
          borderRadius: 16,
          border: '3px solid #000',
          outline: '6px solid #f59e0b',
          outlineOffset: -3,
        }}/>

        {/* Progress bar track (visual) */}
        <div style={{
          position: 'absolute',
          left: '50%', transform: 'translateX(-50%)',
          top: 80, width: 60,
          height: TRACK_H + 60,
          background: 'rgba(0,0,0,0.5)',
          borderRadius: 8,
          border: '2px solid #374151',
          overflow: 'hidden',
        }}>
          {/* Fill progress */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: `${progress * 100}%`,
            background: solved
              ? 'rgba(52,211,153,0.4)'
              : 'rgba(239,68,68,0.3)',
            transition: dragging ? 'none' : 'height 0.3s',
          }}/>
        </div>

        {/* Gagang lever (body) — ikut bergerak sebagian */}
        <div style={{
          position: 'absolute',
          left: '50%', transform: 'translateX(-50%)',
          top: 90 + handleY * 0.3, // gagang bergerak lebih lambat dari handle
          width: 20,
          height: TRACK_H * 0.6,
          transition: dragging ? 'none' : 'top 0.3s',
          zIndex: 2,
        }}>
          <img src={ASSET_LEVER_BODY} style={{
            width: '100%', height: '100%', objectFit: 'fill',
          }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}/>
          {/* Fallback gagang */}
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(180deg, #6b7280, #374151)',
            borderRadius: 4,
            border: '1px solid #111',
          }}/>
        </div>

        {/* Handle merah — bisa di-drag */}
        <div
          style={{
            position: 'absolute',
            left: '50%', transform: 'translateX(-50%)',
            top: 70 + handleY,
            width: 100, height: 36,
            cursor: solved ? 'default' : dragging ? 'grabbing' : 'grab',
            zIndex: 3,
            transition: dragging ? 'none' : 'top 0.3s',
            filter: solved ? 'drop-shadow(0 0 8px #34d399)' : 'none',
          }}
          onMouseDown={e => { e.preventDefault(); startDrag(e.clientY); }}
          onTouchStart={e => { e.preventDefault(); startDrag(e.touches[0].clientY); }}
        >
          <img src={ASSET_HANDLE} style={{
            width: '100%', height: '100%', objectFit: 'contain',
          }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}/>
          {/* Fallback handle */}
          <div style={{
            width: '100%', height: '100%',
            background: solved
              ? 'linear-gradient(90deg, #059669, #34d399)'
              : 'linear-gradient(90deg, #991b1b, #dc2626)',
            borderRadius: 6,
            border: '2px solid #000',
            boxShadow: solved
              ? '0 0 12px rgba(52,211,153,0.8)'
              : '0 3px 8px rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              color: 'white', fontSize: 11,
              fontFamily: 'monospace', fontWeight: 'bold',
              letterSpacing: 1,
            }}>
              {solved ? '✓' : '|||'}
            </span>
          </div>
        </div>

        {/* Indikator di bawah */}
        <div style={{
          position: 'absolute',
          bottom: 24, left: '50%', transform: 'translateX(-50%)',
          width: 80, height: 24,
          background: solved ? '#34d399' : '#1f2937',
          borderRadius: 4,
          border: `2px solid ${solved ? '#059669' : '#374151'}`,
          boxShadow: solved ? '0 0 12px rgba(52,211,153,0.6)' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.5s',
        }}>
          <span style={{
            fontFamily: 'monospace', fontSize: 9,
            color: solved ? '#fff' : '#4b5563',
            fontWeight: 'bold', letterSpacing: 1,
          }}>
            {solved ? 'ACTIVE' : Math.round(progress * 100) + '%'}
          </span>
        </div>
      </div>

      {/* Hint */}
      {!solved && (
        <div style={{
          color: '#475569', fontFamily: 'monospace',
          fontSize: 11, letterSpacing: 1,
          animation: 'pulse 2s infinite',
        }}>
          drag handle ▼
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%,100% { opacity:1; }
          50% { opacity:0.4; }
        }
      `}</style>
    </div>
  );
}