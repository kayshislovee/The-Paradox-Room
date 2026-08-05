import { useState } from 'react';
import { useGameStore, useSettingsStore } from '../../store/gameStore';
import { LEVELS } from '../../data/levels';
import styles from './Inventory.module.css';
import { useHintRefill } from '../../hooks/useHintRefill';
import { HintToken } from '../HintToken/HintToken';
import { useSFX } from '../../hooks/useSFX';

export function Inventory() {
  useHintRefill();

  const discoveredClues = useGameStore((s) => s.discoveredClues);
  const goTo = useGameStore((s) => s.goTo);
  const currentLevelId = useGameStore((s) => s.currentLevelId);
  const hintsUsed = useGameStore((s) => s.hintsUsed);
  const hintTokens = useGameStore((s) => s.hintTokens);
  const { musicVolume, musicMuted, setMusicVolume, toggleMusicMuted } = useSettingsStore();
  const [tab, setTab] = useState<'clues' | 'settings'>('clues');
  const [showWarning, setShowWarning] = useState(false);
  const sfx = useSFX();

  const level = LEVELS.find((l) => l.id === currentLevelId);
  const hints = level?.hints ?? [];
  const usedHints = hints.slice(0, hintsUsed);

 const handleUseHint = () => {
  console.log('🔍 handleUseHint:', { hintTokens, hintsUsed, hintsLength: hints.length });
  if (hintTokens <= 0 || hintsUsed >= hints.length) {
    console.log('🔍 kondisi gagal:', { tokenHabis: hintTokens <= 0, hintHabis: hintsUsed >= hints.length });
    return;
  }
  console.log('🔍 setShowWarning(true)');
  setShowWarning(true);
};

  // Use Zustand hooks for actions to ensure proper reactivity
  const useHintToken = useGameStore((s) => s.useHintToken);
  const useHint = useGameStore((s) => s.useHint);

  const handleConfirmHint = () => {
    const success = useHintToken();
    if (success) {
      sfx.playHint();
      useHint();
    }
    setShowWarning(false);
  };

  return (
    <aside className={styles.panel}>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'clues' ? styles.active : ''}`}
          onClick={() => setTab('clues')}
        >
          Clue ({discoveredClues.length})
        </button>
       
      </div>

      {/* Clue tab */}
      {tab === 'clues' && (
        <div className={styles.list}>
          {discoveredClues.length === 0 && (
            <p className={styles.empty}>
              Belum ada clue ditemukan.<br /><br />
              Klik objek di ruangan untuk menemukan clue!
            </p>
          )}
          {discoveredClues.map((clue, idx) => (
            <div key={clue.id} className={styles.clueCard}>
              <div className={styles.clueIndex}>#{idx + 1}</div>
              <div>
                <div className={styles.clueContent}>{clue.content}</div>
                <div className={styles.clueHint}>{clue.hint}</div>
              </div>
            </div>
          ))}

          {/* Hint section */}
          <div style={{ marginTop: 12 }}>
            <div style={{
              color: '#78716c', fontSize: 9,
              letterSpacing: 3, textTransform: 'uppercase',
              marginBottom: 8, fontFamily: "'Georgia', serif",
              textAlign: 'center',
            }}>
              — Hints —
            </div>

            {/* Token indicator */}
            <div style={{ marginBottom: 8 }}>
              <HintToken compact />
            </div>

            {/* Used hints */}
            {usedHints.map((hint, i) => (
              <div key={i} style={{
                background: 'rgba(251,191,36,0.06)',
                border: '1px solid rgba(251,191,36,0.2)',
                borderRadius: 6, padding: '8px 10px',
                marginBottom: 6,
              }}>
                <div style={{
                  color: '#fbbf24', fontSize: 9,
                  letterSpacing: 2, marginBottom: 4,
                  fontFamily: "'Georgia', serif",
                }}>
                  💡 HINT {i + 1}
                </div>
                <div style={{
                  color: '#c8b89a', fontSize: 12,
                  lineHeight: 1.5, fontFamily: 'sans-serif',
                }}>
                  {hint}
                </div>
              </div>
            ))}

            {/* Tombol gunakan hint */}
            {hintsUsed < hints.length && (
              <button
                onClick={handleUseHint}
                disabled={hintTokens <= 0}
                style={{
                  width: '100%', padding: '8px 0',
                  background: hintTokens > 0
                    ? 'rgba(251,191,36,0.08)'
                    : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${hintTokens > 0
                    ? 'rgba(251,191,36,0.25)'
                    : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: 6,
                  color: hintTokens > 0 ? '#fbbf24' : '#334155',
                  fontSize: 11,
                  cursor: hintTokens > 0 ? 'pointer' : 'not-allowed',
                  fontFamily: "'Georgia', serif",
                  letterSpacing: 2, marginTop: 4,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (hintTokens > 0)
                    e.currentTarget.style.background = 'rgba(251,191,36,0.15)';
                }}
                onMouseLeave={(e) => {
                  if (hintTokens > 0)
                    e.currentTarget.style.background = 'rgba(251,191,36,0.08)';
                }}
              >
                {hintTokens > 0
                  ? `💡 GUNAKAN HINT (${hintTokens} token)`
                  : '⛔ TOKEN HABIS'}
              </button>
            )}

            {hintsUsed >= hints.length && hints.length > 0 && (
              <div style={{
                color: '#4a4a4a', fontSize: 10,
                textAlign: 'center', padding: '6px 0',
                fontFamily: 'monospace', letterSpacing: 1,
              }}>
                Semua hint sudah digunakan
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings tab */}
      {tab === 'settings' && (
        <div className={styles.settingsList}>
          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>Music</span>
            <button
              className={`${styles.toggleBtn} ${!musicMuted ? styles.toggleOn : styles.toggleOff}`}
              onClick={toggleMusicMuted}
            >
              {musicMuted ? 'OFF' : 'ON'}
            </button>
          </div>

          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>Volume</span>
            <span className={styles.settingValue}>{Math.round(musicVolume * 100)}%</span>
          </div>
          <input
            type="range" min={0} max={1} step={0.05}
            value={musicVolume}
            onChange={(e) => setMusicVolume(Number(e.target.value))}
            className={styles.slider}
          />

          <button
            className={styles.exitBtn}
            onClick={() => goTo('splash')}
          >
            Keluar ke Menu
          </button>
        </div>
      )}

      {/* Modal peringatan — stopPropagation di inner div, bukan outer */}
      {showWarning && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 99999,
            pointerEvents: 'all',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(145deg, #1a1a0a, #111108)',
              border: '1px solid rgba(251,191,36,0.3)',
              borderRadius: 12, padding: '28px 28px',
              width: 300, textAlign: 'center',
              display: 'flex', flexDirection: 'column', gap: 14,
              boxShadow: '0 0 40px rgba(251,191,36,0.1), 0 20px 60px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ fontSize: 36 }}>⚠️</div>

            <div style={{
              color: '#fbbf24', fontSize: 13, fontWeight: 700,
              fontFamily: "'Georgia', serif", letterSpacing: 2,
            }}>
              GUNAKAN HINT TOKEN?
            </div>

            <p style={{
              color: '#c8b89a', fontSize: 12,
              fontFamily: 'sans-serif', lineHeight: 1.6, margin: 0,
            }}>
              Menggunakan hint akan menghabiskan{' '}
              <strong style={{ color: '#fbbf24' }}>1 token</strong>.<br />
              Sisa token: <strong style={{ color: '#fbbf24' }}>{hintTokens}</strong><br />
              Token diisi ulang setiap <strong>1 menit</strong>.
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowWarning(false)}
                style={{
                  flex: 1, padding: '10px 0',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, color: '#8a7a6a',
                  fontSize: 11, cursor: 'pointer',
                  fontFamily: "'Georgia', serif", letterSpacing: 2,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                BATAL
              </button>
              <button
                onClick={handleConfirmHint}
                style={{
                  flex: 1, padding: '10px 0',
                  background: 'rgba(251,191,36,0.15)',
                  border: '1px solid rgba(251,191,36,0.4)',
                  borderRadius: 8, color: '#fbbf24',
                  fontSize: 11, cursor: 'pointer',
                  fontFamily: "'Georgia', serif", letterSpacing: 2,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(251,191,36,0.25)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(251,191,36,0.15)'}
              >
                YA, GUNAKAN
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}