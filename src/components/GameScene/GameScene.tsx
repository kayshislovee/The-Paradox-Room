import { useGameStore } from '../../store/gameStore';
import { LEVELS } from '../../data/levels';
import { useTimer } from '../../hooks/useTimer';
import { useHotspotAction } from '../../hooks/useHotspotAction';
import { HUD } from '../HUD/HUD';
import { Inventory } from '../Inventory/Inventory';
import { PuzzleModal } from '../PuzzleModal/PuzzleModal';
import { ComputerZoom } from './ComputerZoom';
import { Notification } from './Notification';
import styles from './GameScene.module.css';
import { NoteZoom } from './NoteZoom';
import { useMusic } from '../../hooks/useMusic';


export function GameScene() {
  useTimer();
useMusic('/audio/level1_music.mp3');
  const {
    currentLevelId,
    currentSceneId,
    activePuzzleId,
    zoomModal,
    noteModal,      // ← tambahkan ini
    usedHotspots,
    solvedPuzzles,
    inventory,
    notification,
    closeZoom,
    closeNote,      // ← tambahkan ini
  } = useGameStore();
  

  const { handleClick } = useHotspotAction();

  const level = LEVELS.find((l) => l.id === currentLevelId);
  const scene = level?.scenes.find((s) => s.id === currentSceneId);
 useMusic(level?.music ?? '/audio/level1_music.mp3');
  if (!level || !scene) return null;

  // Cek apakah ini zoom untuk komputer
  const isComputerZoom = zoomModal?.label?.includes('Layar Komputer');

  return (
    <div className={styles.root}>
      <HUD />

      <div className={styles.main}>
        <div className={styles.sceneWrapper}>
          <div
            className={styles.background}
            style={{ backgroundImage: `url(${scene.backgroundImage})` }}
          >
            {!scene.backgroundImage && (
              <div className={styles.placeholder}>
                🏚️ {scene.label}
              </div>
            )}

            {scene.hotspots.map((hs) => {
              if (hs.visible?.requiresItem && !inventory.find((i) => i.id === hs.visible?.requiresItem)) return null;
              if (hs.visible?.requiresSolved && !solvedPuzzles.includes(hs.visible.requiresSolved)) return null;
              if (hs.visible?.hideAfterUsed && usedHotspots.includes(hs.id)) return null;

              const isUsed = usedHotspots.includes(hs.id);
              const isPuzzleHs = hs.action.type === 'open_puzzle';
              const isSolved = isPuzzleHs && 
                hs.action.type === 'open_puzzle' && 
                solvedPuzzles.includes(hs.action.puzzleId);

              return (
                <button
                  key={hs.id}
                  className={`${styles.hotspot} ${isUsed ? styles.used : ''}`}
                  style={{
                    left: `${hs.x}%`,
                    top: `${hs.y}%`,
                    width: `${hs.width}%`,
                    height: `${hs.height}%`,
                    cursor: hs.cursor ?? 'pointer',
                    border: isSolved ? '2px solid rgba(16,185,129,0.6)' : undefined,
                  }}
                  onClick={() => handleClick(hs)}
                  
                >
                  
                </button>
              );
            })}
          </div>
        </div>

        <Inventory />
      </div>

      {/* Modals */}
      {activePuzzleId && <PuzzleModal puzzleId={activePuzzleId} level={level} />}

      {/* Komputer = tampilan terminal khusus */}
      {zoomModal && isComputerZoom && (
        <ComputerZoom onClose={closeZoom} />
      )}

      {/* Zoom modal biasa untuk lainnya */}
      {zoomModal && !isComputerZoom && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
          }}
          onClick={closeZoom}
        >
          <div style={{ position: 'relative', maxWidth: '80vw', maxHeight: '80vh' }}>
            <img
              src={zoomModal.image}
              alt={zoomModal.label}
              style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 12 }}
            />
            <p style={{
              color: '#fff', textAlign: 'center', marginTop: 12,
              fontFamily: 'sans-serif', fontSize: 14, opacity: 0.7,
            }}>
              {zoomModal.label}
            </p>
          </div>
        </div>
        
      )
      }
      
 {noteModal && <NoteZoom image={noteModal.image} onClose={closeNote} />}
      {notification && <Notification text={notification.text} type={notification.type} />}
    </div>
  );
}
