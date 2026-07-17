import { useGameStore } from '../../store/gameStore';
import { LEVELS } from '../../data/levels';
import { formatTime } from '../../hooks/useTimer';
import styles from './HUD.module.css';

export function HUD() {
  const { currentLevelId, currentSceneId, timeElapsed, discoveredClues, goTo, goToScene } =
    useGameStore();

  const level = LEVELS.find((l) => l.id === currentLevelId);
  if (!level) return null;

  const timeLeft = level.timeLimit - timeElapsed;
  const isUrgent = timeLeft <= 60;

  return (
    <div className={styles.hud}>
      {/* Timer */}
      <div className={`${styles.timer} ${isUrgent ? styles.urgent : ''}`}>
        {formatTime(timeLeft)}
      </div>

      {/* Scene navigator */}
      <div className={styles.scenes}>
        {level.scenes.map((scene) => (
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
        Clue: {discoveredClues.length}
      </div>

      {/* Quit */}
      <button className={styles.quit} onClick={() => goTo('splash')}>
        ✕ Keluar
      </button>
    </div>
  );
}