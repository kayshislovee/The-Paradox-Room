import { useState, useEffect } from 'react';
import type { Puzzle } from '../../types/game.types';
import { useSFX } from '../../hooks/useSFX';
import { useGameStore } from '../../store/gameStore';

const ASSET_BASE = '/objects/metal.png';
const ASSET_LEVER_OFF = '/objects/leveroff.png';
const ASSET_LEVER_ON = '/objects/leveron.png';
const ASSET_LEVER_BUTTON = '/objects/tombolever.png';

interface Props {
  puzzle: Puzzle;
  onSolve: () => void;
  onInputChange?: (input: boolean[]) => void;
  sharedInput?: boolean[];
  sharedBy?: string;
}

export function LeverPuzzle({ puzzle, onSolve, onInputChange, sharedInput, sharedBy }: Props) {
  const sfx = useSFX();
  const answer = typeof puzzle.answer === 'string' ? puzzle.answer : puzzle.answer.join('');
  const leverCount = answer.length;
  const setPuzzleInputState = useGameStore((s) => s.setPuzzleInputState);
  const savedState = useGameStore((s) => s.puzzleInputStates[puzzle.id]);
  const [levers, setLevers] = useState<boolean[]>(savedState ?? Array(leverCount).fill(false));
  const [shaking, setShaking] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (sharedInput && sharedInput.length === leverCount) {
      setLevers(sharedInput);
    }
  }, [sharedInput]);

  const toggleLever = (i: number) => {
    sfx.playClick();
    if (flash) return;
    setLevers((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      onInputChange?.(next); // sync ke lobby
      setPuzzleInputState(puzzle.id, next); // simpan ke store
      return next;
    });
  };

  const handleCheck = () => {
    const playerPattern = levers.map((on) => (on ? '1' : '0')).join('');
    if (playerPattern === answer) {
      sfx.playSuccess();
      setFlash(true);
      setTimeout(() => onSolve(), 1500); // Sedikit diperpanjang agar animasi terlihat
    } else {
      sfx.playError();
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
    }
  };

  const handleReset = () => {
    if (flash) return;
    const reset = Array(leverCount).fill(false);
    setLevers(reset);
    onInputChange?.(reset);
  };

  const activeCount = levers.filter(Boolean).length;
  const isSharedMode = sharedInput !== undefined;

  return (
    <div className="lever-puzzle-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%', maxWidth: 500, margin: '0 auto' }}>

      {/* Indikator player lain */}
      {isSharedMode && sharedBy && (
        <div style={{
          width: '100%', padding: '8px 16px',
          background: 'linear-gradient(90deg, rgba(124,58,237,0.05), rgba(124,58,237,0.2), rgba(124,58,237,0.05))',
          borderTop: '1px solid rgba(124,58,237,0.3)',
          borderBottom: '1px solid rgba(124,58,237,0.3)',
          fontFamily: 'Courier New', fontSize: 11, color: '#c4b5fd',
          letterSpacing: 2, textAlign: 'center',
          textShadow: '0 0 8px rgba(124,58,237,0.5)',
          animation: 'pulse 2s infinite'
        }}>
          <span style={{ marginRight: 8 }}>⚡</span> 
          {sharedBy.toUpperCase()} SEDANG MENGATUR TUAS...
        </div>
      )}

      {/* Status bar */}
      <div style={{
        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 18px', background: '#0f172a',
        borderRadius: 8, border: '1px solid #1e293b',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: flash ? '#34d399' : '#38bdf8',
            boxShadow: `0 0 8px ${flash ? '#34d399' : '#38bdf8'}`,
          }} />
          <span style={{ fontFamily: 'Courier New', fontSize: 11, color: '#94a3b8', letterSpacing: 2 }}>
            CIRCUIT BOARD v2.4
          </span>
        </div>
        
        <span style={{
          fontFamily: 'Courier New', fontSize: 11, fontWeight: 'bold',
          color: flash ? '#34d399' : isSharedMode ? '#a78bfa' : activeCount > 0 ? '#fbbf24' : '#64748b',
          letterSpacing: 2,
          textShadow: flash ? '0 0 10px rgba(52,211,153,0.8)' : 'none',
          transition: 'all 0.3s',
        }}>
          {flash ? 'SYSTEM UNLOCKED' : `[ ${activeCount} / ${leverCount} ] ACTIVE`}
        </span>
      </div>

      {/* Main Puzzle Panel */}
      <div style={{
        width: '100%', position: 'relative', borderRadius: 16,
        padding: 4, background: 'linear-gradient(to bottom, #334155, #0f172a)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        animation: shaking ? 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both' : 'none',
      }}>
        
        <div style={{
          position: 'relative', borderRadius: 12, overflow: 'hidden',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)', // Efek cekung (recessed)
        }}>
          {/* Background metal plate */}
          <img src={ASSET_BASE} alt="metal-bg" style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', opacity: 0.8, mixBlendMode: 'luminosity'
          }} />

          {/* Overlay gradien agar tidak terlalu terang */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.6) 100%)'
          }} />

          {/* Konten tuas */}
          <div style={{ position: 'relative', zIndex: 1, padding: '32px 24px 28px' }}>
            
            {/* Flash overlay success */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(52,211,153,0.2), rgba(52,211,153,0.05))',
              opacity: flash ? 1 : 0, transition: 'opacity 0.4s ease-in-out',
              pointerEvents: 'none',
            }}/>

            {/* Levers row */}
            <div style={{
              display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap',
            }}>
              {levers.map((isOn, i) => (
                <div key={i} style={{ position: 'relative', display: 'inline-block' }}>
                  {/* Lever visual — display saja (posisi statis) */}
                  <Lever3D index={i} isOn={isOn} flash={flash} />

                  {/* Tombol input (tombolever.png) — overlay di ATAS lever sesuai posisi statis */}
                  <button
                    type="button"
                    onClick={() => toggleLever(i)}
                    disabled={flash}
                    title={`Tuas ${i + 1}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      padding: 0, border: 'none', background: 'transparent',
                      cursor: flash ? 'default' : 'pointer',
                      transform: 'scale(1)',
                      transition: 'transform 0.15s',
                      zIndex: 2,
                    }}
                    onMouseDown={(e) => { if (!flash) e.currentTarget.style.transform = 'scale(0.92)'; }}
                    onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <img
                      src={ASSET_LEVER_BUTTON}
                      alt={`Tombol tuas ${i + 1}`}
                      style={{
                        width: 71, height: 58, objectFit: 'contain',
                        filter: flash ? 'brightness(0.5)' : 'brightness(1)',
                        transition: 'filter 0.2s',
                        position: 'absolute',
                        top: '64%',
                        left: '51%',
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                  </button>
                </div>
              ))}
            </div>

            {/* Binary LED display */}
            <div style={{ 
              marginTop: 32, display: 'flex', gap: 8, justifyContent: 'center',
              background: 'rgba(0,0,0,0.4)', padding: '12px 16px', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.05)',
              boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.5)'
            }}>
              {levers.map((isOn, i) => (
                <div key={i} style={{
                  width: 24, height: 28, borderRadius: 4,
                  background: isOn ? (flash ? 'rgba(52,211,153,0.15)' : 'rgba(56,189,248,0.15)') : '#020617',
                  border: `1px solid ${isOn ? (flash ? '#34d399' : '#38bdf8') : '#1e293b'}`,
                  boxShadow: isOn ? `0 0 10px ${flash ? 'rgba(52,211,153,0.4)' : 'rgba(56,189,248,0.4)'}, inset 0 0 4px ${flash ? '#34d399' : '#38bdf8'}` : 'inset 0 2px 4px rgba(0,0,0,0.8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}>
                  <span style={{ 
                    fontFamily: 'Courier New', fontSize: 13, fontWeight: 800,
                    color: isOn ? (flash ? '#34d399' : '#38bdf8') : '#334155',
                    textShadow: isOn ? `0 0 8px ${flash ? '#34d399' : '#38bdf8'}` : 'none'
                  }}>
                    {isOn ? '1' : '0'}
                  </span>
                </div>
              ))}
            </div>

            {/* Teks Sukses */}
            <div style={{
              textAlign: 'center', marginTop: 24, fontFamily: 'Courier New',
              fontSize: 16, fontWeight: 800, color: '#34d399', letterSpacing: 6,
              textShadow: '0 0 12px rgba(52,211,153,0.8)',
              opacity: flash ? 1 : 0, transform: flash ? 'translateY(0)' : 'translateY(10px)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              height: flash ? 20 : 0, overflow: 'hidden'
            }}>
              ✓ AKSES DIBERIKAN
            </div>
          </div>
        </div>
      </div>

      {/* Tombol Aksi */}
      <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 4 }}>
        <ActionBtn label="↺ RESET" onClick={handleReset} disabled={flash} variant="secondary" />
        <ActionBtn label="INITIATE SEQUENCE" onClick={handleCheck} disabled={flash} variant="primary" />
      </div>

      {/* Style & Animasi Injected */}
      <style>{`
        @keyframes shake {
          10%, 90% { transform: translate3d(-2px, 0, 0); }
          20%, 80% { transform: translate3d(4px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-6px, 0, 0); }
          40%, 60% { transform: translate3d(6px, 0, 0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .btn-custom {
          padding: 14px 0;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 2.5px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .btn-primary {
          flex: 2;
          background: rgba(56,189,248,0.1);
          border: 1px solid rgba(56,189,248,0.4);
          color: #38bdf8;
          text-shadow: 0 0 8px rgba(56,189,248,0.4);
        }
        .btn-primary:hover:not(:disabled) {
          background: rgba(56,189,248,0.2);
          box-shadow: 0 0 16px rgba(56,189,248,0.3), inset 0 0 8px rgba(56,189,248,0.2);
          transform: translateY(-2px);
        }
        .btn-primary:active:not(:disabled) {
          transform: translateY(1px);
        }
        .btn-secondary {
          flex: 1;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          color: #94a3b8;
        }
        .btn-secondary:hover:not(:disabled) {
          background: rgba(255,255,255,0.08);
          color: #f8fafc;
        }
        .btn-secondary:active:not(:disabled) {
          transform: translateY(1px);
        }
        .btn-custom:disabled {
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.05);
          color: #334155;
          cursor: not-allowed;
          text-shadow: none;
        }
      `}</style>
    </div>
  );
}

function Lever3D({ index, isOn, flash }: {
  index: number; isOn: boolean; flash: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 6, userSelect: 'none',
      }}
    >
      <div style={{ position: 'relative', width: 75, height: 105 }}>
        {/* Shadow base untuk memberikan kesan tuasnya tebal */}
        <div style={{
          position: 'absolute', bottom: -10, left: '10%', width: '80%', height: 20,
          background: 'rgba(0,0,0,0.6)', filter: 'blur(6px)', borderRadius: '50%',
          opacity: isOn ? 0.3 : 0.8, transition: 'opacity 0.3s'
        }} />

        <img
          src={isOn ? ASSET_LEVER_ON : ASSET_LEVER_OFF}
          alt={`Lever ${index + 1}`}
          style={{
            width: '100%', height: '100%', objectFit: 'contain',
            filter: flash ? 'drop-shadow(0 0 12px rgba(52,211,153,0.8)) saturate(1.5)' : isOn ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' : 'drop-shadow(0 8px 8px rgba(0,0,0,0.8))',
            transition: 'all 0.3s ease',
          }}
        />

        {/* Layar nomor tuas kecil */}
        <div style={{
          position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)',
          width: 32, height: 16, background: '#020617', borderRadius: 3,
          border: '1px solid #1e293b', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: 'Courier New', fontSize: 10, fontWeight: 800,
            color: isOn ? (flash ? '#34d399' : '#38bdf8') : '#475569',
            textShadow: isOn ? `0 0 6px ${flash ? '#34d399' : '#38bdf8'}` : 'none',
            transition: 'color 0.3s',
          }}>
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ label, onClick, disabled, variant }: {
  label: string; onClick: () => void; disabled?: boolean; variant: 'primary' | 'secondary';
}) {
  return (
    <button
      className={`btn-custom btn-${variant}`}
      onClick={() => { if (!disabled) onClick(); }}
      disabled={disabled}
    >
      {label}
    </button>
  );
}