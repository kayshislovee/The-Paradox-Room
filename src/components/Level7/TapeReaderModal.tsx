import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { Item } from '../../types/game.types';

// Config tape — path dummy dulu
const TAPE_CONFIG: Record<string, {
  screenGif: string;
  screenGifTranslated: string;
  label: string;
}> = {
  item_tape_a: {
    screenGif: '/objects/greenglitch.gif',
    screenGifTranslated: '/objects/monitor.png',
    label: 'TAPE A — DATA STREAM',
  },
  item_tape_b: {
    screenGif: '/objects/greenglitch.gif',
    screenGifTranslated: '/objects/monitor.png',
    label: 'TAPE B — ENCRYPTED LOG',
  },
  item_tape_c: {
    screenGif: '/objects/greenglitch.gif',
    screenGifTranslated: '/objects/monitor.png',
    label: 'TAPE C — SYSTEM DATA',
  },
};

const STATIC_NOISE = '/objects/greenglitch.gif'; // layar semut

interface Props {
  onClose: () => void;
}

export function TapeReaderModal({ onClose }: Props) {
  // === BAGIAN YANG DIUBAH ===
  const char1Inventory = useGameStore((s) => s.char1Inventory);
  const removeFromChar1Inventory = useGameStore((s) => s.removeFromChar1Inventory);
  const addToChar1Inventory = useGameStore((s) => s.addToChar1Inventory);

  // Tape reader hanya untuk char1 (control room)
  const inventory = char1Inventory;
  const removeFromInventory = removeFromChar1Inventory;
  const addToInventory = addToChar1Inventory;
  // ==========================

  const translationActive = useGameStore((s) => s.translationActive);
  const showNotification  = useGameStore((s) => s.showNotification);

  // Tape yang sedang ada di dalam komputer
  const [insertedTape, setInsertedTape] = useState<Item | null>(null);

  // Tape di inventory
  const tapesInInventory = inventory.filter((i) =>
    ['item_tape_a', 'item_tape_b', 'item_tape_c'].includes(i.id)
  );

  const handleInsert = (tape: Item) => {
    if (insertedTape) {
      // Eject dulu yang ada
      addToInventory(insertedTape);
    }
    removeFromInventory(tape.id);
    setInsertedTape(tape);
    showNotification(`${tape.name} dimasukkan ke komputer.`, 'info');
  };

  const handleEject = () => {
    if (!insertedTape) return;
    addToInventory(insertedTape);
    showNotification(`${insertedTape.name} dikeluarkan.`, 'info');
    setInsertedTape(null);
  };

  const tapeConfig = insertedTape ? TAPE_CONFIG[insertedTape.id] : null;
  const screenSrc = tapeConfig
    ? translationActive
      ? tapeConfig.screenGifTranslated
      : tapeConfig.screenGif
    : STATIC_NOISE;

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, backdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(160deg,#0a0f1e,#111827)',
          border: '1px solid rgba(56,189,248,0.2)',
          borderRadius: 16, padding: '24px 28px',
          width: 560, boxShadow: '0 24px 64px rgba(0,0,0,0.9)',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: 'Courier New', fontSize: 12, color: '#38bdf8', letterSpacing: 3 }}>
              TAPE READER
            </h3>
            <p style={{ margin: '3px 0 0', fontFamily: 'Courier New', fontSize: 8, color: '#334155', letterSpacing: 2 }}>
              {tapeConfig?.label ?? 'NO TAPE INSERTED — STATIC MODE'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Layar komputer */}
        <div style={{
          width: '100%', aspectRatio: '16/9',
          background: '#000',
          border: `2px solid ${insertedTape ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.05)'}`,
          borderRadius: 8, overflow: 'hidden',
          position: 'relative',
          boxShadow: insertedTape ? '0 0 20px rgba(56,189,248,0.15)' : 'none',
        }}>
          <img
            key={screenSrc + String(translationActive)}
            src={screenSrc}
            onError={(e) => {
              // File GIF screen tidak selalu ada di repo — fallback ke gambar monitor
              // supaya tidak tampil sebagai gambar rusak.
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/objects/layar.png';
            }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            alt="screen"
          />

          {/* Badge translate */}
          {insertedTape && translationActive && (
            <div style={{
              position: 'absolute', top: 8, right: 8,
              padding: '3px 8px',
              background: 'rgba(56,189,248,0.2)',
              border: '1px solid rgba(56,189,248,0.5)',
              borderRadius: 4,
              fontFamily: 'Courier New', fontSize: 8, color: '#38bdf8', letterSpacing: 1,
            }}>
              🌐 TRANSLATED
            </div>
          )}

          {/* Label translate hint */}
          {insertedTape && !translationActive && (
            <div style={{
              position: 'absolute', bottom: 8, left: '50%',
              transform: 'translateX(-50%)',
              padding: '3px 10px',
              background: 'rgba(0,0,0,0.7)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 4,
              fontFamily: 'Courier New', fontSize: 7, color: 'rgba(255,255,255,0.4)', letterSpacing: 1,
              whiteSpace: 'nowrap',
            }}>
              Aktifkan TRANSLATE untuk membaca data
            </div>
          )}
        </div>

        {/* Tape slot & controls */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>

          {/* Slot tape aktif */}
          <div style={{
            flex: 1, padding: '10px 14px',
            background: 'rgba(0,0,0,0.4)',
            border: `1px solid ${insertedTape ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 8,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 6,
              background: insertedTape ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${insertedTape ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.06)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {insertedTape
                ? <img src={(insertedTape as any).image || ''} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} alt="" />
                : <div style={{ width: 16, height: 16, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 3 }} />
              }
            </div>
            <div>
              <div style={{ fontFamily: 'Courier New', fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2 }}>SLOT</div>
              <div style={{ fontFamily: 'Courier New', fontSize: 10, color: insertedTape ? '#38bdf8' : '#334155', letterSpacing: 1 }}>
                {insertedTape?.name ?? '— EMPTY —'}
              </div>
            </div>
          </div>

          {/* Tombol eject */}
          {insertedTape && (
            <button
              onClick={handleEject}
              style={{
                padding: '8px 14px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8, color: '#f87171',
                fontFamily: 'Courier New', fontSize: 9, letterSpacing: 2,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              ⏏ EJECT
            </button>
          )}
        </div>

        {/* Inventory tape */}
        <div>
          <div style={{ fontFamily: 'Courier New', fontSize: 8, color: 'rgba(255,255,255,0.25)', letterSpacing: 2, marginBottom: 8 }}>
            TAPE DI INVENTORY
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {tapesInInventory.length === 0 && (
              <div style={{ fontFamily: 'Courier New', fontSize: 8, color: '#334155' }}>
                Tidak ada tape di inventory
              </div>
            )}
            {tapesInInventory.map((tape) => (
              <button
                key={tape.id}
                onClick={() => handleInsert(tape)}
                title={`Masukkan ${tape.name}`}
                style={{
                  width: 52, height: 52, padding: 4,
                  background: 'rgba(124,58,237,0.08)',
                  border: '1px solid rgba(124,58,237,0.25)',
                  borderRadius: 8, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s', overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(124,58,237,0.6)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.15)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(124,58,237,0.25)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.08)';
                }}
              >
                {(tape as any).image
                  ? <img src={(tape as any).image} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt={tape.name} />
                  : <span style={{ fontSize: 22 }}>{tape.icon}</span>
                }
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}