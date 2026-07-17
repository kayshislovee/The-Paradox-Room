import { useState, useEffect } from 'react';
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
  const [mountKey, setMountKey] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setMountKey((k) => k + 1), 100);
    return () => clearTimeout(t);
  }, []);

  const {
    currentLevelId,
    currentSceneId,
    activePuzzleId,
    zoomModal,
    noteModal,
    usedHotspots,
    solvedPuzzles,
    inventory,
    notification,
    closeZoom,
    closeNote,
  } = useGameStore();

  const { handleClick } = useHotspotAction();

  const level = LEVELS.find((l) => l.id === currentLevelId);
  const scene = level?.scenes.find((s) => s.id === currentSceneId);

  useMusic(level?.music ?? '', 0.5);

  if (!level || !scene) return null;

  const isComputerZoom = zoomModal?.label?.includes('Layar Komputer');

  return (
    <div className={styles.root}>
      <HUD />

      <div className={styles.main}>
        <div className={styles.sceneWrapper}>
          <div
            className={styles.background}
            style={{ backgroundImage: `url(${scene.backgroundImage})` }}
            onContextMenu={(e) => {
              if (!import.meta.env.DEV) return;
              e.preventDefault();
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
              const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
              alert(`Posisi klik:\nx: ${x}%\ny: ${y}%`);
            }}
          >
            {!scene.backgroundImage && (
              <div className={styles.placeholder}>
                {scene.label}
              </div>
            )}

            {scene.hotspots.map((hs, idx) => {
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
                  className={`${styles.hotspot} ${isUsed ? styles.used : ''} ${hs.image ? styles.hasImage : ''}`}
                  style={{
                    left: `${hs.x}%`,
                    top: `${hs.y}%`,
                    width: `${hs.width}%`,
                    height: `${hs.height}%`,
                    cursor: hs.cursor ?? 'pointer',
                    zIndex: hs.zIndex ?? 1,
                    border: isSolved ? '2px solid rgba(16,185,129,0.6)' : undefined,
                  }}
                  onClick={() => handleClick(hs)}
                  title={hs.id}
                >
                  {hs.image && (
                    <img
                      key={`${hs.id}-${mountKey}`}
                      src={hs.image}
                      alt=""
                      className={styles.hotspotImage}
                      draggable={false}
                      style={{
                        animationDelay: `${idx * 0.3}s`,
                      } as React.CSSProperties}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <Inventory />
      </div>

      {activePuzzleId && <PuzzleModal puzzleId={activePuzzleId} level={level} />}

      {zoomModal && isComputerZoom && (
        <ComputerZoom onClose={closeZoom} />
      )}

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
      )}

      {noteModal && <NoteZoom image={noteModal.image} onClose={closeNote} />}
      {notification && <Notification text={notification.text} type={notification.type} />}
    </div>
  );
}