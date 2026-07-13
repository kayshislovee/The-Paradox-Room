import { useGameStore, useSettingsStore } from '../../store/gameStore';
import { useMusic } from '../../hooks/useMusic';
import { MetalButton } from '../UI/MetalButton';

export function Settings() {
  const goTo = useGameStore((s) => s.goTo);
  const { musicVolume, musicMuted, setMusicVolume, toggleMusicMuted, resetProgress } =
    useSettingsStore();
  useMusic('/audio/menu_music.mp3');

  const handleReset = () => {
    if (window.confirm('Reset semua progress? Ini tidak bisa dibatalkan.')) {
      resetProgress();
      goTo('splash');
    }
  };

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

      <div style={{ zIndex: 1, width: 360, display: 'flex', flexDirection: 'column' }}>

        {/* Judul */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            color: '#e8d5b7', fontSize: 42, fontWeight: 700,
            letterSpacing: 6, textTransform: 'uppercase',
            textShadow: '0 4px 20px rgba(0,0,0,0.9)',
          }}>
            OPTIONS
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

        {/* Music toggle */}
        <SettingRow label="MUSIC">
          <MetalButton
            onClick={(e) => { e.stopPropagation(); toggleMusicMuted(); }}
            label={musicMuted ? 'MUSIC: OFF' : 'MUSIC: ON'}
            small
          />
        </SettingRow>

        {/* Volume slider */}
        <SettingRow label="VOLUME">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="range" min={0} max={1} step={0.05}
              value={musicVolume}
              onChange={(e) => setMusicVolume(Number(e.target.value))}
              style={{
                flex: 1, appearance: 'none', height: 3,
                background: `linear-gradient(to right, #c8b89a ${musicVolume * 100}%, #333 ${musicVolume * 100}%)`,
                borderRadius: 2, outline: 'none', cursor: 'pointer',
              }}
            />
            <span style={{
              color: '#c8b89a', fontSize: 13,
              fontFamily: 'monospace', minWidth: 40, textAlign: 'right',
            }}>
              {Math.round(musicVolume * 100)}%
            </span>
          </div>
        </SettingRow>

        {/* Reset */}
        <SettingRow label="PROGRESS">
          <MetalButton onClick={(e) => { e.stopPropagation(); handleReset(); }} label="RESET PROGRESS" danger small />
        </SettingRow>

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

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      borderTop: '1px solid rgba(200,184,154,0.15)',
      padding: '18px 0',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <span style={{
        color: '#8a7a6a', fontSize: 10,
        letterSpacing: 4, textTransform: 'uppercase',
      }}>
        {label}
      </span>
      {children}
    </div>
  );
}