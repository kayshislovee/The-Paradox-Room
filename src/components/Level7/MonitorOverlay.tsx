import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { ComicScene } from '../Comic/ComicScene';
import type { ComicPanel } from '../Comic/ComicScene';

const TAPE_DATA: Record<string, {
  label: string;
  type?: 'text' | 'comic';
  category?: string;
  src?: string; 
  content?: { key: string; value: string }[];
  panels?: ComicPanel[];
}> = {
  item_tape_a: {
    label: 'TAPE A',
    type: 'text',
    category: 'PERSONNEL SEARCH',
    content: [
      { key: 'Department', value: 'Research' },
      { key: 'Shift', value: 'Night' },
      { key: 'Id', value: '583' },
      { key: 'Identify the personnel', value: '' },
    ],
  },
  item_tape_d: {
    label: 'TAPE D',
    type: 'text',
    category: 'MAINTENANCE LOG',
    content: [
      { key: 'Position', value: 'Technician' },
      { key: 'Shift', value: 'Day' },
      { key: 'Identify the personnel', value: '' },
    ],
  },
  item_tape_e: {
    label: 'TAPE E',
    type: 'text',
    category: 'SECURITY LOG',
    content: [
      { key: 'Department', value: 'Security' },
      { key: 'Shift', value: 'Night' },
      { key: 'Identify the personnel.', value: '' },
    ],
  },
  item_tape_comic: {
    label: 'TAPE COMIC',
    type: 'comic',
    src: '/comic/lv7tape.png',
    panels: [
      // Baris 1
      { x: 1,    y: 1,    width: 33.3, height: 33.3, enterFrom: 'fade' },
      { x: 35.3, y: 1,    width: 26.3, height: 33.3, enterFrom: 'slide-right' },
      { x: 62.3, y: 1,    width: 37, height: 33.3, enterFrom: 'slide-right' },
      // Baris 2
      { x: 1,    y: 36, width: 26.4, height: 29.2, enterFrom: 'slide-left' },
      { x: 28, y: 36, width: 35.2 , height: 29.2, enterFrom: 'scale', effect: 'flash' },
      { x: 63.8, y: 36, width: 35.4, height: 29.2, enterFrom: 'slide-right' },
      // Baris 3
      { x: 1,    y: 66.6, width: 23.4, height: 32, enterFrom: 'slide-up' },
      { x: 25.2, y: 66.6, width: 40.6, height: 32, enterFrom: 'slide-up' },
      { x: 66.6, y: 66.6, width: 32.6, height: 32, enterFrom: 'fade' },
    ],
  },
};

