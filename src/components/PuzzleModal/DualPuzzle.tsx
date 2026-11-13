import { useState, useEffect } from 'react';
import { useSFX } from '../../hooks/useSFX';
import { usePuzzleSync } from '../../hooks/Usepuzzlesync';
import { multiplayer } from '../../lib/multiplayer';
import { useGameStore } from '../../store/gameStore';

// ─── Symbols ──────────────────────────────────────────────────────────────────
const SYMBOLS: Record<string, JSX.Element> = {
  bintang:  <svg viewBox="0 0 40 40" fill="none"><polygon points="20,3 24.9,14.6 37.6,15.5 28.2,23.6 31.3,36 20,29.2 8.7,36 11.8,23.6 2.4,15.5 15.1,14.6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
  segitiga: <svg viewBox="0 0 40 40" fill="none"><polygon points="20,4 37,35 3,35" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
  bulat:    <svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="1.5" /></svg>,
  kotak:    <svg viewBox="0 0 40 40" fill="none"><rect x="5" y="5" width="30" height="30" rx="2" stroke="currentColor" strokeWidth="1.5" /></svg>,
  bulan:    <svg viewBox="0 0 40 40" fill="none"><path d="M28 20a12 12 0 1 1-12-12 9 9 0 0 0 12 12z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
  hati:     <svg viewBox="0 0 40 40" fill="none"><path d="M20 34s-14-9.5-14-18a8 8 0 0 1 14-5.3A8 8 0 0 1 34 16c0 8.5-14 18-14 18z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>,
};

const SYMBOL_KEYS = Object.keys(SYMBOLS);
const KEYPAD_ANSWER = '8777';

interface Props {
  onSolve: () => void;
  onClose: () => void;
  symbolAnswer?: string[];
}

// ─── AssetButton (Pure CSS Sci-Fi Button) ─────────────────────────────────────
function AssetButton({
  onClick,
  children,
  disabled = false,
  color = '#00c8ff',
  style = {},
  variant = 'default',
}: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  color?: string;
  style?: React.CSSProperties;
  variant?: 'default' | 'danger' | 'symbol';
}) {
  const [hovered, setHovered] = useState(false);

  const getBackground = () => {
    if (disabled) return 'rgba(10, 15, 25, 0.4)';
    if (variant === 'danger') {
      return hovered 
        ? 'linear-gradient(180deg, rgba(239,68,68,0.3) 0%, rgba(239,68,68,0.15) 100%)' 
        : 'linear-gradient(180deg, rgba(30,10,10,0.8) 0%, rgba(15,5,5,0.9) 100%)';
    }
    return hovered 
      ? 'linear-gradient(180deg, rgba(0,200,255,0.25) 0%, rgba(0,200,255,0.1) 100%)' 
      : 'linear-gradient(180deg, rgba(0,20,40,0.8) 0%, rgba(0,10,20,0.9) 100%)';
  };

  const getBorderColor = () => {
    if (disabled) return 'rgba(255,255,255,0.05)';
    if (variant === 'danger') return hovered ? '#ef4444' : 'rgba(239, 68, 68, 0.4)';
    return hovered ? '#00c8ff' : 'rgba(0, 200, 255, 0.25)';
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        border: `1px solid ${getBorderColor()}`,
        background: getBackground(),
        appearance: 'none',
        padding: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        borderRadius: 10,
        overflow: 'hidden',
        transition: 'transform 0.1s, filter 0.1s, background 0.2s, border-color 0.2s',
        transform: hovered && !disabled ? 'scale(1.02)' : 'scale(1)',
        boxShadow: hovered && !disabled ? `0 0 12px ${color}33` : 'inset 0 1px 0 rgba(255,255,255,0.05)',
        filter: disabled ? 'brightness(0.5)' : 'brightness(1)',
        ...style,
      }}
    >
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        color,
        width: '100%', height: '100%',
      }}>
        {children}
      </div>
    </button>
  );
}

