import { useState, useEffect } from 'react';
import type { Puzzle } from '../../types/game.types';
import { useSFX } from '../../hooks/useSFX';
import { useGameStore } from '../../store/gameStore';

// Sesuaikan path ini dengan lokasi file Anda
const keypadImage = '/objects/keypadperpus.png'; 
const btnNormalImg = '/objects/tombolperpus.png'; // Tombol abu-abu polos
const btnGreenImg = '/objects/perpushijau.png';   // Tombol hijau polos
const btnRedImg = '/objects/perpusmerah.png';       // Tombol merah polos

interface Props {
  puzzle: Puzzle;
  onSolve: () => void;
  onInputChange?: (input: string) => void;
  sharedInput?: string;
  sharedBy?: string;
}

export function KeypadPuzzle({ puzzle, onSolve, onInputChange, sharedInput, sharedBy }: Props) {
  const sfx = useSFX();
  const maxDigits = puzzle.maxDigits ?? 4;
  const setPuzzleInputState = useGameStore((s) => s.setPuzzleInputState);
  const savedState = useGameStore((s) => s.puzzleInputStates[puzzle.id]);
  const savedMeta = useGameStore((s) => s.puzzleInputStates[puzzle.id + '_meta']) as Record<number, string> | undefined;
  const activeCharacter = useGameStore((s) => s.activeCharacter);

  const [input, setInput] = useState<string>(savedState ?? '');
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);
  const [errorFlash, setErrorFlash] = useState(false);

  const safeShared = sharedInput ?? undefined;
  const displayInput: string = input;
  const isSharedMode = safeShared !== undefined && safeShared !== input;

  const handlePress = (val: string) => {
    sfx.playClick();
    if (input.length >= maxDigits || flash) return;
    const newInput = input + val;
    setInput(newInput);
    onInputChange?.(newInput);
    setPuzzleInputState(puzzle.id, newInput);
    const newMeta = { ...(savedMeta ?? {}), [input.length]: activeCharacter };
    setPuzzleInputState(puzzle.id + '_meta', newMeta);
  };

  const handleDelete = () => {
    if (flash) return;
    sfx.playClick();
    const newInput = input.slice(0, -1);
    setInput(newInput);
    onInputChange?.(newInput);
    setPuzzleInputState(puzzle.id, newInput);
    const newMeta = { ...(savedMeta ?? {}) };
    delete newMeta[newInput.length];
    setPuzzleInputState(puzzle.id + '_meta', newMeta);
  };

  const handleSubmit = () => {
    if (flash) return;
    if (displayInput === puzzle.answer) {
      sfx.playSuccess();
      setFlash(true);
      onInputChange?.('');
      setTimeout(onSolve, 1000);
    } else {
      sfx.playError();
      setShake(true);
      setErrorFlash(true);
      setInput('');
      onInputChange?.('');
      setPuzzleInputState(puzzle.id, '');
      setPuzzleInputState(puzzle.id + '_meta', {});
      setTimeout(() => { setShake(false); setErrorFlash(false); }, 600);
    }
  };

  useEffect(() => {
    if (safeShared !== undefined) {
      setInput(safeShared);
    }
  }, [sharedInput, safeShared]);

  const keys = ['1','2','3','4','5','6','7','8','9','✓','0','⌫'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, position: 'relative' }}>
      
      {isSharedMode && sharedBy && (
        <div style={{
          position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)',
          padding: '6px 14px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: 7, fontFamily: 'Courier New', fontSize: 10, color: '#a78bfa',
          whiteSpace: 'nowrap', zIndex: 10,
        }}>
          ✏ {sharedBy} sedang menginput...
        </div>
      )}

      {/* Container Utama Keypad - Mempertahankan ukuran custom Anda */}
      <div style={{
        position: 'relative',
        width: '60%',
        maxWidth: '900px',
        animation: shake ? 'shakeKp 0.6s' : 'none',
        userSelect: 'none'
      }}>
        
        {/* Gambar Base Keypad */}
        <img 
          src={keypadImage} 
          alt="Keypad" 
          style={{ width: '100%', height: 'auto', display: 'block' }} 
        />

        {/* OVERLAY 1: Layar Putih - Mempertahankan kordinat & style Anda */}
        <div style={{
          position: 'absolute',
          top: '22%',
          left: '30.5%',
          width: '38%',
          height: '20%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'Courier New, monospace',
          fontSize: 'clamp(40px, 7vw, 28px)',
          fontWeight: 700,
          letterSpacing: '4px',
          color: flash ? '#10b981' : errorFlash ? '#ef4444' : '#53ee28ff',
          textShadow: flash ? '0 0 10px #10b981' : 'none',
          overflow: 'hidden'
        }}>
          {flash ? 'OPEN' : errorFlash ? 'error' : displayInput}
        </div>

        {/* OVERLAY 2: Grid Tombol - Mempertahankan kordinat & gap Anda */}
        <div style={{
          position: 'absolute',
          top: '39.5%',
          left: '29.5%',
          width: '40%',
          height: '38%',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(4, 1fr)',
          columnGap: '5%',
          rowGap: '1%',
        }}>
          {keys.map((key, idx) => {
            const isBackspace = key === '⌫';
            const isConfirm = key === '✓';
            
            // Menentukan gambar background berdasarkan jenis tombol
            const bgImage = isConfirm 
              ? `url(${btnGreenImg})` 
              : isBackspace 
                ? `url(${btnRedImg})` 
                : `url(${btnNormalImg})`;

            return (
              <button
                key={idx}
                className="asset-button"
                disabled={flash || (isConfirm && input.length < maxDigits)}
                onClick={() => {
                  if (isConfirm) handleSubmit();
                  else if (isBackspace) handleDelete();
                  else handlePress(key);
                }}
                style={{
                  backgroundImage: bgImage,
                  // Warna teks: tombol action lebih gelap, tombol angka lebih terang
                  color: isConfirm ? '#166534' : isBackspace ? '#991b1b' : '#f3f4f6',
                }}
              >
                {isConfirm ? '✓' : isBackspace ? '⌫' : key}
              </button>
            );
          })}
        </div>

      </div>

      <style>{`
        /* Animasi layarnya bergetar jika salah */
        @keyframes shakeKp {
          0%,100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }

        /* Styling tombol menggunakan aset gambar */
        .asset-button {
          /* Merender gambar secara penuh dan proporsional dalam batas grid */
          background-size: 100% 100%;
          background-repeat: no-repeat;
          background-position: center;
          background-color: transparent;
          
          border: none;
          outline: none;
          
          /* Memposisikan teks di tengah gambar tombol */
          display: flex;
          align-items: center;
          justify-content: center;
          
          padding-bottom: 8px; /* Sesuaikan angka ini (misal 4px, 8px, 12px) sampai pas */
          box-sizing: border-box;
          
          /* Styling teks angka agar sesuai dengan desain game */
          font-family: 'Arial', sans-serif;
          font-size: clamp(16px, 3.5vw, 24px); /* Menggunakan clamp agar responsif */
          font-weight: 800;
          text-shadow: 0px 2px 2px rgba(0,0,0,0.4);
          
          cursor: pointer;
          
          /* Animasi halus untuk hover dan saat ditekan */
          transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), filter 0.2s;
        }

        /* Hover effect: Mencerahkan gambar saat kursor di atasnya */
        .asset-button:hover:not(:disabled) {
          filter: brightness(1.15);
        }

        /* Active effect: Efek ditekan secara fisik ke dalam */
        .asset-button:active:not(:disabled) {
          transform: scale(0.92) translateY(2px);
          filter: brightness(0.9);
        }

        .asset-button:disabled {
          cursor: default;
          filter: opacity(0.8);
        }
      `}</style>
    </div>
  );
}