export function MonitorOverlay() {
  const controlRoomHacked = true;
  //const controlRoomHacked  = useGameStore((s) => s.controlRoomHacked);
  const insertedTapeId     = useGameStore((s) => s.insertedTapeId);
  const setInsertedTapeId  = useGameStore((s) => s.setInsertedTapeId);
  const char1Inventory     = useGameStore((s) => s.char1Inventory);
  const removeFromChar1Inventory = useGameStore((s) => s.removeFromChar1Inventory);
  const addToChar1Inventory      = useGameStore((s) => s.addToChar1Inventory);

  const [zoomed, setZoomed] = useState(false);
  const [showComic, setShowComic] = useState(false);
  const [monitorHovered, setMonitorHovered] = useState(false);

  // Objek monitor di scene (tempat memasukkan tape) SELALU memakai gambar
  // "layar.png" (layar terkunci) — sama dengan hotspot display-nya di
  // level7.ts. Termasuk ketika control room sudah di-hack: yang berubah cuma
  // isi overlay-nya, bukan gambar objeknya.
  const src = '/objects/layar.png';

  return (
    <>
      {/* Monitor kecil di scene */}
      {controlRoomHacked && (
        <img
          key={src}
          src={src}
          onClick={() => setZoomed(true)}
          onMouseEnter={() => setMonitorHovered(true)}
          onMouseLeave={() => setMonitorHovered(false)}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/objects/layar.png';
          }}
          style={{
            position: 'absolute',
            left: '43.4%',
            top: '19%',
            width: '22%',
            height: '30.6%',
            objectFit: 'fill',
            pointerEvents: 'auto',
            zIndex: 20,
            borderRadius: 4,
            cursor: 'pointer',
            transform: monitorHovered ? 'scale(1.06)' : 'scale(1)',
            filter: monitorHovered
              ? 'brightness(1.2) drop-shadow(0 0 14px rgba(255,255,255,0.95))'
              : 'none',
            transition: 'transform 0.2s ease, filter 0.2s ease',
          }}
          alt=""
        />
      )}

      {/* Zoom overlay — tutup saat showComic aktif */}
      {zoomed && !showComic && (
        <div
          onClick={() => setZoomed(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.96)',
            zIndex: 9999,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
            cursor: 'zoom-out',
            gap: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#000',
              border: '3px solid #00ff41',
              borderRadius: 4,
              padding: '32px 40px',
              width: 640,
              position: 'relative',
              boxShadow: '0 0 60px rgba(0,255,65,0.25), inset 0 0 80px rgba(0,0,0,0.9)',
              fontFamily: '"Courier New", monospace',
              color: '#00ff41',
              cursor: 'default',
              overflow: 'hidden',
            }}
          >
            {/* Scanline overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)',
              pointerEvents: 'none', zIndex: 10,
            }} />

            {/* CRT vignette */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.6) 100%)',
              pointerEvents: 'none', zIndex: 11,
            }} />

            {/* Close button */}
            <button
              onClick={() => setZoomed(false)}
              style={{
                position: 'absolute', top: 10, right: 10,
                background: 'transparent',
                border: '1px solid rgba(0,255,65,0.3)',
                color: '#00ff41', fontSize: 11,
                width: 24, height: 24,
                borderRadius: 2, cursor: 'pointer',
                fontFamily: 'Courier New',
                zIndex: 12,
              }}
            >
              ✕
            </button>

            {/* Content */}
            {!insertedTapeId ? (
              <TapeInputUI
                char1Inventory={char1Inventory}
                onInsert={(tapeId) => {
                  removeFromChar1Inventory(tapeId);
                  setInsertedTapeId(tapeId);
                }}
              />
            ) : (
              <TapeDataUI
                tapeId={insertedTapeId}
                onEject={() => {
                  const tape = { id: insertedTapeId, name: TAPE_DATA[insertedTapeId]?.label ?? 'Tape', icon: '📼' };
                  addToChar1Inventory(tape as any);
                  setInsertedTapeId(null);
                }}
                onShowComic={() => {
                  setZoomed(false);   // tutup monitor dulu
                  setShowComic(true); // buka comic fullscreen
                }}
              />
            )}
          </div>
          
          <div style={{
            fontFamily: 'Courier New', fontSize: 9,
            color: 'rgba(0,255,65,0.25)', letterSpacing: 2,
          }}>
            KLIK DI LUAR UNTUK MENUTUP
          </div>
        </div>
      )}

      {/* ComicScene — SEJAJAR, bukan di dalam zoom div */}
      {showComic && insertedTapeId && TAPE_DATA[insertedTapeId]?.type === 'comic' && (
        <ComicScene
          src={TAPE_DATA[insertedTapeId].src ?? ''}
          panels={TAPE_DATA[insertedTapeId].panels ?? []}
          onDone={() => {
            setShowComic(false);
            setZoomed(true);   // kembali ke monitor setelah comic selesai
          }}
          isLastPage={true}
        />
      )}
    </>
  );
}

