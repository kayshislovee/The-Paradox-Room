import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { LEVELS } from '../../data/levels';
import { useMusic } from '../../hooks/useMusic';
import { MetalButton } from '../UI/MetalButton';

interface Props {
  onStartLevel: (levelId: string) => void;
}

// Map level id ke background scene pertamanya
const LEVEL_BG: Record<string, string> = {
  level_1: '/backgrounds/lab_room.png',
  level_2: '/backgrounds/school_hallway.png',
  level_3: '/backgrounds/library.png',
  level_4: '/backgrounds/minimarket.png',
  level_5: '/backgrounds/toystore.png',
};

export function LevelSelect({ onStartLevel }: Props) {
  const goTo = useGameStore((s) => s.goTo);
  const levelProgress = useGameStore((s) => s.levelProgress);
  useMusic('/audio/menu_music.mp3');

  // Level yang sedang di-hover untuk preview kanan
  const [previewId, setPreviewId] = useState<string>(LEVELS[0]?.id ?? '');
  const [prevBg, setPrevBg] = useState<string>('');
  const [transitioning, setTransitioning] = useState(false);

  const handleHover = (levelId: string) => {
    if (levelId === previewId) return;
    // Fade out → ganti → fade in
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
      width: '100%', height: '100%',
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
        {/* Layer background sebelumnya (untuk crossfade) */}
        {prevBg && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${prevBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0,
          }} />
        )}

        {/* Background aktif */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${currentBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: transitioning ? 0 : 1,
          transition: 'opacity 0.18s ease',
        }} />

        {/* Gradient overlay kiri supaya blend ke panel kiri */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, #0d0d0d 0%, rgba(13,13,13,0.5) 30%, rgba(13,13,13,0.1) 100%)',
        }} />

        {/* Overlay gelap bawah */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)',
        }} />

        {/* Label nama level di pojok kanan bawah */}
        <div style={{
          position: 'absolute', bottom: 32, right: 32,
          textAlign: 'right',
          opacity: transitioning ? 0 : 1,
          transition: 'opacity 0.18s ease',
        }}>
          {LEVELS.filter(l => l.id === previewId).map(l => (
            <div key={l.id}>
              <div style={{
                color: 'rgba(200,184,154,0.5)', fontSize: 10,
                letterSpacing: 5, textTransform: 'uppercase', marginBottom: 4,
              }}>
                Level {LEVELS.indexOf(l) + 1}
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
            </div>
          ))}
        </div>

        {/* Garis dekoratif vertikal di sisi kiri panel kanan */}
        <div style={{
          position: 'absolute', left: 0, top: '10%', bottom: '10%',
          width: 1,
          background: 'linear-gradient(to bottom, transparent, rgba(200,184,154,0.3), transparent)',
        }} />
      </div>

      {/* ── PANEL KIRI — daftar level ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: 420,
        minWidth: 360,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '40px 40px 40px 48px',
        background: 'linear-gradient(to right, #0d0d0d 80%, transparent)',
        minHeight: '100%',
      }}>

        {/* Judul */}
        <div style={{ marginBottom: 36 }}>
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

        {/* Level cards */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 10,
          overflowY: 'auto', maxHeight: '55vh', paddingRight: 6,
        }}>
          {LEVELS.map((level, idx) => {
            const progress = levelProgress[level.id];
            const stars = progress?.stars ?? 0;
            const isActive = previewId === level.id;

            return (
              <LevelCard
                key={level.id}
                index={idx + 1}
                title={level.title}
                thumbnail={level.thumbnail}
                stars={stars}
                isActive={isActive}
                onClick={() => onStartLevel(level.id)}
                onHover={() => handleHover(level.id)}
              />
            );
          })}
        </div>

        {/* Back */}
        <div style={{ marginTop: 24 }}>
          <MetalButton
            onClick={(e) => { e.stopPropagation(); goTo('splash'); }}
            label="← Back"
            small
          />
        </div>
      </div>
    </div>
  );
}

// ── LevelCard ────────────────────────────────────────────────────────────────
function LevelCard({ index, title, thumbnail, stars, isActive, onClick, onHover }: {
  index: number;
  title: string;
  thumbnail: string;
  stars: number;
  isActive: boolean;
  onClick: () => void;
  onHover: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const active = hovered || isActive;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => { setHovered(true); onHover(); }}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', width: '100%',
        padding: '14px 18px',
        background: active
          ? 'linear-gradient(180deg, #5a5a5a 0%, #2a2a2a 40%, #1a1a1a 60%, #3a3a3a 100%)'
          : 'linear-gradient(180deg, #3a3a3a 0%, #181818 40%, #0e0e0e 60%, #242424 100%)',
        border: 'none', borderRadius: 4, cursor: 'pointer',
        transition: 'all 0.18s',
        transform: active ? 'translateX(6px)' : 'translateX(0)',
        boxShadow: active
          ? 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 20px rgba(0,0,0,0.6), 4px 0 0 #c8b89a'
          : 'inset 0 1px 0 rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
      }}
    >
      {/* Border dekoratif */}
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

      {/* Garis accent kiri saat aktif */}
      <div style={{
        position: 'absolute', left: 0, top: '15%', bottom: '15%',
        width: 2, borderRadius: 2,
        background: active ? '#c8b89a' : 'transparent',
        transition: 'background 0.18s',
        pointerEvents: 'none',
      }} />

      <div style={{ fontSize: 30, minWidth: 40 }}>{thumbnail}</div>

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
          color: active ? '#e8d5b7' : '#9a8a7a',
          fontSize: 15, fontWeight: 700, letterSpacing: 2,
          textTransform: 'uppercase',
          transition: 'color 0.18s',
          fontFamily: "'Georgia', serif",
        }}>
          {title}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3].map((n) => (
          <span key={n} style={{
            fontSize: 13,
            color: n <= stars ? '#c8a84a' : '#2a2a2a',
            textShadow: n <= stars ? '0 0 8px rgba(200,168,74,0.6)' : 'none',
            transition: 'color 0.18s',
          }}>★</span>
        ))}
      </div>
    </button>
  );
}