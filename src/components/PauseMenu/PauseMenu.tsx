import { useState, useRef, useEffect } from 'react';
import { useGameStore, useSettingsStore } from '../../store/gameStore';
import { MetalButton } from '../UI/MetalButton';
import { multiplayer } from '../../lib/multiplayer';

export function PauseMenu() {
  const [isPaused, setIsPaused] = useState(false);
  const [animState, setAnimState] = useState<'hidden' | 'entering' | 'visible' | 'leaving'>('hidden');
  const localPauseRef = useRef(false);
  const { goTo, pauseTimer, resumeTimer } = useGameStore();
  const remotePaused = useGameStore((s) => s.remotePaused);
  const remotePausedBy = useGameStore((s) => s.remotePausedBy);
  const { musicVolume, musicMuted, setMusicVolume, toggleMusicMuted } = useSettingsStore();
  const lobbyCode = useGameStore((s) => s.lobbyCode);
  const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

  const handleExitLobby = async () => {
    const code = useGameStore.getState().lobbyCode; // ← ambil langsung dari state
    const currentToken = useGameStore.getState().token;

    if (!code || !currentToken) {
      // Tidak ada lobby, langsung ke menu
      setIsPaused(false);
      resumeTimer();
      goTo('splash');
      return;
    }

    await fetch(`${API_BASE}/lobby/${code}/exit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`,
      },
    });

    useGameStore.getState().setLobbyCode(null);
    setIsPaused(false);
    resumeTimer();
    goTo('splash');
  };

  const handlePause = () => {
    localPauseRef.current = true;
    setIsPaused(true);
    setAnimState('entering');
    pauseTimer();
    // Sinkronkan ke player lain (multiplayer level 7).
    if (lobbyCode) {
      multiplayer.syncAction('timer_paused', { paused: true });
    }
    setTimeout(() => setAnimState('visible'), 10);
  };

  const handleResume = () => {
    setAnimState('leaving');
    setTimeout(() => {
      localPauseRef.current = false;
      setIsPaused(false);
      setAnimState('hidden');
      resumeTimer();
      if (lobbyCode) {
        multiplayer.syncAction('timer_paused', { paused: false });
      }
    }, 400);
  };

  // Player lain pause → tampilkan pause screen juga (read-only, tunggu resume).
  useEffect(() => {
    if (remotePaused) {
      setIsPaused(true);
      setAnimState('visible');
      pauseTimer();
    } else if (!localPauseRef.current && isPaused) {
      // remote resume → tutup modal (hanya jika bukan pauser sendiri)
      setIsPaused(false);
      setAnimState('hidden');
      resumeTimer();
    }
  }, [remotePaused]);

  return (
    <>
      {/* Tombol pause di HUD */}
      <button
        onClick={handlePause}
        style={{
          padding: '4px 12px',
          background: 'transparent',
          border: '1px solid rgba(200,184,154,0.2)',
          borderRadius: 4,
          color: 'rgba(200,184,154,0.6)',
          fontSize: '0.8rem',
          fontFamily: "'Georgia', serif",
          letterSpacing: 2,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(200,184,154,0.5)';
          e.currentTarget.style.color = '#c8b89a';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(200,184,154,0.2)';
          e.currentTarget.style.color = 'rgba(200,184,154,0.6)';
        }}
      >
        ⏸ PAUSE
      </button>

      {(isPaused || remotePaused) && (
        <>
          {/* Overlay */}
          <div style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.6)',
            zIndex: 99998,
          }} />

          {/* Card */}
          <div style={{
            position: 'fixed',
            top: '50%', left: '50%',
            transform: animState === 'visible'
              ? 'translate(-50%, calc(-50% + 340px)) scale(1)'
              : 'translate(-50%, calc(-50% - 140px)) scale(0.95)',
            opacity: animState === 'visible' ? 1 : 0,
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 99999,
            background: 'linear-gradient(160deg, #26252d, #212024)',
            border: '1px solid rgba(200,184,154,0.96)',
            borderRadius: 16,
            padding: '36px 32px',
            width: 320,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
          }}>

            {/* Judul */}
            <div style={{ textAlign: 'center', marginBottom: 28, width: '100%' }}>
              <div style={{
                color: '#e8d5b7', fontSize: 36, fontWeight: 700,
                letterSpacing: 8, textTransform: 'uppercase',
                fontFamily: "'Georgia', serif",
                textShadow: '0 4px 20px rgba(0,0,0,0.9)',
              }}>
                PAUSED
              </div>
              {remotePaused && (
                <div style={{ color: '#fbbf24', fontSize: 11, fontFamily: 'monospace', marginBottom: 12, textAlign: 'center' }}>
                  {remotePausedBy} menjeda game. Menunggu resume...
                </div>
              )}
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 12, marginTop: 10,
              }}>
                <div style={{ width: 50, height: 1, background: '#c8b89a', opacity: 0.3 }} />
                <div style={{
                  width: 6, height: 6,
                  border: '1px solid #c8b89a',
                  transform: 'rotate(45deg)', opacity: 0.5,
                }} />
                <div style={{ width: 50, height: 1, background: '#c8b89a', opacity: 0.3 }} />
              </div>
            </div>

            {/* Settings */}
            <div style={{
              width: '100%',
              borderTop: '1px solid rgba(200,184,154,0.1)',
              padding: '16px 0',
              marginBottom: 8,
            }}>
              {/* Music toggle switch */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 12,
              }}>
                <span style={{
                  color: '#8a7a6a', fontSize: 10,
                  letterSpacing: 3, textTransform: 'uppercase',
                  fontFamily: "'Georgia', serif",
                }}>
                  🎵 Music
                </span>

                {/* Toggle switch */}
                <div
                  onClick={toggleMusicMuted}
                  style={{
                    width: 44, height: 24,
                    borderRadius: 12,
                    background: musicMuted
                      ? 'rgba(239,68,68,0.2)'
                      : 'rgba(16,185,129,0.2)',
                    border: `1px solid ${musicMuted
                      ? 'rgba(239,68,68,0.5)'
                      : 'rgba(16,185,129,0.5)'}`,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    boxShadow: musicMuted
                      ? '0 0 8px rgba(239,68,68,0.2)'
                      : '0 0 8px rgba(16,185,129,0.2)',
                    flexShrink: 0,
                  }}
                >
                  {/* Knob */}
                  <div style={{
                    position: 'absolute',
                    top: 3,
                    left: musicMuted ? 3 : 21,
                    width: 16, height: 16,
                    borderRadius: '50%',
                    background: musicMuted
                      ? 'radial-gradient(circle at 35% 35%, #f87171, #ef4444)'
                      : 'radial-gradient(circle at 35% 35%, #34d399, #10b981)',
                    boxShadow: musicMuted
                      ? '0 0 6px rgba(239,68,68,0.6)'
                      : '0 0 6px rgba(16,185,129,0.6)',
                    transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s',
                  }} />

                  {/* Label dalam toggle */}
                  <span style={{
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    left: musicMuted ? 22 : 5,
                    fontSize: 7, fontWeight: 800,
                    color: musicMuted ? '#f87171' : '#34d399',
                    fontFamily: 'monospace',
                    letterSpacing: 0.5,
                    transition: 'all 0.3s',
                    userSelect: 'none',
                  }}>
                    {musicMuted ? 'OFF' : 'ON'}
                  </span>
                </div>
              </div>

              {/* Volume slider */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 8,
              }}>
                <span style={{
                  color: '#8a7a6a', fontSize: 10,
                  letterSpacing: 3, textTransform: 'uppercase',
                  fontFamily: "'Georgia', serif",
                }}>
                  🔊 Volume
                </span>
                <span style={{
                  color: '#c8b89a', fontSize: 10,
                  fontFamily: 'monospace',
                }}>
                  {Math.round(musicVolume * 100)}%
                </span>
              </div>
              <input
                type="range" min={0} max={1} step={0.05}
                value={musicVolume}
                onChange={(e) => setMusicVolume(Number(e.target.value))}
                style={{
                  width: '100%', appearance: 'none', height: 2,
                  background: `linear-gradient(to right, #c8b89a ${musicVolume * 100}%, #333 ${musicVolume * 100}%)`,
                  borderRadius: 2, outline: 'none', cursor: 'pointer',
                }}
              />
            </div>

            {/* Tombol */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
              {!remotePaused && (
                <MetalButton
                  onClick={(e) => { e.stopPropagation(); handleResume(); }}
                  label="LANJUTKAN"
                />
              )}
              {remotePaused && (
                <div style={{
                  padding: '10px 0', textAlign: 'center',
                  color: '#fbbf24', fontSize: 11, fontFamily: 'monospace',
                  border: '1px solid rgba(251,191,36,0.3)', borderRadius: 6,
                }}>
                  Menunggu {remotePausedBy} melanjutkan...
                </div>
              )}
              <MetalButton
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused(false);
                  resumeTimer();
                  const { currentLevelId, startLevel } = useGameStore.getState();
                  if (currentLevelId) startLevel(currentLevelId);
                }}
                label="RESTART"
                small
              />
              <MetalButton
                onClick={(e) => { e.stopPropagation(); setIsPaused(false); resumeTimer(); goTo('level_select'); }}
                label="PILIH LEVEL"
                small
              />
              <MetalButton
                onClick={(e) => { e.stopPropagation(); setIsPaused(false); resumeTimer(); goTo('splash'); }}
                label="MENU UTAMA"
                small
              />
              {lobbyCode && (
                <MetalButton
                  onClick={(e) => { e.stopPropagation(); handleExitLobby(); }}
                  label="KELUAR LOBBY"
                  small
                />
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}