// ─── PatternOutputSlot ────────────────────────────────────────────────────────
function PatternOutputSlot({ symbol, filled }: { symbol?: string; filled: boolean }) {
  return (
    <div style={{ 
      position: 'relative', width: 38, height: 38, 
      borderRadius: 8, overflow: 'hidden',
      background: 'rgba(0, 10, 20, 0.6)',
      border: '1px solid rgba(0, 200, 255, 0.25)',
      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: filled ? '#00c8ff' : 'rgba(0,200,255,0.2)',
      }}>
        {symbol && <div style={{ width: 20, height: 20 }}>{SYMBOLS[symbol]}</div>}
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconBackspace = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
    <line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line>
  </svg>
);

const IconEnter = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 10 4 15 9 20"></polyline>
    <path d="M20 4v7a4 4 0 0 1-4 4H4"></path>
  </svg>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export function DualPuzzle({ onSolve, onClose, symbolAnswer = ['bintang', 'bulat', 'segitiga'] }: Props) {
  const sfx = useSFX();
  const lobbyCode = useGameStore((s) => s.lobbyCode);
  const token = useGameStore((s) => s.token);
  const setPuzzleInputState = useGameStore((s) => s.setPuzzleInputState);
  const savedState = useGameStore((s) => s.puzzleInputStates['puzzle_dual_lock']);

  const [digits, setDigits] = useState<string>(savedState?.digits ?? '');
  const [keypadSolved, setKeypadSolved] = useState(false);
  const [keypadShake, setKeypadShake] = useState(false);
  const [symbols, setSymbols] = useState<string[]>(savedState?.symbols ?? []);
  const [symbolSolved, setSymbolSolved] = useState(false);
  const [symbolShake, setSymbolShake] = useState(false);
  const [flash, setFlash] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 30); }, []);

  const syncInput = async (puzzleId: string, input: any) => {
    if (!lobbyCode || !token) return;
    multiplayer.syncPuzzleInput(puzzleId, input);
  };

  const { sharedInput: sharedKeypad } = usePuzzleSync('dual_keypad');
  const { sharedInput: sharedSymbol } = usePuzzleSync('dual_symbol');

  useEffect(() => {
    if (sharedKeypad !== null && typeof sharedKeypad === 'string') setDigits(sharedKeypad);
  }, [sharedKeypad]);
  useEffect(() => {
    if (sharedSymbol !== null && Array.isArray(sharedSymbol)) setSymbols(sharedSymbol);
  }, [sharedSymbol]);

  const handleDigit = (d: string) => {
    if (keypadSolved || digits.length >= 4) return;
    sfx.playClick();
    const next = digits + d;
    setDigits(next);
    syncInput('dual_keypad', next);
    setPuzzleInputState('puzzle_dual_lock', { digits: next, symbols });
  };

  const handleDelete = () => {
    if (keypadSolved) return;
    sfx.playClick();
    const next = digits.slice(0, -1);
    setDigits(next);
    syncInput('dual_keypad', next);
    setPuzzleInputState('puzzle_dual_lock', { digits: next, symbols });
  };

  const handleSymbol = (key: string) => {
    if (symbolSolved || symbols.length >= symbolAnswer.length) return;
    sfx.playClick();
    const next = [...symbols, key];
    setSymbols(next);
    syncInput('dual_symbol', next);
    setPuzzleInputState('puzzle_dual_lock', { digits, symbols: next });
  };

  const handleResetSymbol = () => {
    if (symbolSolved) return;
    setSymbols([]);
    syncInput('dual_symbol', []);
    setPuzzleInputState('puzzle_dual_lock', { digits, symbols: [] });
  };

  const handleSubmit = () => {
    const keypadOk = digits === KEYPAD_ANSWER;
    const symbolOk = symbols.length === symbolAnswer.length &&
      [...symbols].sort().join('-') === [...symbolAnswer].sort().join('-');

    if (!keypadOk) {
      sfx.playError();
      setKeypadShake(true);
      setTimeout(() => { setDigits(''); setKeypadShake(false); syncInput('dual_keypad', ''); }, 600);
      if (symbolOk) return;
    }
    if (!symbolOk) {
      sfx.playError();
      setSymbolShake(true);
      setTimeout(() => { setSymbols([]); setSymbolShake(false); syncInput('dual_symbol', ''); }, 600);
      if (keypadOk) return;
    }
    if (!keypadOk || !symbolOk) return;

    sfx.playSuccess();
    setKeypadSolved(true);
    setSymbolSolved(true);
    setFlash(true);
    setTimeout(onSolve, 1000);
  };

  const canSubmit = digits.length === 4 && symbols.length === symbolAnswer.length;
  const numpadKeys = ['1','2','3','4','5','6','7','8','9','⌫','0','↵'];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.25s ease',
      }}
      onClick={onClose}
    >
      {/* BASE PANEL (Pure CSS Style) */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 500,
          borderRadius: 24,
          overflow: 'hidden',
          background: 'linear-gradient(145deg, #070c18 0%, #03060d 100%)',
          border: '1px solid rgba(0, 200, 255, 0.3)',
          boxShadow: '0 0 50px rgba(0, 200, 255, 0.15), inset 0 0 30px rgba(0, 200, 255, 0.03)',
          transform: mounted ? 'scale(1)' : 'scale(0.96)',
          transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, padding: '32px 32px 28px' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ 
              color: '#00c8ff', fontSize: 16, letterSpacing: 8, 
              fontFamily: 'Courier New', fontWeight: 'bold', textShadow: '0 0 10px rgba(0,200,255,0.6)',
              marginBottom: 4 
            }}>
              DUAL LOCK SYSTEM
            </div>
            <div style={{ 
              color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: 3, 
              fontFamily: 'Courier New', fontWeight: 600 
            }}>
              MASUKKAN KODE & PILIH SIMBOL
            </div>
          </div>

          {/* Input Area (Top Box) */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(0, 10, 20, 0.5)', borderRadius: 12, 
            border: '1px solid rgba(0,200,255,0.15)',
            height: 76, width: '100%',
            padding: '12px 24px', marginBottom: 16,
            boxSizing: 'border-box',
            animation: keypadShake ? 'shake 0.6s' : 'none'
          }}>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'Courier New', fontSize: 13, letterSpacing: 4, fontWeight: 'bold' }}>
              INPUT CODE
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{
                  width: 40, height: 50, borderRadius: 10,
                  border: '1px solid rgba(0,200,255,0.2)',
                  background: 'rgba(0,0,0,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <span style={{
                    color: flash ? '#34d399' : '#00c8ff',
                    fontFamily: 'Courier New', fontSize: 24, fontWeight: 'bold',
                    textShadow: flash ? '0 0 12px #34d399' : '0 0 12px #00c8ff'
                  }}>
                    {digits[i] || ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Main Grid: Numpad (Kiri) + Simbol (Kanan) */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            
            {/* Numpad (Kiri) */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, flex: 1
            }}>
              {numpadKeys.map((k) => (
                <AssetButton
                  key={k}
                  onClick={() => {
                    if (k === '⌫') handleDelete();
                    else if (k === '↵') handleSubmit();
                    else handleDigit(k);
                  }}
                  disabled={
                    k === '↵' ? (!canSubmit || flash) :
                    k === '⌫' ? keypadSolved :
                    keypadSolved || digits.length >= 4
                  }
                  color={k === '⌫' ? '#ef4444' : '#00c8ff'}
                  variant={k === '⌫' ? 'danger' : 'default'}
                  style={{ height: 82 }}
                >
                  <span style={{
                    fontFamily: 'Courier New', fontSize: 22, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {k === '⌫' ? <IconBackspace /> : k === '↵' ? <IconEnter /> : k}
                  </span>
                </AssetButton>
              ))}
            </div>

            {/* Symbols Panel (Kanan) */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 6, width: 138
            }}>
              {/* Output Slots */}
              <div style={{
                display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 4,
                animation: symbolShake ? 'shake 0.6s' : 'none',
              }}>
                {Array.from({ length: symbolAnswer.length }).map((_, i) => (
                  <PatternOutputSlot key={i} symbol={symbols[i]} filled={!!symbols[i]} />
                ))}
              </div>

              {/* Tombol Simbol Vertikal */}
              {SYMBOL_KEYS.map((key) => (
                <AssetButton
                  key={key}
                  onClick={() => handleSymbol(key)}
                  disabled={symbolSolved || symbols.length >= symbolAnswer.length}
                  color='#00c8ff'
                  style={{ height: 42, width: '100%' }}
                >
                  <div style={{ width: 18, height: 18, marginBottom: 2 }}>{SYMBOLS[key]}</div>
                  <span style={{ fontFamily: 'Courier New', fontSize: 9, letterSpacing: 2, fontWeight: 'bold' }}>
                    {key.toUpperCase()}
                  </span>
                </AssetButton>
              ))}

              {/* Tombol Reset */}
              <AssetButton
                onClick={handleResetSymbol}
                disabled={symbolSolved}
                color='#ef4444'
                variant='danger'
                style={{ height: 38, width: '100%', marginTop: 2 }}
              >
                <span style={{ fontFamily: 'Courier New', fontSize: 9, letterSpacing: 2, fontWeight: 'bold' }}>
                  ↺ RESET
                </span>
              </AssetButton>
            </div>
          </div>

          {/* Full Width Submit Button */}
          <AssetButton 
            onClick={handleSubmit} 
            disabled={!canSubmit || flash} 
            style={{ width: '100%', height: 54 }}
            color={canSubmit && !flash ? '#00c8ff' : 'rgba(255,255,255,0.2)'}
          >
            <span style={{ fontFamily: 'Courier New', fontSize: 16, letterSpacing: 10, fontWeight: 'bold' }}>
              SUBMIT
            </span>
          </AssetButton>

          {/* Flash Overlay saat berhasil */}
          {flash && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 24,
              background: 'rgba(52,211,153,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none', zIndex: 10, backdropFilter: 'blur(2px)'
            }}>
              <span style={{
                fontFamily: 'Courier New', fontSize: 16, letterSpacing: 6, fontWeight: 'bold',
                color: '#34d399', textShadow: '0 0 20px #34d399',
              }}>
                ✓ AKSES DIBERIKAN
              </span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          15%{transform:translateX(-8px)}
          30%{transform:translateX(8px)}
          45%{transform:translateX(-6px)}
          60%{transform:translateX(6px)}
          75%{transform:translateX(-3px)}
          90%{transform:translateX(3px)}
        }
      `}</style>
    </div>
  );
}