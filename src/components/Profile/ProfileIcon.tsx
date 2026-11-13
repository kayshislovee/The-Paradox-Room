import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { ProfileModal } from './ProfileModal';
import { fetchProfile } from '../../hooks/useapi';

export function ProfileIcon() {
  const player  = useGameStore((s) => s.player);
  const isGuest = useGameStore((s) => s.isGuest);
  const [open, setOpen] = useState(false);
  const token = useGameStore((s) => s.token);
const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
useEffect(() => {
  if (!token || isGuest) return;
  fetchProfile(token).then((p) => setAvatarUrl(p.avatar)).catch(() => {});
}, [token]);
  if (!player && !isGuest) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={player?.username ?? 'Guest'}
        style={{
          position: 'fixed',
          top: 16, left: 33,
          zIndex: 100,
          width: 44, height: 44,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1a1530, #2a2040)',
          border: '2px solid rgba(200,184,154,0.3)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          transition: 'border-color 0.2s, transform 0.2s',
          padding: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(200,184,154,0.7)';
          e.currentTarget.style.transform = 'scale(1.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(200,184,154,0.3)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
       {isGuest ? (
  <span style={{ fontSize: 20 }}></span>
) : avatarUrl ? (
  <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
) : (
  <span style={{ color: '#e8d5b7', fontSize: 16, fontWeight: 700, fontFamily: "'Georgia', serif" }}>
    {player?.username?.charAt(0).toUpperCase()}
  </span>
)}
      </button>

      {/* Tooltip nama */}
      <div style={{
        position: 'fixed',
        top: 64, left: 55,
        transform: 'translateX(-50%)',
textAlign: 'center',
        background: 'rgba(15,12,32,0.9)',
        border: '1px solid rgba(200,184,154,0.15)',
        borderRadius: 6, padding: '4px 10px',
        color: '#c8b89a', fontSize: 11,
        letterSpacing: 2, fontFamily: "'Georgia', serif",
        pointerEvents: 'none',
        zIndex: 99,
      }}>
        {isGuest ? 'GUEST' : player?.username?.toUpperCase()}
      </div>

      {open && <ProfileModal onClose={() => setOpen(false)} />}
    </>
  );
}