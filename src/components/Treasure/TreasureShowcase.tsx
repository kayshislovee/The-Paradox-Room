import { useEffect, useState } from 'react';
import type { Treasure } from '../../types/game.types';
import { resolveTreasureImagePath } from '../../lib/treasureImage';

const GOLD = '#d4af37';
const GOLD_LIGHT = '#f5d77a';
const GOLD_DARK = '#8a6d1f';

interface Props {
  treasure: Treasure | null;
  onClose: () => void;
}

/** Nama cadangan kalau database belum punya nama treasure. */
function fallbackName(t: Treasure): string {
  const raw = t.id.replace(/^treasure_(lv\d+_)?/, '').replace(/[_-]+/g, ' ').trim();
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'Treasure';
}

/**
 * Showcase treasure — sama dengan tampilan saat membuka treasure di menu
 * Treasure, tapi dipakai saat treasure berhasil dikumpulkan di dalam game.
 * Klik di mana saja untuk menutup.
 */
export function TreasureShowcase({ treasure, onClose }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (treasure) {
      setVisible(false);
      const t = setTimeout(() => setVisible(true), 30);
      return () => clearTimeout(t);
    }
    setVisible(false);
    return undefined;
  }, [treasure]);

  if (!treasure) return null;

  const name = treasure.name?.trim() || fallbackName(treasure);
  const description =
    treasure.description?.trim() ||
    'Treasure yang berhasil dikumpulkan. Koleksi ini tersimpan di progresmu.';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100001,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        animation: 'showcaseFade 0.3s ease-out',
        opacity: visible ? 1 : 0,
        overflow: 'hidden',
      }}
    >
      {/* Wadah cahaya + gambar */}
      <div style={{ position: 'relative', width: 440, height: 440 }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 560,
            height: 560,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255,223,120,0.75) 0%, rgba(212,175,55,0.35) 35%, rgba(212,175,55,0) 70%)',
            animation: 'glowPulse 3s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 1000,
            height: 1000,
            background:
              'repeating-conic-gradient(from 0deg, rgba(245,215,122,0.35) 0deg 6deg, transparent 6deg 24deg)',
            WebkitMaskImage: 'radial-gradient(circle, #000 0%, transparent 62%)',
            maskImage: 'radial-gradient(circle, #000 0%, transparent 62%)',
            animation: 'raysSpin 40s linear infinite',
            pointerEvents: 'none',
          }}
        />
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: `${15 + ((i * 53) % 70)}%`,
              bottom: `${10 + ((i * 29) % 30)}%`,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: GOLD_LIGHT,
              boxShadow: `0 0 10px ${GOLD_LIGHT}`,
              opacity: 0,
              animation: `sparkle ${2.2 + (i % 4) * 0.5}s ease-out ${i * 0.25}s infinite`,
              pointerEvents: 'none',
            }}
          />
        ))}

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'treasurePop 0.6s cubic-bezier(0.2, 0.9, 0.3, 1.2) both',
          }}
        >
          <div
            style={{
              animation: 'floatTreasure 3.5s ease-in-out 0.6s infinite',
              filter:
                'drop-shadow(0 0 25px rgba(255,215,100,0.8)) drop-shadow(0 10px 20px rgba(0,0,0,0.8))',
            }}
          >
            <img
              src={resolveTreasureImagePath(treasure.image)}
              alt={name}
              style={{
                maxWidth: 'min(300px, 60vw)',
                maxHeight: 'min(300px, 40vh)',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>
        </div>
      </div>

      {/* Nama & deskripsi */}
      <div
        style={{
          textAlign: 'center',
          maxWidth: 520,
          padding: '0 24px',
          marginTop: 8,
          animation: 'textRise 0.6s ease-out 0.35s both',
        }}
      >
        <div
          style={{
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: 'uppercase',
            background: `linear-gradient(180deg, ${GOLD_LIGHT}, ${GOLD} 60%, ${GOLD_DARK})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 2px 12px rgba(212,175,55,0.5))',
          }}
        >
          {name}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            margin: '12px auto',
            width: 240,
          }}
        >
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
          <span style={{ color: GOLD, fontSize: 12 }}>◆</span>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(270deg, transparent, ${GOLD})` }} />
        </div>

        <div
          style={{
            color: '#cdbb92',
            fontSize: 15,
            lineHeight: 1.6,
            fontFamily: 'sans-serif',
          }}
        >
          {description}
        </div>

        <div
          style={{
            marginTop: 22,
            color: GOLD_DARK,
            fontSize: 11,
            letterSpacing: 2,
            fontFamily: 'sans-serif',
          }}
        >
          KLIK DI MANA SAJA UNTUK MENUTUP
        </div>
      </div>

      <style>{`
        @keyframes showcaseFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes treasurePop {
          0%   { opacity: 0; transform: scale(0.6); }
          60%  { opacity: 1; transform: scale(1.12); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes raysSpin { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.75; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.08); }
        }
        @keyframes floatTreasure { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes textRise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes sparkle {
          0%   { opacity: 0; transform: scale(0.3); }
          50%  { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0; transform: scale(0.3); }
        }
      `}</style>
    </div>
  );
}
