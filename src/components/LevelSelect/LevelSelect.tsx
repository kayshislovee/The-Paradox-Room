import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useMusic } from '../../hooks/useMusic';
import { MetalButton } from '../UI/MetalButton';

interface Props {
  onStartLevel: (levelId: string) => void;
}

const LEVEL_BG: Record<string, string> = {
  level_1: '/backgrounds/lab_room.png',
  level_2: '/backgrounds/school_hallway.png',
  level_3: '/backgrounds/library.png',
  level_4: '/backgrounds/minimarket.png',
  level_5: '/backgrounds/toystore.png',
  level_6: '/backgrounds/elements.png',
  level_7: '/backgrounds/scene5.png',
};

export function LevelSelect({ onStartLevel }: Props) {
  const goTo          = useGameStore((s) => s.goTo);
  const levelProgress = useGameStore((s) => s.levelProgress);
  const loadLevels    = useGameStore((s) => s.loadLevels);
  const levels        = useGameStore((s) => s.levels); // ← dari store/API
  useMusic('/audio/menu_music.mp3');

  useEffect(() => {
    loadLevels();
  }, [loadLevels]);

  const [previewId, setPreviewId]     = useState<string>(levels[0]?.id ?? '');
  const [prevBg, setPrevBg]           = useState<string>('');
  const [transitioning, setTransitioning] = useState(false);
  const [mpOnlyOpen, setMpOnlyOpen]   = useState(false);

  const handleHover = (levelId: string) => {
    if (levelId === previewId) return;
    setTransitioning(true);
    setTimeout(() => {
      setPrevBg(LEVEL_BG[previewId] ?? '');
      setPreviewId(levelId);
      setTransitioning(false);
    }, 180);
  };

  const currentBg = LEVEL_BG[previewId] ?? '';

  return (
    <div style={{
      width: '100%', height: '100%',left:"2%",
      background: '#0d0d0d',
      display: 'flex',
      fontFamily: "'Georgia', serif",
      position: 'relative', overflow: 'hidden',
    }}>

      {/* ── PANEL KANAN — preview background ── */}
      <div style={{
        position: 'absolute',
        right: 0, top: 0, bottom: 0,
        width: '58%',
        overflow: 'hidden',
      }}>
        {prevBg && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${prevBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0,
          }} />
        )}

        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${currentBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: transitioning ? 0 : 1,
          transition: 'opacity 0.18s ease',
        }} />

        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, #0d0d0d 0%, rgba(13,13,13,0.5) 30%, rgba(13,13,13,0.1) 100%)',
        }} />

        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)',
        }} />

        <div style={{
          position: 'absolute', bottom: 32, right: 32,
          textAlign: 'right',
          opacity: transitioning ? 0 : 1,
          transition: 'opacity 0.18s ease',
        }}>
          {levels.filter(l => l.id === previewId).map(l => (
            <div key={l.id}>
              <div style={{
                color: 'rgba(200,184,154,0.5)', fontSize: 10,
                letterSpacing: 5, textTransform: 'uppercase', marginBottom: 4,
              }}>
                Level {levels.indexOf(l) + 1}
              </div>
              <div style={{
                color: '#e8d5b7', fontSize: 28, fontWeight: 700,
                letterSpacing: 3, textTransform: 'uppercase',
                textShadow: '0 2px 20px rgba(0,0,0,0.9)',
              }}>
                {l.title}
              </div>
              <div style={{
                color: 'rgba(200,184,154,0.6)', fontSize: 12,
                marginTop: 6, fontFamily: 'sans-serif', maxWidth: 400,
              }}>
                {l.description}
              </div>
              {l.isLocked && (
                <div style={{
                  color: '#ff6b6b', fontSize: 11, marginTop: 8,
                  letterSpacing: 3, textTransform: 'uppercase',
                }}>
                  🔒 Level Terkunci
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{
          position: 'absolute', left: 0, top: '10%', bottom: '10%',
          width: 1,
          background: 'linear-gradient(to bottom, transparent, rgba(200,184,154,0.3), transparent)',
        }} />
      </div>

      {/* ── PANEL KIRI — daftar level ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: 430, minWidth: 390,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
        padding: '24px 32px',
        background: 'linear-gradient(to right, #0d0d0d 80%, transparent)',
        minHeight: '100%',
        overflow: 'hidden',
      }}>

        <div style={{ marginBottom: 16, flexShrink: 0 }}>
          <div style={{
            color: '#c8b89a', fontSize: 11, letterSpacing: 6,
            textTransform: 'uppercase', marginBottom: 6, opacity: 0.6,
          }}>
            Select
          </div>
          <div style={{
            color: '#e8d5b7', fontSize: 38, fontWeight: 700,
            letterSpacing: 6, textTransform: 'uppercase',
            textShadow: '0 4px 20px rgba(0,0,0,0.9)',
          }}>
            Map
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <div style={{ width: 60, height: 1, background: '#c8b89a', opacity: 0.4 }} />
            <div style={{ width: 7, height: 7, border: '1.5px solid #c8b89a', transform: 'rotate(45deg)', opacity: 0.6 }} />
            <div style={{ width: 60, height: 1, background: '#c8b89a', opacity: 0.4 }} />
          </div>
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column', gap: 8,
          overflow: 'hidden',
          padding: '6px 10px 6px 6  px',
          flexShrink: 0,
        }}>
          {levels.map((level, idx) => {
            const progress = levelProgress[level.id];
            const stars    = progress?.stars ?? 0;
          const isActive = previewId === level.id;

        const isLocked = level.isLocked ?? false;


            return (
              <LevelCard
                key={level.id}
                index={idx + 1}
                title={level.title}
                thumbnail={level.thumbnail}
                stars={stars}
                isActive={isActive}
                 isLocked={isLocked}
                 isMultiplayerOnly={level.id === 'level_7'}
    onClick={() => {
  if (isLocked) {
    alert('Selesaikan semua level 1-5 terlebih dahulu!');
    return;
  }
  onStartLevel(level.id);
}}
                onHover={() => handleHover(level.id)}
              />
            );
          })}
        </div>

        <div style={{ marginTop: 16, flexShrink: 0 }}>
          <MetalButton
            onClick={(e) => { e.stopPropagation(); goTo('splash'); }}
             
          >
            ← Back
          </MetalButton>
        </div>
      </div>

      {/* Modal: Level 7 hanya multiplayer */}
      {mpOnlyOpen && (
        <div
          onClick={() => setMpOnlyOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(180deg, #2a2a2a 0%, #181818 40%, #0e0e0e 60%, #242424 100%)',
              border: '1px solid #444',
              borderRadius: 8,
              padding: '32px 40px',
              maxWidth: 420, width: '90%',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.9)',
              fontFamily: "'Georgia', serif",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
            <div style={{
              color: '#e8d5b7', fontSize: 18, fontWeight: 700,
              letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase',
              textShadow: '0 4px 20px rgba(0,0,0,0.9)',
            }}>
              Mode Multiplayer
            </div>
            <div style={{ color: '#c8b89a', fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
              Level 7 (Broken Paradox) hanya bisa dimainkan di mode Multiplayer.
              <br />
              Pilih <b>MULTIPLAYER</b> dari menu utama untuk memainkannya.
            </div>
            <button
              onClick={() => setMpOnlyOpen(false)}
              style={{
                padding: '10px 28px',
                background: 'linear-gradient(180deg, #3a3a3a 0%, #181818 40%, #0e0e0e 60%, #242424 100%)',
                border: '1px solid #c8b89a',
                borderRadius: 4,
                color: '#e8d5b7',
                fontSize: 12, fontWeight: 700,
                letterSpacing: 2, textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: "'Georgia', serif",
              }}
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── LevelCard ────────────────────────────────────────────────────────────────
function LevelCard({ index, title, thumbnail, stars, isActive, isLocked, isMultiplayerOnly, onClick, onHover }: {
  index: number;
  title: string;
  thumbnail: string;
  stars: number;
  isActive: boolean;
  isLocked: boolean;
  isMultiplayerOnly?: boolean;
  onClick: () => void;
  onHover: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const active = (hovered || isActive) && !isLocked;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => { setHovered(true); onHover(); }}
      onMouseLeave={() => setHovered(false)}
      disabled={isLocked}
      style={{
        position: 'relative', width: '100%',
        padding: '14px 18px',
        background: isLocked
          ? 'linear-gradient(180deg, #1a1a1a 0%, #0e0e0e 100%)'
          : active
            ? 'linear-gradient(180deg, #5a5a5a 0%, #2a2a2a 40%, #1a1a1a 60%, #3a3a3a 100%)'
            : 'linear-gradient(180deg, #3a3a3a 0%, #181818 40%, #0e0e0e 60%, #242424 100%)',
        border: 'none', borderRadius: 4,
        cursor: isLocked ? 'not-allowed' : 'pointer',
        transition: 'all 0.18s',
        transform: active ? 'translateX(6px)' : 'translateX(0)',
        boxShadow: active
          ? 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 20px rgba(0,0,0,0.6), 4px 0 0 #c8b89a'
          : 'inset 0 1px 0 rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
        opacity: isLocked ? 0.45 : 1,
      }}
    >
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 4,
        border: `1px solid ${active ? '#777' : '#333'}`,
        transition: 'border-color 0.18s',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 3, borderRadius: 2,
        border: `1px solid ${active ? '#555' : '#222'}`,
        transition: 'border-color 0.18s',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute', left: 0, top: '15%', bottom: '15%',
        width: 2, borderRadius: 2,
        background: active ? '#c8b89a' : 'transparent',
        transition: 'background 0.18s',
        pointerEvents: 'none',
      }} />

      {/* Ikon kunci kalau locked, thumbnail kalau tidak */}
      <div style={{ fontSize: 30, minWidth: 40 }}>
        {isLocked ? '🔒' : isMultiplayerOnly ? '👥' : thumbnail}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{
          color: active ? 'rgba(200,184,154,0.7)' : '#5a4a3a',
          fontSize: 9, letterSpacing: 4,
          textTransform: 'uppercase', marginBottom: 2,
          fontFamily: "'Georgia', serif",
          transition: 'color 0.18s',
        }}>
          LEVEL {index}
        </div>
        <div style={{
          color: isLocked ? '#4a4a4a' : active ? '#e8d5b7' : '#9a8a7a',
          fontSize: 15, fontWeight: 700, letterSpacing: 2,
          textTransform: 'uppercase',
          transition: 'color 0.18s',
          fontFamily: "'Georgia', serif",
        }}>
          {title}
        </div>
        {isLocked && (
          <div style={{ color: '#ff6b6b', fontSize: 9, letterSpacing: 2, marginTop: 2 }}>
            TERKUNCI
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3].map((n) => (
          <span key={n} style={{
            fontSize: 13,
            color: isLocked ? '#2a2a2a' : n <= stars ? '#c8a84a' : '#2a2a2a',
            textShadow: n <= stars && !isLocked ? '0 0 8px rgba(200,168,74,0.6)' : 'none',
            transition: 'color 0.18s',
          }}>★</span>
        ))}
      </div>
    </button>
  );
}