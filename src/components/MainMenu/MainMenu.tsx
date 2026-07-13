import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useMusic } from '../../hooks/useMusic';

export function MainMenu() {
  const goTo = useGameStore((s) => s.goTo);
  useMusic('/audio/music.mp3');
  

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'url(/backgrounds/menu_bg.png) center/cover no-repeat',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Georgia', serif",
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Overlay gelap */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.35)',
        zIndex: 0,
      }} />

      {/* Judul — UBAH TEKS DI SINI */}
      <div style={{
        zIndex: 1,
        textAlign: 'center',
        marginBottom: 64,
        userSelect: 'none',
      }}>
        <p style={{
          color: '#a0a0a0',
          fontSize: 18,
          letterSpacing: 12,
          margin: '0 0 4px',
          fontWeight: 400,
          textTransform: 'uppercase',
          textShadow: '0 2px 8px rgba(0,0,0,0.8)',
        }}>
          THE {/* ← ubah ini */}
        </p>
        <h1 style={{
          color: '#c8c8c8',
          fontSize: 72,
          fontWeight: 700,
          letterSpacing: 10,
          margin: '0 0 4px',
          textTransform: 'uppercase',
          textShadow: '0 0 40px rgba(0,0,0,0.9), 2px 2px 0px rgba(0,0,0,0.5)',
          lineHeight: 1,
        }}>
          COGNITIVE {/* ← ubah ini */}
        </h1>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 12, margin: '8px 0',
        }}>
          <div style={{ height: 1, width: 60, background: '#666' }} />
          <p style={{
            color: '#888',
            fontSize: 14,
            letterSpacing: 8,
            margin: 0,
            textTransform: 'uppercase',
          }}>
            CHAMBER {/* ← ubah ini */}
          </p>
          <div style={{ height: 1, width: 60, background: '#666' }} />
        </div>
      </div>

      {/* Tombol */}
      <div style={{
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        width: 320,
      }}>
        <MetalButton onClick={() => goTo('level_select')} label="START" />
        <MetalButton onClick={() => goTo('settings')} label="OPTIONS" />
        <MetalButton onClick={() => window.close()} label="QUIT" />
      </div>
    </div>
  );
}

function MetalButton({ onClick, label }: { onClick: () => void; label: string }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: '100%',
        padding: '18px 0',
        background: hovered
          ? 'linear-gradient(180deg, #5a5a5a 0%, #2a2a2a 40%, #1a1a1a 60%, #3a3a3a 100%)'
          : 'linear-gradient(180deg, #4a4a4a 0%, #1e1e1e 40%, #111111 60%, #2e2e2e 100%)',
        border: 'none',
        borderRadius: 4,
        cursor: 'pointer',
        transition: 'all 0.2s',
        transform: hovered ? 'scale(1.02)' : 'scale(1)',
        boxShadow: hovered
          ? '0 0 20px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.5)'
          : 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{
        position: 'absolute', left: 20, top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <div style={{ width: 20, height: 1, background: '#666' }} />
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#555' }} />
      </div>
      <div style={{
        position: 'absolute', right: 20, top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex', alignItems: 'center', gap: 6, flexDirection: 'row-reverse',
      }}>
        <div style={{ width: 20, height: 1, background: '#666' }} />
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#555' }} />
      </div>

      <span style={{
        color: hovered ? '#ffffff' : '#cccccc',
        fontSize: 15,
        fontWeight: 600,
        letterSpacing: 6,
        textTransform: 'uppercase',
        fontFamily: "'Georgia', serif",
        textShadow: hovered ? '0 0 12px rgba(255,255,255,0.3)' : 'none',
        transition: 'all 0.2s',
      }}>
        {label}
      </span>

      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: 4,
        border: '1px solid',
        borderColor: hovered ? '#666' : '#444',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: hovered ? '#555' : '#333',
        pointerEvents: 'none',
      }} />
    </button>
  );
}