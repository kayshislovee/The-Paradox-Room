import { useState, useEffect, useRef } from 'react';
import type { Puzzle } from '../../types/game.types';
import { useSFX } from '../../hooks/useSFX';
import { useGameStore } from '../../store/gameStore';

// ── Asset paths ───────────────────────────────
const ASSET_LOCKER       = '/objects/safe.png'; 
const ASSET_CALC_FRAME   = '/objects/safebase.png'; 
const ASSET_BTN_NUMBER   = '/objects/tombolsafe.png';
const ASSET_BTN_DELETE   = '/objects/tombolsafe.png';
const ASSET_BTN_ENTER    = '/objects/tombolsafe.png';

interface Props {
  puzzle: Puzzle;
  onSolve: () => void;
  onClose: () => void;
  onInputChange?: (input: string) => void;
  sharedInput?: string;
  sharedBy?: string;
}

// Urutan keypad mulai dari 1,2,3 di atas
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
    // Hanya string yang aman: input dipakai sebagai `input[i]` di render.
    // Nilai lain (null dari server, angka, dll) akan membuat render crash.
    if (typeof sharedInput === 'string') setInput(sharedInput);
  }, [sharedInput]);

  // Jaring pengaman: `input` selalu diperlakukan sebagai string, apa pun
  // nilainya — render memakai `input[i]` yang akan meledak kalau bukan string.
  const safeInput = typeof input === 'string' ? input : '';

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

  const digits = Array.from({ length: maxDigits }, (_, i) => safeInput[i] ?? null);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
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
          borderBottom: '1px solid rgba(255,255,255,0.1)',
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

        {/* ── Main Container: Locker (Background) & Keypad Panel ── */}
        <div style={{
          position: 'relative', width: 540, height: 540,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: shake ? 'shake 0.6s' : 'none',
        }}>
          {/* 1. Layer Paling Belakang: Safe / Locker Asset */}
          <img src={ASSET_LOCKER} alt="Locker" style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%', objectFit: 'contain',
            zIndex: 0,
          }} />

          {/* 2. Layer Tengah & Atas: Keypad Base (Menyesuaikan posisi sebelah kanan brankas seperti gambar) */}
          <div style={{
            position: 'absolute',
            right: '95px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '185px',
            height: '275px',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <img src={ASSET_CALC_FRAME} alt="Calculator Base" style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'fill',
            }} />

            {/* 3. Area Layar Hijau */}
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '18px',
              right: '18px',
              height: '54px',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
            }}>
              <div style={{ minHeight: 14 }} />

              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                {digits.map((d, i) => (
                  <div key={i} style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', minWidth: 16,
                  }}>
                    <span style={{
                      fontFamily: 'monospace', fontSize: 20, fontWeight: 700,
                      color: '#0f172a',
                      minHeight: 24, display: 'block', textAlign: 'center',
                    }}>
                      {d ?? (
                        i === safeInput.length && blink && status === 'idle'
                          ? <span style={{ color: '#0f172a', opacity: 0.8 }}>|</span>
                          : ''
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Layer Tombol Keypad (1-9, DEL, 0, ENTER) */}
            <div style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              right: '16px',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 5,
              alignItems: 'center',
            }}>
              {/* Grid Angka 1-9 */}
              {KEYPAD_LAYOUT.map((row, ri) => (
                <div key={ri} style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
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

              {/* Baris Bawah: DEL (Kiri), 0 (Tengah), ENTER (Kanan) */}
              <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                <ActionBtn
                  src={ASSET_BTN_DELETE}
                  label="⌫"
                  onClick={() => handlePress('DEL')}
                  disabled={status === 'success'}
                  color="#334155"
                />
                <NumberBtn
                  label="0"
                  onClick={() => handlePress('0')}
                  disabled={status === 'success'}
                />
                <ActionBtn
                  src={ASSET_BTN_ENTER}
                  label="↵"
                  onClick={() => handlePress('ENTER')}
                  disabled={status === 'success' || safeInput.length === 0}
                  color="#334155"
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

// ── Tombol Angka ─────────────────────────────────────────────────────────────
function NumberBtn({ label, onClick, disabled }: {
  label: string; onClick: () => void; disabled: boolean;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <div
      style={{
        width: 46, height: 36,
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
        borderRadius: 4,
        filter: disabled ? 'brightness(0.5)' : pressed ? 'brightness(0.8)' : 'brightness(1)',
        transition: 'filter 0.1s',
      }} />
      <span style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'monospace', fontSize: 15, fontWeight: 700,
        color: disabled ? 'rgba(255,255,255,0.4)' : '#e2e8f0',
        zIndex: 1,
        userSelect: 'none',
      }}>
        {label}
      </span>
    </div>
  );
}

// ── Tombol Aksi (DEL / ENTER) ─────────────────────────────────────────────────
function ActionBtn({ src, label, onClick, disabled, color }: {
  src: string; label: string; onClick: () => void; disabled: boolean; color: string;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <div
      style={{
        width: 46, height: 36,
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
        borderRadius: 4,
        filter: pressed ? 'brightness(0.8)' : 'brightness(1)',
        transition: 'filter 0.1s',
      }} />
      <span style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'monospace', fontSize: 16, fontWeight: 700,
        color: color, zIndex: 1, userSelect: 'none',
      }}>
        {label}
      </span>
    </div>
  );
}