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
  useMusic('/audio/level1_music.mp3');

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

  // State untuk track apakah background scene sudah siap
  const [bgReady, setBgReady] = useState(false);
  // Track scene id terakhir supaya reset saat pindah scene
  const [loadedSceneId, setLoadedSceneId] = useState<string | null>(null);

  const level = LEVELS.find((l) => l.id === currentLevelId);
  const scene = level?.scenes.find((s) => s.id === currentSceneId);
  useMusic(level?.music ?? '/audio/level1_music.mp3');

  // Reset bgReady setiap kali scene berubah
  useEffect(() => {
    if (!scene) return;
    if (scene.id === loadedSceneId) return; // sudah pernah load, skip flicker
    setBgReady(false);
  }, [scene?.id]);

  if (!level || !scene) return null;

  const isComputerZoom = zoomModal?.label?.includes('Layar Komputer');

  // Kumpulkan semua gambar di level ini untuk preload tersembunyi
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
  };

  return (
    <div className={styles.root}>
      <HUD />

      {/*
        HIDDEN PRELOADER — render semua gambar level sebagai <img> tersembunyi.
        Karena pakai pipeline yang sama dengan CSS background-image (setelah
        browser selesai load <img>, URL-nya masuk ke HTTP/image cache dan
        langsung dipakai CSS tanpa fetch ulang).
        display:none TIDAK bekerja (browser skip load), pakai visibility:hidden
        dengan ukuran 0 supaya tidak makan layout.
      */}
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
          <img
            key={src}
            src={src}
            alt=""
            // decode async supaya tidak blok render thread
            decoding="async"
            // fetchpriority tinggi untuk background scene aktif
            {...(src === scene.backgroundImage ? { fetchPriority: 'high' } as any : {})}
          />
        ))}
      </div>

      <div className={styles.main}>
        <div className={styles.sceneWrapper}>
          {/*
            Background <img> nyata sebagai elemen — bukan CSS background-image.
            Ini menjamin onLoad dipanggil saat gambar benar-benar siap dirender.
            Tetap pakai CSS background-image di atasnya, tapi kita tunggu
            konfirmasi dari <img> dulu.
          */}
          <div
            className={styles.background}
            style={{
              backgroundImage: bgReady ? `url(${scene.backgroundImage})` : 'none',
              backgroundColor: '#1a0a2e',
              transition: 'background-image 0s', // no flicker
            }}
          >
            {/* Trigger onLoad untuk background scene saat ini */}
            <img
              key={scene.backgroundImage}
              src={scene.backgroundImage}
              alt=""
              decoding="async"
              fetchPriority="high"
              style={{
                position: 'absolute',
                width: 0, height: 0,
                visibility: 'hidden',
                pointerEvents: 'none',
              }}
              onLoad={handleBgLoad}
              onError={handleBgLoad} // tetap lanjut meski error
            />

            {/* Loading placeholder saat bg belum siap */}
            {!bgReady && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#1a0a2e',
              }}>
                <div style={{
                  width: 40, height: 40,
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

            {bgReady && scene.hotspots.map((hs) => {
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
                />
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