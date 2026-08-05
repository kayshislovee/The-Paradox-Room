import { useGameStore } from '../../store/gameStore';
import { LEVELS } from '../../data/levels';
import { formatTime } from '../../hooks/useTimer';
import styles from './HUD.module.css';
import { PauseMenu } from '../PauseMenu/PauseMenu';
import { HintToken } from '../HintToken/HintToken';


export function HUD() {
  const { currentLevelId, currentSceneId, timeElapsed, discoveredClues, goTo, goToScene } =
    useGameStore();

  const level = LEVELS.find((l) => l.id === currentLevelId);
  if (!level) return null;


const timeLeft = Math.max(0, level.timeLimit - timeElapsed);

  const isUrgent = timeLeft <= 60;

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

      {/* Quit */}
      <button className={styles.quit} onClick={() => goTo('splash')}>
        ✕ Keluar
      </button>
    </div>
  );
}