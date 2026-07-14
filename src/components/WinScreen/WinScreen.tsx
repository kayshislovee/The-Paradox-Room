import { useGameStore } from '../../store/gameStore';
import { LEVELS } from '../../data/levels';
import { formatTime } from '../../hooks/useTimer';
import styles from './WinScreen.module.css';

interface Props {
  onStartLevel: (levelId: string) => void;
}

export function WinScreen({ onStartLevel }: Props) {
  const { currentLevelId, timeElapsed, levelProgress, goTo } = useGameStore();

  const level = LEVELS.find((l) => l.id === currentLevelId);
  const progress = currentLevelId ? levelProgress[currentLevelId] : null;
  const stars = progress?.stars ?? 0;
  const isTimeout = level && timeElapsed >= level.timeLimit;

  const currentIdx = LEVELS.findIndex((l) => l.id === currentLevelId);
  const nextLevel = LEVELS[currentIdx + 1];

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        {isTimeout ? (
          <>
            <div className={styles.icon}></div>
            <h2 className={styles.titleFail}>Waktu Habis!</h2>
            <p className={styles.sub}>Kamu tidak berhasil kabur tepat waktu.</p>
          </>
        ) : (
          <>
            <div className={styles.icon}></div>
            <h2 className={styles.titleWin}>BERHASIL KABUR!</h2>
            <p className={styles.sub}>{level?.title}</p>

            <div className={styles.stars}>
              {[1, 2, 3].map((n) => (
                <span key={n} className={n <= stars ? styles.starOn : styles.starOff}>★</span>
              ))}
            </div>

            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Waktu</span>
                <span className={styles.statVal}>{formatTime(timeElapsed)}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Best</span>
                <span className={styles.statVal}>{formatTime(progress?.bestTime ?? timeElapsed)}</span>
              </div>
            </div>
          </>
        )}

        <div className={styles.actions}>
          <button
            className={styles.btnSecondary}
            onClick={() => currentLevelId && onStartLevel(currentLevelId)}
          >
             Coba Lagi
          </button>
          {nextLevel && !isTimeout && (
            <button
              className={styles.btnPrimary}
              onClick={() => onStartLevel(nextLevel.id)}  
            >
               Level Berikutnya
            </button>
          )}
          <button className={styles.btnSecondary} onClick={() => goTo('level_select')}>
             Pilih Level
          </button>
          <button className={styles.btnGhost} onClick={() => goTo('splash')}>
             Menu Utama
          </button>
        </div>
      </div>
    </div>
  );
}