// ── Sub-komponen: belum ada tape ─────────────────────────────────────────────
function TapeInputUI({ char1Inventory, onInsert }: {
  char1Inventory: any[];
  onInsert: (tapeId: string) => void;
}) {
  const tapes = char1Inventory.filter(i => i.id in TAPE_DATA);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(0,255,65,0.3)', paddingBottom: 16 }}>
        <div style={{ fontSize: 10, letterSpacing: 4, opacity: 0.4, marginBottom: 8 }}>
          TAPE INPUT SYSTEM
        </div>
        <div style={{
          fontSize: 28, fontWeight: 700, letterSpacing: 6,
          textShadow: '0 0 20px rgba(0,255,65,0.5)',
          opacity: 0.5,
        }}>
          ── NO TAPE ──
        </div>
      </div>

      {/* Slot kosong */}
      <div style={{
        border: '2px dashed rgba(0,255,65,0.2)',
        borderRadius: 2, padding: '20px 24px',
        fontSize: 11, letterSpacing: 2, opacity: 0.5,
        textAlign: 'center',
      }}>
        {'> INSERT TAPE TO RETRIEVE DATA'}
      </div>

      {/* List tape */}
      <div>
        <div style={{ fontSize: 9, letterSpacing: 3, opacity: 0.35, marginBottom: 10 }}>
          TAPE TERSEDIA:
        </div>
        {tapes.length === 0 ? (
          <div style={{ opacity: 0.3, fontSize: 10, letterSpacing: 2 }}>
            {'> TIDAK ADA TAPE DI INVENTORY'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tapes.map(tape => (
              <button
                key={tape.id}
                onClick={() => onInsert(tape.id)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(0,255,65,0.35)',
                  borderRadius: 2,
                  color: '#00ff41',
                  fontFamily: 'Courier New',
                  fontSize: 14, letterSpacing: 3,
                  padding: '10px 16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(0,255,65,0.08)';
                  (e.currentTarget as HTMLElement).style.borderColor = '#00ff41';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 0 10px rgba(0,255,65,0.2)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,255,65,0.35)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                {'▶  '}{TAPE_DATA[tape.id]?.label ?? tape.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-komponen: tape sudah dimasukkan ──────────────────────────────────────
function TapeDataUI({ tapeId, onEject, onShowComic }: {
  tapeId: string;
  onEject: () => void;
  onShowComic?: () => void;
}) {
  const data = TAPE_DATA[tapeId];

  if (!data) return (
    <div style={{ opacity: 0.4, fontSize: 12, letterSpacing: 2 }}>
      {'> UNKNOWN TAPE FORMAT'}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Tape label */}
      <div style={{
        border: '2px solid #00ff41',
        padding: '14px 20px',
        textAlign: 'center',
        boxShadow: '0 0 30px rgba(0,255,65,0.15), inset 0 0 20px rgba(0,255,65,0.05)',
      }}>
        <div style={{
          fontSize: 52, fontWeight: 700, letterSpacing: 10,
          textShadow: '0 0 30px #00ff41, 0 0 60px rgba(0,255,65,0.4)',
          lineHeight: 1,
        }}>
          {data.label}
        </div>
      </div>

      {/* Kategori */}
      {data.category && (
        <div style={{
          border: '2px solid rgba(0,255,65,0.6)',
          padding: '10px 16px',
          fontSize: 20, letterSpacing: 4, fontWeight: 700,
          textShadow: '0 0 10px rgba(0,255,65,0.5)',
          background: 'rgba(0,255,65,0.04)',
        }}>
          {data.category}
        </div>
      )}

      {/* Isi data — cek tipenya */}
      {data.type === 'comic' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ opacity: 0.5, fontSize: 11, letterSpacing: 2 }}>
            {'> TAPE BERISI DATA VISUAL'}
          </div>
          <button
            onClick={onShowComic}
            style={{
              background: 'transparent',
              border: '2px solid #00ff41',
              color: '#00ff41',
              fontFamily: 'Courier New',
              fontSize: 13, letterSpacing: 3,
              padding: '12px 20px',
              cursor: 'pointer',
              borderRadius: 2,
              textShadow: '0 0 8px rgba(0,255,65,0.5)',
              boxShadow: '0 0 20px rgba(0,255,65,0.1)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(0,255,65,0.1)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px rgba(0,255,65,0.3)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(0,255,65,0.1)';
            }}
          >
            ▶ PUTAR DATA VISUAL
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 4 }}>
          {data.content?.map((row, i) => (
            <div key={i} style={{ fontSize: 18, letterSpacing: 1, lineHeight: 1.4 }}>
              {row.value ? (
                <>
                  <span style={{ opacity: 0.6 }}>{row.key}: </span>
                  <span style={{ fontWeight: 700, textShadow: '0 0 8px rgba(0,255,65,0.4)' }}>
                    {row.value}
                  </span>
                </>
              ) : (
                <span style={{
                  fontWeight: 700, fontSize: 16,
                  textShadow: '0 0 8px rgba(0,255,65,0.4)',
                  opacity: 0.9,
                }}>
                  {'> '}{row.key}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Eject */}
      <button
        onClick={onEject}
        style={{
          alignSelf: 'flex-start',
          background: 'transparent',
          border: '1px solid rgba(0,255,65,0.3)',
          color: '#00ff41', fontFamily: 'Courier New',
          fontSize: 10, letterSpacing: 3,
          padding: '7px 16px', cursor: 'pointer',
          marginTop: 4, borderRadius: 2,
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(0,255,65,0.08)';
          (e.currentTarget as HTMLElement).style.borderColor = '#00ff41';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = 'transparent';
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,255,65,0.3)';
        }}
      >
        ⏏ EJECT TAPE
      </button>
    </div>
  );
}

// ── Sub-komponen: Comic Panel ────────────────────────────────────────────────
function ComicPanel({ panels }: { panels: Array<{ image: string; delay: number }> }) {
  const [visibleIndex, setVisibleIndex] = useState(0);

  useEffect(() => {
    if (visibleIndex < panels.length - 1) {
      const timer = setTimeout(() => {
        setVisibleIndex(prev => prev + 1);
      }, panels[visibleIndex].delay);
      return () => clearTimeout(timer);
    }
  }, [visibleIndex, panels]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
      {panels.map((panel, i) => (
        <div
          key={i}
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 4,
            border: i <= visibleIndex ? '1px solid rgba(0,255,65,0.3)' : '1px solid rgba(0,255,65,0.1)',
          }}
        >
          <img
            src={panel.image}
            style={{
              width: '100%',
              display: 'block',
              opacity: i <= visibleIndex ? 1 : 0.2,
              transition: 'opacity 0.5s ease-in',
              filter: i <= visibleIndex ? 'brightness(1)' : 'brightness(0.4)',
            }}
            alt={`comic-panel-${i}`}
          />
          {i <= visibleIndex && (
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.03) 2px, rgba(0,255,65,0.03) 3px)',
              pointerEvents: 'none',
            }} />
          )}
        </div>
      ))}
    </div>
  );
}