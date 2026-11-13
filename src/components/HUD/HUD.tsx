import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { LEVELS } from '../../data/levels';
import { formatTime } from '../../hooks/useTimer';
import styles from './HUD.module.css';
import { PauseMenu } from '../PauseMenu/PauseMenu';
import { HintToken } from '../HintToken/HintToken';


export function HUD() {
  const { currentLevelId, currentSceneId, timeElapsed, discoveredClues, goTo, goToScene } =
    useGameStore();

  const level = useGameStore((s) => s.levels.find((l) => l.id === currentLevelId)) ?? LEVELS.find((l) => l.id === currentLevelId);
  if (!level) return null;

  const [showExitConfirm, setShowExitConfirm] = useState(false);

const timeLeft = Math.max(0, level.timeLimit - timeElapsed);

  const isUrgent = timeLeft <= 60;

  const confirmExit = () => {
    setShowExitConfirm(false);
    goTo('splash');
  };

  return (
    
    <div className={styles.hud}>
      <HintToken compact />
      {/* Timer */}
      <div className={`${styles.timer} ${isUrgent ? styles.urgent : ''}`}>
        ⏱ {formatTime(timeElapsed,level.timeLimit)}
      </div>

      {/* Scene navigator */}
      <div className={styles.scenes}>
       {level.scenes.filter((s) => !s.hidden).map((scene) => (
          <button
            key={scene.id}
            className={`${styles.sceneBtn} ${scene.id === currentSceneId ? styles.active : ''}`}
            onClick={() => goToScene(scene.id)}
          >
            {scene.label}
          </button>
        ))}
      </div>

      {/* Clue counter */}
      <div className={styles.clueCount}>
        🔍 {discoveredClues.length} clue
      </div>

      {/* Pause */}
      <PauseMenu />
      {/* Quit — selalu lewat konfirmasi supaya tidak keluar tanpa sengaja */}
      <button className={styles.quit} onClick={() => setShowExitConfirm(true)}>
        ✕ Keluar
      </button>

      {/* Konfirmasi keluar level */}
      {showExitConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(2,6,23,0.82)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'monospace',
          }}
          onClick={() => setShowExitConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0f172a',
              border: '1px solid rgba(200,184,154,0.35)',
              borderRadius: 12,
              padding: '28px 32px',
              minWidth: 340,
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ color: '#e8d5b7', fontSize: 18, fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>
              KELUAR DARI LEVEL?
            </div>
            <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6, marginBottom: 22 }}>
              Progres level <b style={{ color: '#fbbf24' }}>{level.title}</b> pada sesi ini
              belum tersimpan sebagai skor. Kamu akan kembali ke menu utama.
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => setShowExitConfirm(false)}
                style={{
                  padding: '10px 22px',
                  background: 'transparent',
                  border: '1px solid rgba(148,163,184,0.4)',
                  borderRadius: 6,
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  letterSpacing: 1,
                }}
              >
                BATAL
              </button>
              <button
                onClick={confirmExit}
                style={{
                  padding: '10px 22px',
                  background: '#b91c1c',
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  letterSpacing: 1,
                  fontWeight: 700,
                }}
              >
                YA, KELUAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
