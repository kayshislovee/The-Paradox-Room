import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { looksLikeImagePath, resolveAssetPath } from '../../lib/assetPath';

export function AchievementPopup() {
  const newAchievement = useGameStore((s) => s.newAchievement);
  const clearNewAchievement = useGameStore((s) => s.clearNewAchievement);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (newAchievement) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [newAchievement]);

  if (!newAchievement) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 70, right: 20,
      zIndex: 99999,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateX(0)' : 'translateX(120%)',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      pointerEvents: 'none',
    }}>
      <div style={{
        background: newAchievement.isGolden
          ? 'linear-gradient(135deg, #1a1200, #2a1f00)'
          : 'linear-gradient(135deg, #0f0c20, #1a1530)',
        border: `1px solid ${newAchievement.isGolden
          ? 'rgba(251,191,36,0.6)'
          : 'rgba(200,184,154,0.3)'}`,
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        minWidth: 280,
        boxShadow: newAchievement.isGolden
          ? '0 0 30px rgba(251,191,36,0.3), 0 8px 24px rgba(0,0,0,0.6)'
          : '0 8px 24px rgba(0,0,0,0.6)',
      }}>
        {/* Icon */}
        <div style={{ fontSize: 36, flexShrink: 0 }}>
          {looksLikeImagePath(newAchievement.icon) ? (
            <img src={resolveAssetPath(newAchievement.icon)} style={{ width: 48, height: 48, objectFit: 'contain' }} />
          ) : (
            newAchievement.icon
          )}
        </div>

        {/* Teks */}
        <div>
          <div style={{
            color: '#8a7a6a', fontSize: 9,
            letterSpacing: 3, textTransform: 'uppercase',
            marginBottom: 4, fontFamily: "'Georgia', serif",
          }}>
            🏆 Achievement Unlocked!
          </div>
          <div style={{
            color: newAchievement.isGolden ? '#fbbf24' : '#e8d5b7',
            fontSize: 15, fontWeight: 700,
            fontFamily: "'Georgia', serif",
            letterSpacing: 1,
            textShadow: newAchievement.isGolden
              ? '0 0 10px rgba(251,191,36,0.5)'
              : 'none',
          }}>
            {newAchievement.title}
          </div>
          <div style={{
            color: '#8a7a6a', fontSize: 11,
            fontFamily: 'sans-serif', marginTop: 2,
          }}>
            {newAchievement.description}
          </div>
        </div>

        {/* Tutup */}
        <button
          onClick={clearNewAchievement}
          style={{
            background: 'none', border: 'none',
            color: '#4a4a4a', cursor: 'pointer',
            fontSize: 16, padding: 0,
            pointerEvents: 'all',
            marginLeft: 'auto', flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}