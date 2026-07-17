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

  const [bgReady, setBgReady] = useState(false);
  const [loadedSceneId, setLoadedSceneId] = useState<string | null>(null);
  const [introActive, setIntroActive] = useState(false);

  const level = LEVELS.find((l) => l.id === currentLevelId);
  const scene = level?.scenes.find((s) => s.id === currentSceneId);

  useMusic(level?.music ?? '/audio/level1_music.mp3');

  // Reset bgReady setiap kali scene berubah
  useEffect(() => {
    if (!scene) return;
    if (scene.id === loadedSceneId) return;
    setBgReady(false);
    setIntroActive(false);
  }, [scene?.id]);

  if (!level || !scene) return null;

  const isComputerZoom = zoomModal?.label?.includes('Layar Komputer');

  // Kumpulkan semua gambar level untuk hidden preloader
  const allLevelImages: string[] = [];
  level.scenes.forEach((s) => {
    if (s.backgroundImage) allLevelImages.push(s.backgroundImage);
    s.hotspots.forEach((hs) => {
      if (hs.action.type === 'open_note') allLevelImages.push(hs.action.image);
      if (hs.action.type === 'open_zoom') allLevelImages.push(hs.action.zoomImage);
    });
  });

  const handleBgLoad = () => {
    setBgReady(true);
    setLoadedSceneId(scene.id);
    // Tunggu sebentar lalu trigger intro glow
    setTimeout(() => {
      setIntroActive(true);
      // Matikan setelah animasi selesai (2.2s = 2s animasi + sedikit buffer)
      setTimeout(() => setIntroActive(false), 2200);
    }, 120);
  };

  return (
    <div className={styles.root}>
      <HUD />

      {/* Hidden preloader — semua gambar level di-render sebagai <img> di DOM */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: 0, height: 0,
          overflow: 'hidden',
          visibility: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {allLevelImages.map((src) => (
          <img key={src} src={src} alt="" decoding="async" />
        ))}
      </div>

      <div className={styles.main}>
        <div className={styles.sceneWrapper}>
          <div
            className={styles.background}
            style={{
              backgroundImage: bgReady ? `url(${scene.backgroundImage})` : 'none',
              backgroundColor: '#1a0a2e',
            }}
          >
            {/* Trigger onLoad untuk bg scene aktif */}
            <img
              key={scene.backgroundImage}
              src={scene.backgroundImage}
              alt=""
              decoding="async"
              style={{
                position: 'absolute',
                width: 0, height: 0,
                visibility: 'hidden',
                pointerEvents: 'none',
              }}
              onLoad={handleBgLoad}
              onError={handleBgLoad}
            />

            {/* Spinner saat bg belum siap */}
            {!bgReady && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#1a0a2e',
              }}>
                <div style={{
                  width: 36, height: 36,
                  border: '3px solid rgba(167,139,250,0.2)',
                  borderTopColor: 'rgba(167,139,250,0.8)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {!scene.backgroundImage && (
              <div className={styles.placeholder}>🏚️ {scene.label}</div>
            )}

            {bgReady && scene.hotspots.map((hs, idx) => {
              if (hs.visible?.requiresItem && !inventory.find((i) => i.id === hs.visible?.requiresItem)) return null;
              if (hs.visible?.requiresSolved && !solvedPuzzles.includes(hs.visible.requiresSolved)) return null;
              if (hs.visible?.hideAfterUsed && usedHotspots.includes(hs.id)) return null;

              const isUsed = usedHotspots.includes(hs.id);
              const isSolved =
                hs.action.type === 'open_puzzle' &&
                solvedPuzzles.includes(hs.action.puzzleId);

              return (
                <button
                  key={hs.id}
                  className={[
                    styles.hotspot,
                    isUsed ? styles.used : '',
                    hs.image ? styles.hasImage : '',
                    introActive ? styles.hotspotIntro : '',
                  ].filter(Boolean).join(' ')}
                  style={{
                    left: `${hs.x}%`,
                    top: `${hs.y}%`,
                    width: `${hs.width}%`,
                    height: `${hs.height}%`,
                    cursor: hs.cursor ?? 'pointer',
                    border: isSolved ? '2px solid rgba(16,185,129,0.6)' : undefined,
                    // Tiap hotspot menyala dengan delay berbeda supaya efeknya bergelombang
                    animationDelay: introActive ? `${idx * 80}ms` : '0ms',
                  }}
                  onClick={() => handleClick(hs)}
                >
                  {hs.image && (
                    <img
                      src={hs.image}
                      alt=""
                      className={styles.hotspotImage}
                      draggable={false}
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

      {zoomModal && isComputerZoom && <ComputerZoom onClose={closeZoom} />}

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