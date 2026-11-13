import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Difference {
  id: string;
  x: number;
  y: number;
  radius: number;
}

interface Stage {
  originalImage: string;
  differentImage: string;
  differences: Difference[];
}

interface Props {
  onSolve: () => void;
  onClose: () => void;
  reactorId: string;
}

// ─── Stage Data per Reactor ───────────────────────────────────────────────────
const REACTOR_STAGES: Record<string, Stage[]> = {
  reactor: [
    {
      originalImage: '/objects/spot/kelasog.jpg',
      differentImage: '/objects/spot/kelasfake.jpg',
      differences: [
        { id: 'p1_1', x: 8, y: 11, radius: 6 },
        { id: 'p1_2', x: 26, y: 27, radius: 6 },
        { id: 'p1_3', x: 51, y: 26, radius: 6 },
        { id: 'p1_4', x: 73, y: 28, radius: 6 },
        { id: 'p1_5', x: 60, y: 64, radius: 6 },
      ],
    },
    {
      originalImage: '/objects/spot/perpusog.jpg',
      differentImage: '/objects/spot/perpusfake.jpg',
      differences: [
        { id: 'p2_1', x: 44.3, y: 43, radius: 6 },
        { id: 'p2_2', x: 14, y: 43, radius: 6.5 },
        { id: 'p2_3', x: 67, y: 45, radius: 6.5 },
        { id: 'p2_4', x: 69.2, y: 12, radius: 5 },
      ],
    },
  ],
  cooling: [
    {
      originalImage: '/objects/spot/marketog.jpg',
      differentImage: '/objects/spot/marketfake.jpg',
      differences: [
        { id: 'p5_1', x: 25, y: 23, radius: 6 },
        { id: 'p5_2', x: 62.5, y: 10.7, radius: 4.5 },
        { id: 'p5_3', x: 50, y: 30, radius: 3 },
        { id: 'p5_4', x: 8, y: 88, radius: 4.5 },
      ]
    },
    {
      originalImage: '/objects/spot/officeog.jpg',
      differentImage: '/objects/spot/officefake.jpg',
      differences: [
        { id: 'p6_1', x: 50, y: 10.3, radius: 5 },
        { id: 'p6_2', x: 40, y: 8, radius: 4 },
        { id: 'p6_3', x: 78, y: 28, radius: 5 },
        { id: 'p6_4', x: 27.3, y: 51, radius: 5 },
        { id: 'p6_5', x: 27.4, y: 76.4, radius: 5 },
        { id: 'p6_6', x: 65.7, y: 79.4, radius: 3.7 },
      ]
    },
  ],
  power: [
    {
      originalImage: '/objects/spot/ruangtamuog.jpg',
      differentImage: '/objects/spot/ruangtamufake.jpg',
      differences: [
        { id: 'p3_1', x: 62, y: 17, radius: 5 },
        { id: 'p3_2', x: 50, y: 36.4, radius: 5 },
        { id: 'p3_3', x: 47.4, y: 60.8, radius: 4.8 },
        { id: 'p3_4', x: 78, y: 58, radius: 8 },
      ]
    },
    {
      originalImage: '/objects/spot/ruangtvog.jpg',
      differentImage: '/objects/spot/ruangtvfake.jpg',
      differences: [
        { id: 'p4_1', x: 11, y: 18.8, radius: 4 },
        { id: 'p4_2', x: 26, y: 33, radius: 6 },
        { id: 'p4_4', x: 90, y: 27, radius: 4.5 },
      ]
    },
  ],
};

const STAGE_TIME = 30;
const WRONG_PENALTY = 5;
const TIMEOUT_PENALTY = 60;

