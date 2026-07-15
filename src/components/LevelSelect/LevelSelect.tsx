import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { LEVELS } from '../../data/levels';
import { useMusic } from '../../hooks/useMusic';
import { MetalButton } from '../UI/MetalButton';

interface Props {
  onStartLevel: (levelId: string) => void;
}

export function LevelSelect({ onStartLevel }: Props) {
  const goTo = useGameStore((s) => s.goTo);
  const levelProgress = useGameStore((s) => s.levelProgress);
  useMusic('/audio/menu_music.mp3');

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'url(/backgrounds/splash_bg.png) center/cover no-repeat',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Georgia', serif",
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.55)', zIndex: 0,
      }} />

      <div style={{ zIndex: 1, width: 420, display: 'flex', flexDirection: 'column' }}>

        {/* Judul */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            color: '#c8b89a', fontSize: 13, letterSpacing: 6,
            textTransform: 'uppercase', marginBottom: 8, opacity: 0.7,
          }}>
            Select
          </div>
          <div style={{
            color: '#e8d5b7', fontSize: 42, fontWeight: 700,
            letterSpacing: 6, textTransform: 'uppercase',
            textShadow: '0 4px 20px rgba(0,0,0,0.9)',
          }}>
            Map
          </div>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 12, marginTop: 12,
          }}>
            <div style={{ width: 60, height: 1, background: '#c8b89a', opacity: 0.4 }} />
            <div style={{
              width: 7, height: 7,
              border: '1.5px solid #c8b89a',
              transform: 'rotate(45deg)', opacity: 0.6,
            }} />
            <div style={{ width: 60, height: 1, background: '#c8b89a', opacity: 0.4 }} />
          </div>
        </div>

        {/* Level cards */}
        <div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  overflowY: 'auto',        // ← tambahkan ini
  maxHeight: '60vh',        // ← tambahkan ini
  paddingRight: 8,          // ← biar scrollbar tidak nutup konten
}}>
          {LEVELS.map((level, idx) => {
            const progress = levelProgress[level.id];
            const stars = progress?.stars ?? 0;
            return (
              <LevelCard
                key={level.id}
                index={idx + 1}
                title={level.title}
                description={level.description}
                thumbnail={level.thumbnail}
                stars={stars}
                onClick={() => onStartLevel(level.id)}
              />
            );
          })}
        </div>

        {/* Back */}
        <div style={{ marginTop: 20 }}>
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

function LevelCard({ index, title, description, thumbnail, stars, onClick }: {
  index: number; title: string; description: string;
  thumbnail: string; stars: number; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', width: '100%',
        padding: '16px 20px',
        background: hovered
          ? 'linear-gradient(180deg, #5a5a5a 0%, #2a2a2a 40%, #1a1a1a 60%, #3a3a3a 100%)'
          : 'linear-gradient(180deg, #4a4a4a 0%, #1e1e1e 40%, #111111 60%, #2e2e2e 100%)',
        border: 'none', borderRadius: 4, cursor: 'pointer',
        transition: 'all 0.2s',
        transform: hovered ? 'scale(1.02)' : 'scale(1)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 12px rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left',
      }}
    >
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 4,
        border: `1px solid ${hovered ? '#666' : '#444'}`,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 3, borderRadius: 2,
        border: `1px solid ${hovered ? '#555' : '#333'}`,
        pointerEvents: 'none',
      }} />

      <div style={{ fontSize: 36, minWidth: 48 }}>{thumbnail}</div>

      <div style={{ flex: 1 }}>
        <div style={{
          color: '#8a7a6a', fontSize: 10,
          letterSpacing: 4, textTransform: 'uppercase', marginBottom: 2,
          fontFamily: "'Georgia', serif",
        }}>
          LEVEL {index}
        </div>
        <div style={{
          color: hovered ? '#e8d5b7' : '#c8b89a',
          fontSize: 16, fontWeight: 700, letterSpacing: 2,
          textTransform: 'uppercase', transition: 'color 0.2s',
          fontFamily: "'Georgia', serif",
        }}>
          {title}
        </div>
        <div style={{
          color: '#6a5a4a', fontSize: 11, marginTop: 2,
          fontFamily: 'sans-serif',
        }}>
          {description}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3].map((n) => (
          <span key={n} style={{
            fontSize: 16,
            color: n <= stars ? '#c8a84a' : '#3a3a3a',
            textShadow: n <= stars ? '0 0 8px rgba(200,168,74,0.6)' : 'none',
          }}>★</span>
        ))}
      </div>
    </button>
  );
}