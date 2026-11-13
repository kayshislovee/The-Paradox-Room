import { useState, useEffect, useRef } from 'react';
import type { Puzzle } from '../../types/game.types';
import { useSFX } from '../../hooks/useSFX';
import { useGameStore } from '../../store/gameStore';

// ── Asset paths ───────────────────────────────
const ASSET_COMPUTER       = '/objects/computer.png';
const ASSET_CALC_FRAME     = '/objects/kalkulatorhitam.png';
const ASSET_BTN_NUMBER     = '/objects/tombol1.png';
const ASSET_BTN_DELETE     = '/objects/tombolno.png';
const ASSET_BTN_ENTER      = '/objects/tombolyes.png';

interface Props {
  puzzle: Puzzle;
  onSolve: () => void;
  onClose: () => void;
  onInputChange?: (input: string) => void;
  sharedInput?: string;
  sharedBy?: string;
}

// Urutan dibalik mulai dari 1,2,3 di atas
const KEYPAD_LAYOUT = [
  ['1','2','3'],
  ['4','5','6'],
  ['7','8','9'],
];

export function ComputerPuzzle({ puzzle, onSolve, onClose, onInputChange, sharedInput, sharedBy }: Props) {
  const sfx = useSFX();
  const answer = typeof puzzle.answer === 'string' ? puzzle.answer : puzzle.answer[0];
  const maxDigits = puzzle.maxDigits ?? answer.length;

  const setPuzzleInputState = useGameStore(s => s.setPuzzleInputState);
  const savedState = useGameStore(s => s.puzzleInputStates[puzzle.id]);

  const [input, setInput]     = useState<string>(savedState ?? '');
  const [status, setStatus]   = useState<'idle' | 'error' | 'success'>('idle');
  const [mounted, setMounted] = useState(false);
  const [shake, setShake]     = useState(false);
  const [blink, setBlink]     = useState(true);
  const blinkRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { setTimeout(() => setMounted(true), 30); }, []);

  useEffect(() => {
    blinkRef.current = setInterval(() => setBlink(b => !b), 530);
    return () => { if (blinkRef.current) clearInterval(blinkRef.current); };
  }, []);

  useEffect(() => {
    // Hanya string yang aman — input dipakai sebagai `input[i]` saat render.
    if (typeof sharedInput === 'string') setInput(sharedInput);
  }, [sharedInput]);

  const handlePress = (key: string) => {
    if (status === 'success') return;
    sfx.playClick();

    if (key === 'DEL') {
      const next = safeInput.slice(0, -1);
      setInput(next);
      setPuzzleInputState(puzzle.id, next);
      onInputChange?.(next);
      return;
    }
    if (key === 'ENTER') {
      if (safeInput === answer) {
        setStatus('success');
        sfx.playSuccess?.();
        setTimeout(() => onSolve(), 1200);
      } else {
        setStatus('error');
        sfx.playError?.();
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setStatus('idle');
          setInput('');
          setPuzzleInputState(puzzle.id, '');
        }, 800);
      }
      return;
    }
    if (safeInput.length >= maxDigits) return;
    const next = safeInput + key;
    setInput(next);
    setPuzzleInputState(puzzle.id, next);
    onInputChange?.(next);
  };

  // Jaring pengaman: `input` bisa saja berisi nilai aneh dari state bersama.
  const safeInput = typeof input === 'string' ? input : '';
  const digits = Array.from({ length: maxDigits }, (_, i) => safeInput[i] ?? null);

  const screenColor = status === 'success'
    ? '#34d399'
    : status === 'error'
      ? '#ef4444'
      : '#38bdf8';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      // Mengubah background biru menjadi netral transparan (hitam)
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: mounted ? 1 : 0, transition: 'opacity 0.3s',
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        transform: mounted ? 'translateY(0)' : 'translateY(12px)',
        transition: 'transform 0.3s',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          width: '100%', paddingBottom: 8,
          borderBottom: '1px solid rgba(255,255,255,0.1)', // Mengganti garis biru dengan putih transparan
        }}>
          <span style={{ color: '#9ca3af', fontFamily: 'monospace', fontSize: 12, letterSpacing: 2 }}>
            {puzzle.title}
          </span>
          {sharedBy && (
            <span style={{ color: '#a78bfa', fontFamily: 'monospace', fontSize: 10 }}>
              ✏ {sharedBy} mengetik...
            </span>
          )}
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#9ca3af',
            cursor: 'pointer', fontSize: 20,
          }}>✕</button>
        </div>

        {/* Main layout: Komputer Kiri, Kalkulator Kanan (diatur oleh display flex bawaan) */}
        <div style={{
          display: 'flex', gap: 32, alignItems: 'center',
          animation: shake ? 'shake 0.6s' : 'none',
        }}>

          {/* ── Komputer (kiri) ── */}
          <div style={{ position: 'relative', width: 520, height: 390 }}>
            <img src={ASSET_COMPUTER} alt="Computer" style={{
              width: '150%', height: '140%', objectFit: 'fill',
              position: 'absolute', left: -120, top: -80,
            }} />

            <div style={{
              position: 'absolute',
              top: '-10%', left: '25%', right: '19%', bottom: '25%',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 24, zIndex: 1,
            }}>
              <div style={{
                fontFamily: 'monospace', fontSize: 18,
                color: status === 'success' ? '#34d399' : '#94a3b8',
                letterSpacing: 4,
                textShadow: status === 'success' ? '0 0 12px #34d399' : 'none',
                transition: 'all 0.3s',
              }}>
                {status === 'success' ? '✓ ACCESS GRANTED' : status === 'error' ? '✗ WRONG CODE' : 'ENTER CODE'}
              </div>

              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
                {digits.map((d, i) => (
                  <div key={i} style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 6,
                    minWidth: 28,
                  }}>
                    <span style={{
                      fontFamily: 'monospace', fontSize: 28, fontWeight: 700,
                      color: screenColor,
                      textShadow: `0 0 10px ${screenColor}88`,
                      minHeight: 36,
                      display: 'block',
                      transition: 'color 0.3s',
                    }}>
                      {d ?? (
                        i === safeInput.length && blink && status === 'idle'
                          ? <span style={{ color: screenColor, opacity: 0.8 }}>|</span>
                          : ''
                      )}
                    </span>
                    <div style={{
                      width: '100%', height: 2,
                      background: d ? screenColor : i === safeInput.length ? `${screenColor}66` : 'rgba(255,255,255,0.2)',
                      transition: 'background 0.3s',
                      borderRadius: 1,
                    }}/>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Kalkulator (kanan) ── */}
          <div style={{ position: 'relative', width: 490, minHeight: 340 }}>
            <img src={ASSET_CALC_FRAME} alt="Calculator" style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'fill',
              borderRadius: 12,
            }} />

            <div style={{
              position: 'relative', zIndex: 1,
              padding: '0px 0px',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              {/* Grid 1-2-3 / 4-5-6 / 7-8-9 */}
              {KEYPAD_LAYOUT.map((row, ri) => (
                <div key={ri} style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  {row.map((key, ki) => (
                    <NumberBtn
                      key={ki}
                      label={key}
                      onClick={() => handlePress(key)}
                      disabled={status === 'success'}
                    />
                  ))}
                </div>
              ))}

              {/* Baris paling bawah: ENTER (Kiri), 0 (Tengah), DEL (Kanan) */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <ActionBtn
                  src={ASSET_BTN_ENTER}
                  label=""
                  onClick={() => handlePress('ENTER')}
                  disabled={status === 'success' || safeInput.length === 0}
                  color="#34d399"
                />
                <NumberBtn
                  label="0"
                  onClick={() => handlePress('0')}
                  disabled={status === 'success'}
                />
                <ActionBtn
                  src={ASSET_BTN_DELETE}
                  label=""
                  onClick={() => handlePress('DEL')}
                  disabled={status === 'success'}
                  color="#ef4444"
                />
              </div>
            </div>
          </div>
        </div>

        {puzzle.clueIds?.length > 0 && (
          <div style={{
            display: 'flex', gap: 8, flexWrap: 'wrap',
            justifyContent: 'center', marginTop: 4,
          }}>
            <span style={{ color: '#9ca3af', fontFamily: 'monospace', fontSize: 11 }}>Clue:</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-5px); }
          60% { transform: translateX(5px); }
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }
      `}</style>
    </div>
  );
}

// ── Tombol angka ─────────────────────────────────────────────────────────────
function NumberBtn({ label, onClick, disabled }: {
  label: string; onClick: () => void; disabled: boolean;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <div
      style={{
        width: 70, height: 60,top:40,left:-5,
        position: 'relative',
        cursor: disabled ? 'default' : 'pointer',
        transform: pressed ? 'scale(0.92)' : 'scale(1)',
        transition: 'transform 0.1s',
        userSelect: 'none',
      }}
      onMouseDown={() => { if (!disabled) setPressed(true); }}
      onMouseUp={() => { setPressed(false); if (!disabled) onClick(); }}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => { if (!disabled) setPressed(true); }}
      onTouchEnd={() => { setPressed(false); if (!disabled) onClick(); }}
    >
      <img src={ASSET_BTN_NUMBER} alt={label} style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%', objectFit: 'fill',
        borderRadius: 6,
        filter: disabled ? 'brightness(0.5)' : pressed ? 'brightness(0.8)' : 'brightness(1)',
        transition: 'filter 0.1s',
      }} />
      <span style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'monospace', fontSize: 18, fontWeight: 700,
        color: disabled ? 'rgba(255,255,255,0.4)' : '#e2e8f0',
        zIndex: 1,
        userSelect: 'none',
      }}>
        {label}
      </span>
    </div>
  );
}

// ── Tombol aksi (DEL / ENTER) ─────────────────────────────────────────────────
function ActionBtn({ src, label, onClick, disabled, color }: {
  src: string; label: string; onClick: () => void; disabled: boolean; color: string;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <div
      style={{
        width: 70, height: 60, top:40,left:-5, // Diubah menjadi 52 agar sejajar membentuk grid dengan tombol angka
        position: 'relative',
        cursor: disabled ? 'default' : 'pointer',
        transform: pressed ? 'scale(0.92)' : 'scale(1)',
        transition: 'transform 0.1s',
        userSelect: 'none',
        opacity: disabled ? 0.4 : 1,
      }}
      onMouseDown={() => { if (!disabled) setPressed(true); }}
      onMouseUp={() => { setPressed(false); if (!disabled) onClick(); }}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => { if (!disabled) setPressed(true); }}
      onTouchEnd={() => { setPressed(false); if (!disabled) onClick(); }}
    >
      <img src={src} alt={label} style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%', objectFit: 'fill',
        borderRadius: 6,
        filter: pressed ? 'brightness(0.8)' : 'brightness(1)',
        transition: 'filter 0.1s',
      }} />
      {/* Teks dikosongkan (me-render label kosong) agar tidak menimpa icon coretan dari dalam asset gambar */}
      <span style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'monospace', fontSize: 20, fontWeight: 700,
        color: color, zIndex: 1, userSelect: 'none',
      }}>
        {label}
      </span>
    </div>
  );
}