// ─── Marker ───────────────────────────────────────────────────────────────────
function DiffMarker({ x, y, radius, found }: {
  x: number; y: number; radius: number; found: boolean;
}) {
  return (
    <div style={{
      position: 'absolute',
      left: `${x}%`, top: `${y}%`,
      width: `${radius * 2}%`, height: `${radius * 2}%`,
      transform: 'translate(-50%, -50%)',
      borderRadius: '50%',
      // Border solid minimalis tanpa cahaya neon
      border: `2px solid ${found ? '#34d399' : 'transparent'}`,
      background: found ? 'rgba(52,211,153,0.2)' : 'transparent',
      pointerEvents: 'none',
      transition: 'all 0.3s ease',
      animation: found ? 'scaleIn 0.3s ease-out' : 'none',
      zIndex: 5,
    }} />
  );
}

function WrongMarker({ x, y }: { x: number; y: number }) {
  return (
    <div style={{
      position: 'absolute',
      left: `${x}%`, top: `${y}%`,
      width: '8%', height: '8%',
      transform: 'translate(-50%, -50%)',
      borderRadius: '50%',
      border: '2px solid #ef4444',
      background: 'rgba(239,68,68,0.2)',
      pointerEvents: 'none',
      animation: 'fadeOut 0.6s ease forwards',
      zIndex: 5,
    }} />
  );
}

// ─── Image Panel ──────────────────────────────────────────────────────────────
function ImagePanel({
  src, label, differences, foundIds, onClickArea, wrongClicks
}: {
  src: string; label: string; differences: Difference[];
  foundIds: string[]; onClickArea: (x: number, y: number) => void;
  wrongClicks: { x: number; y: number; id: string }[];
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onClickArea(x, y);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12, letterSpacing: 2, fontWeight: 500,
        color: '#a1a1aa', // Abu-abu terang, bersih
        textAlign: 'center',
      }}>
        {label}
      </div>
      <div
        ref={panelRef}
        onClick={handleClick}
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '66.67%', // Rasio 3:2
          cursor: 'crosshair',
          // Border luar gambar yang jelas & solid
          border: '2px solid #3f3f46', 
          borderRadius: 6,
          overflow: 'hidden',
          background: '#000',
          // Shadow tipis hanya untuk kedalaman, bukan efek cahaya
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        <img
          src={src} alt={label} draggable={false}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
          }}
        />
        {differences.map(diff => (
          <DiffMarker
            key={diff.id} x={diff.x} y={diff.y}
            radius={diff.radius} found={foundIds.includes(diff.id)}
          />
        ))}
        {wrongClicks.map(wc => (
          <WrongMarker key={wc.id} x={wc.x} y={wc.y} />
        ))}
      </div>
    </div>
  );
}

