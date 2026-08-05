import { useState, useEffect, useRef } from 'react';
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
import { TreasureLayer } from './TreasureLayer';
import { AchievementPopup } from '../Achievement/AchievementPopup';
import { ZoomableNote } from './ZoomableNote';
import { DoorEscapeAnimation } from './DoorEscapeAnimation';
import { SceneTransitionAnimation } from './SceneTransitionAnimation';
import type { DialogLine } from '../../types/game.types';
import { DialogScreen } from '../Dialog/DialogScreen';

export function GameScene() {
  useTimer();
  const backgroundRef = useRef<HTMLDivElement>(null);
  
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

  const pendingNextSceneId = useGameStore((s) => (s as any).pendingNextSceneId as string | null);
  const setPendingNextSceneId = useGameStore((s) => (s as any).setPendingNextSceneId as (v: string | null) => void);
  const goToScene = useGameStore((s) => s.goToScene);

  const handleTransitionEnd = () => {
    if (pendingNextSceneId) {
      goToScene(pendingNextSceneId);
      setPendingNextSceneId(null);
    }
  };

  const sceneBackgroundOverrides = useGameStore((s) => (s as any).sceneBackgroundOverrides as Record<string, string>);
  const { handleClick } = useHotspotAction();
  const [bgLoaded, setBgLoaded] = useState(false);
  const [bgReady, setBgReady] = useState(false);
  const [_, setLoadedSceneId] = useState<string | null>(null);
  const [introActive, setIntroActive] = useState(false);

  const level = useGameStore((s) => s.levels.find((l) => l.id === currentLevelId)) ??
    LEVELS.find((l) => l.id === currentLevelId);
  const scene = level?.scenes.find((s) => s.id === currentSceneId);

  useMusic(level?.music ?? '/audio/level1_music.mp3');
  const [sceneDialog, setSceneDialog] = useState<DialogLine[] | null>(null);
  const [visitedScenes, setVisitedScenes] = useState<Set<string>>(new Set());

  // Trigger dialog saat currentSceneId berubah
  useEffect(() => {
    if (!currentSceneId || !level) return;

    // Jangan trigger untuk scene _open
    if (currentSceneId.endsWith('_open')) return;

    // Jangan trigger kalau sudah pernah dikunjungi
    if (visitedScenes.has(currentSceneId)) return;

    // Tandai sudah dikunjungi
    setVisitedScenes((prev) => new Set([...prev, currentSceneId]));

    // Cek apakah ada dialog untuk scene ini
    const dialogs = (level as any)?.sceneDialogs?.[currentSceneId] as DialogLine[] | undefined;
    if (dialogs && dialogs.length > 0) {
      // Pause timer selama dialog
      useGameStore.getState().pauseTimer();
      setSceneDialog(dialogs);
    }
  }, [currentSceneId]);

  // Reset bgReady setiap kali scene berubah
  useEffect(() => {
    if (!scene?.backgroundImage) { 
      setBgLoaded(true); 
      return; 
    }
    const img = new Image();
    img.src = scene.backgroundImage;
    img.onload = () => setBgLoaded(true);
    if (img.complete) setBgLoaded(true);
  }, [scene?.backgroundImage]);

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
    <>
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
              ref={backgroundRef} 
              className={styles.background}
              style={{
                backgroundImage: `url(${sceneBackgroundOverrides[scene.id] ?? scene.backgroundImage})`,
                opacity: bgLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease'
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
              {level.treasures && level.treasures.length > 0 && (
                <TreasureLayer
                  treasures={level.treasures.filter((t) => !t.sceneId || t.sceneId === currentSceneId)}
                />
              )}

              {/* Animasi pintu saat level selesai */}
              <SceneTransitionAnimation onTransitionEnd={handleTransitionEnd} />

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

              {/* Animasi pintu escape */}
              <DoorEscapeAnimation />
            </div>
          </div>

          <Inventory />
        </div>

        {/* Puzzle Modal */}
        {activePuzzleId && <PuzzleModal puzzleId={activePuzzleId} level={level} />}

        {/* Zoom Modals Handling (Bersih dan tidak tumpang tindih) */}
        {zoomModal && (
          <>
            {isComputerZoom ? (
              <ComputerZoom onClose={closeZoom} />
            ) : zoomModal.label === 'ZOOMABLE' ? (
              <ZoomableNote image={zoomModal.image} onClose={closeZoom} />
            ) : (
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
          </>
        )}

        {noteModal && <NoteZoom image={noteModal.image} onClose={closeNote} />}
        {notification && <Notification text={notification.text} type={notification.type} />}
        <AchievementPopup />
      </div>

      {sceneDialog && (
        <DialogScreen
          lines={sceneDialog}
          background={scene?.backgroundImage}
          onDone={() => {
            setSceneDialog(null);
            useGameStore.getState().resumeTimer();
          }}
        />
      )}
    </>
  );
}