// ─── Timer Bar ────────────────────────────────────────────────────────────────
function TimerBar({ timeLeft, maxTime }: { timeLeft: number; maxTime: number }) {
  const pct = (timeLeft / maxTime) * 100;
  const color = timeLeft <= 10 ? '#ef4444' : timeLeft <= 20 ? '#f59e0b' : '#34d399';
  
  return (
    <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{
        fontFamily: 'monospace', fontSize: 13, fontWeight: 500,
        color: color, minWidth: 36, textAlign: 'right',
        animation: timeLeft <= 10 ? 'blink 0.8s step-end infinite' : 'none',
      }}>
        {timeLeft}s
      </div>
      <div style={{
        flex: 1, height: 6, background: '#27272a',
        borderRadius: 3, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 3,
          width: `${pct}%`, background: color,
          transition: 'width 1s linear, background 0.3s',
        }} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function SpotDifferencePuzzle({ onSolve, onClose, reactorId }: Props) {
  const showNotification = useGameStore(s => s.showNotification);
  const tickTimer        = useGameStore(s => s.tickTimer);

  const stages = REACTOR_STAGES[reactorId] ?? REACTOR_STAGES['reactor'];

  const [setIndex, setSetIndex]       = useState(0); 
  const [foundIds, setFoundIds]       = useState<string[]>([]);
  const [timeLeft, setTimeLeft]       = useState(STAGE_TIME);
  const [wrongClicks, setWrongClicks] = useState<{ x: number; y: number; id: string }[]>([]);
  const [mounted, setMounted]         = useState(false);
  const [setComplete, setSetComplete] = useState(false);
  const [allComplete, setAllComplete] = useState(false);
  const wrongIdCounter = useRef(0);

  const currentStage = stages[setIndex];

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (setComplete || allComplete) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          for (let i = 0; i < TIMEOUT_PENALTY; i++) tickTimer();
          showNotification(`Waktu habis! Timer berkurang ${TIMEOUT_PENALTY} detik.`, 'error');
          setFoundIds([]);
          setWrongClicks([]);
          return STAGE_TIME;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [setComplete, allComplete, tickTimer, showNotification]);

  // Cek set complete
  useEffect(() => {
    if (foundIds.length === currentStage.differences.length && !setComplete) {
      setSetComplete(true);
      showNotification(`Set ${setIndex + 1} selesai!`, 'success');
    }
  }, [foundIds, currentStage.differences.length, setComplete, setIndex, showNotification]);

  const handleClickArea = useCallback((x: number, y: number) => {
    if (setComplete) return;

    const hit = currentStage.differences.find(diff => {
      if (foundIds.includes(diff.id)) return false;
      const dx = x - diff.x;
      const dy = y - diff.y;
      return Math.sqrt(dx * dx + dy * dy) <= diff.radius;
    });

    if (hit) {
      setFoundIds(prev => [...prev, hit.id]);
      showNotification('Perbedaan ditemukan! ✓', 'success');
    } else {
      const wrongId = `wrong_${wrongIdCounter.current++}`;
      setWrongClicks(prev => [...prev, { x, y, id: wrongId }]);
      setTimeLeft(prev => Math.max(1, prev - WRONG_PENALTY));
      showNotification(`Salah! -${WRONG_PENALTY} detik`, 'error');
      setTimeout(() => {
        setWrongClicks(prev => prev.filter(wc => wc.id !== wrongId));
      }, 600);
    }
  }, [currentStage, foundIds, setComplete, showNotification]);

  const handleNextSet = () => {
    const nextIndex = setIndex + 1;
    if (nextIndex >= stages.length) {
      setAllComplete(true);
      setTimeout(onSolve, 1500);
    } else {
      setSetIndex(nextIndex);
      setFoundIds([]);
      setWrongClicks([]);
      setTimeLeft(STAGE_TIME);
      setSetComplete(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(9, 9, 11, 0.9)', // Overlay abu-abu gelap natural
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 980, maxWidth: '100%',
          background: '#09090b', // Warna container bersih, abu-abu sangat gelap
          border: '1px solid #27272a',
          borderRadius: 12,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', position: 'relative',
          transform: mounted ? 'scale(1)' : 'scale(0.96)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 28px', borderBottom: '1px solid #27272a',
          background: '#18181b',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 14, fontWeight: 500, letterSpacing: 1.5,
              color: '#f4f4f5',
            }}>
              ANOMALY SCAN — {reactorId.toUpperCase()}
            </span>
            <span style={{
              fontFamily: 'monospace', fontSize: 12, color: '#71717a',
              background: '#27272a', padding: '2px 8px', borderRadius: 12
            }}>
              SET {setIndex + 1}/{stages.length}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <span style={{
              fontFamily: 'monospace', fontSize: 13, fontWeight: 500,
              color: '#a1a1aa', letterSpacing: 1,
            }}>
              FOUND: <span style={{ color: '#fff' }}>{foundIds.length}</span> / {currentStage.differences.length}
            </span>
            <button
              onClick={onClose}
              className="btn-abort"
              style={{
                background: 'transparent',
                border: '1px solid #3f3f46',
                borderRadius: 6, color: '#a1a1aa',
                fontFamily: 'monospace', fontSize: 12, fontWeight: 500,
                padding: '6px 16px', cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              X
            </button>
          </div>
        </div>

        {/* Progress set indicator & Timer Container */}
        <div style={{ padding: '20px 28px 4px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {stages.map((_, i) => (
              <div key={i} style={{
                height: 3, flex: 1, borderRadius: 2,
                background: i < setIndex ? '#34d399'
                  : i === setIndex ? '#e4e4e7'
                  : '#27272a',
                transition: 'background 0.4s ease',
              }} />
            ))}
          </div>
          <TimerBar timeLeft={timeLeft} maxTime={STAGE_TIME} />
        </div>

        {/* Frame Pembungkus Kedua Gambar */}
        <div style={{
          padding: '24px 28px',
          display: 'flex', 
          gap: 36, // Jarak antar gambar yang lebar dan tegas
          position: 'relative',
        }}>
          <ImagePanel
            src={currentStage.originalImage}
            label="[ ORIGINAL ]"
            differences={currentStage.differences}
            foundIds={foundIds}
            onClickArea={handleClickArea}
            wrongClicks={wrongClicks}
          />
          <ImagePanel
            src={currentStage.differentImage}
            label="[ ANOMALY ]"
            differences={currentStage.differences}
            foundIds={foundIds}
            onClickArea={handleClickArea}
            wrongClicks={wrongClicks}
          />
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 28px', background: '#18181b',
          borderTop: '1px solid #27272a',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', gap: 24 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#71717a', letterSpacing: 1 }}>
              <span style={{color: '#ef4444', marginRight: 4}}>■</span> MISS PENALTY: -{WRONG_PENALTY}s
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#71717a', letterSpacing: 1 }}>
              <span style={{color: '#f59e0b', marginRight: 4}}>■</span> TIMEOUT: -{TIMEOUT_PENALTY}s
            </span>
          </div>
          
          <div style={{ minWidth: 120, textAlign: 'right' }}>
            {setComplete && !allComplete ? (
              <button
                onClick={handleNextSet}
                className="btn-next"
                style={{
                  background: '#f4f4f5',
                  border: 'none',
                  borderRadius: 6, color: '#09090b',
                  fontFamily: 'monospace', fontSize: 12, fontWeight: 600,
                  padding: '8px 24px', cursor: 'pointer',
                  letterSpacing: 1,
                  transition: 'background 0.2s',
                }}
              >
                NEXT SET →
              </button>
            ) : (
              <span style={{
                fontFamily: 'monospace', fontSize: 11,
                color: '#52525b', letterSpacing: 1,
              }}>
                AWAITING INPUT...
              </span>
            )}
          </div>
        </div>

        {/* All complete overlay */}
        {allComplete && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(9, 9, 11, 0.95)',
            backdropFilter: 'blur(4px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 20, zIndex: 20,
            animation: 'fadeIn 0.3s ease',
          }}>
            <div style={{
              width: 54, height: 54, borderRadius: '50%',
              background: '#34d399',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#09090b', fontSize: 28, fontWeight: 'bold' }}>✓</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 22, fontWeight: 500, letterSpacing: 2,
                color: '#f4f4f5', marginBottom: 8
              }}>
                ALL ANOMALIES DETECTED
              </div>
              <div style={{
                fontFamily: 'monospace', fontSize: 12,
                color: '#a1a1aa', letterSpacing: 1
              }}>
                SYSTEM CLEARED — SEQUENCE COMPLETE
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scaleIn {
          0%   { transform: translate(-50%,-50%) scale(0.5); opacity: 0; }
          100% { transform: translate(-50%,-50%) scale(1); opacity: 1; }
        }
        @keyframes fadeOut {
          0%   { transform: translate(-50%,-50%) scale(0.8); opacity: 1; }
          40%  { transform: translate(-50%,-50%) scale(1.05); opacity: 1; }
          100% { transform: translate(-50%,-50%) scale(1.1); opacity: 0; }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        
        .btn-abort:hover {
          background: #27272a !important;
          color: #f4f4f5 !important;
        }
        .btn-next:hover {
          background: #d4d4d8 !important;
        }
      `}</style>
    </div>
  );
}