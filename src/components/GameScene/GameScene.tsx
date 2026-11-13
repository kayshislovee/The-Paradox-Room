import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import type { DialogLine, CharacterId } from '../../types/game.types';
import { DialogScreen } from '../Dialog/DialogScreen';
import { SceneDialogOverlay } from '../Dialog/SceneDialogOverlay';
import { useVoiceChat } from '../../hooks/useVoiceChat';
// Import Level 7:
import { GameScene as Level7Scene } from '../Level7/Level7scene';
import { Level7NoteModal } from '../Level7/Level7notemodal';
import { Level7SidePanel } from '../Level7/Level7SidePanel';
import { TapeReaderModal } from '../Level7/TapeReaderModal';
import { HackingMinigame } from '../PuzzleModal/HackingMinigame';
import { DesktopOS } from '../Level7/DesktopOS';
import { HandInspect } from '../Level7/HandInspect';
import { PodControlPuzzle } from '../PuzzleModal/PodControlPuzzle';
import { ChestModal } from '../Level7/ChestModal';
import { PodLoginGate } from '../Level7/LoginControl';
import { CharacterSelectModal } from '../Level7/CharacterSelectModal';
import { ComicScene } from '../Comic/ComicScene';
import { ReactorSecurityModal } from '../PuzzleModal/ReactorSecurityModal';
import { MazePuzzle } from '../PuzzleModal/MazePuzzle';
import { HologramView } from '../PuzzleModal/HologramView';
import { SpotDifferencePuzzle } from '../PuzzleModal/SpotDiffrent';
import { GlitchOverlay } from '../Level7/GlitchOverlay';
import { resolveAssetPath } from '../../lib/assetPath';
import { multiplayer } from '../../lib/multiplayer';
import { Scene5GlitchBanner } from '../Level7/Scene5GlitchBanner';
import { Level7AllCompleteComic } from '../Level7/Level7AllCompleteComic';
import { BrainMazePuzzle } from '../PuzzleModal/BrainMazePuzzle';


interface Props {
  voiceChat: ReturnType<typeof useVoiceChat>;
}

export function GameScene({ voiceChat }: Props) {
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
  const releasedCharacter = useGameStore((s) => s.releasedCharacter);
  const handInspectOpen = useGameStore((s) => s.handInspectOpen);
  const reactorOpen = useGameStore(s => s.reactorOpen);
  const setReactorOpen = useGameStore(s => s.setReactorOpen); // ← tambah ini
  const coolingOpen = useGameStore(s => s.coolingOpen);
  const setCoolingOpen = useGameStore(s => s.setCoolingOpen);
  const powerOpen = useGameStore(s => s.powerOpen);
  const setPowerOpen = useGameStore(s => s.setPowerOpen);
  const [glitchEffect, setGlitchEffect] = useState(false);
  const fakeInfoActive = useGameStore((s) => s.fakeInfoActive);
  const loadLevels = useGameStore((s) => s.loadLevels);
  const storeLevelsLen = useGameStore((s) => s.levels.length);
  useEffect(() => {
    if (storeLevelsLen === 0) loadLevels();
  }, [storeLevelsLen, loadLevels]);
  const prevGlitchedLength = useRef(0);

  const [mazeOpen, setMazeOpen] = useState(false);
  const [podLoginOpen, setPodLoginOpen] = useState(false);
  const [allCompleteComicOpen, setAllCompleteComicOpen] = useState(false);
  const [allCompleteComicShown, setAllCompleteComicShown] = useState(false);
  const [brainMazeOpen, setBrainMazeOpen] = useState(false);
  const [escapeComicOpen, setEscapeComicOpen] = useState(false);
  const chestOpen = useGameStore((s) => s.chestOpen);
  const setChestOpen = useGameStore((s) => s.setChestOpen);
  const pendingNextSceneId = useGameStore((s) => (s as any).pendingNextSceneId as string | null);
  const setPendingNextSceneId = useGameStore((s) => (s as any).setPendingNextSceneId as (v: string | null) => void);
  const goToScene = useGameStore((s) => s.goToScene);
  const hackingMinigameOpen = useGameStore((s) => s.hackingMinigameOpen);
  const setHackingMinigameOpen = useGameStore((s) => s.setHackingMinigameOpen);
  // Ambil state xVisionActive dari game store
  const xVisionActive = useGameStore((s) => (s as any).xVisionActive as boolean);
  // Simpan ke ref supaya tidak stale
  const pendingNextSceneIdRef = useRef(pendingNextSceneId);
  useEffect(() => {
    pendingNextSceneIdRef.current = pendingNextSceneId;
  }, [pendingNextSceneId]);
  const desktopOpen = useGameStore((s) => s.desktopOpen);
  const sceneComic = useGameStore((s) => s.sceneComic);
  const finishSceneComic = useGameStore((s) => s.finishSceneComic);
  const viewedSceneComics = useGameStore((s) => s.viewedSceneComics);
  const handleTransitionEnd = useCallback(() => {
    const sceneId = pendingNextSceneIdRef.current;
    console.log('handleTransitionEnd fired, sceneId:', sceneId);
    if (sceneId) {
      goToScene(sceneId);
      setPendingNextSceneId(null);
    }
  }, [goToScene, setPendingNextSceneId]);
  const isLevel7 = currentLevelId === 'level_7';
  const podControlOpen = useGameStore((s) => s.podControlOpen);
  const setPodControlOpen = useGameStore((s) => s.setPodControlOpen);
  const pendingSceneDialog = useGameStore((s) => s.pendingSceneDialog);
  const sceneDialogOverlay = useGameStore((s) => s.sceneDialogOverlay);
  const glitchedReactors = useGameStore(s => s.glitchedReactors);
  const reactorGlitchActive = glitchedReactors.length > 0;
  const sceneBackgroundOverrides = useGameStore((s) => (s as any).sceneBackgroundOverrides as Record<string, string>);
  const openPodAccess = useCallback(() => {
    const store = useGameStore.getState();
    if (store.isPuzzleSolved('puzzle_pod_control')) {
      store.showNotification('Pod sudah dibebaskan.', 'info');
    } else if (!store.token || store.isGuest) {
      store.showNotification('Login terlebih dahulu untuk mengakses Pod Puzzle!', 'error');
    } else if (!store.hasItem('hacking_device_upgraded')) {
      store.showNotification('Kamu membutuhkan Hacking Device+ untuk mengakses Pod!', 'error');
    } else if (store.podLoginDone) {
      store.setPodControlOpen(true);
    } else {
      setPodLoginOpen(true);
    }
  }, []);
  const { handleClick } = useHotspotAction(() => setMazeOpen(true), openPodAccess);
  const [bgLoaded, setBgLoaded] = useState(false);
  const [bgReady, setBgReady] = useState(false);
  const [_, setLoadedSceneId] = useState<string | null>(null);
  const [introActive, setIntroActive] = useState(false);
  const [hologramOpen, setHologramOpen] = useState(false);
  const [spotDiffOpen, setSpotDiffOpen] = useState(false);
  const [scene5CharPicker, setScene5CharPicker] = useState(false);

  /** Comic pembebasan karakter, lalu lanjut ke scene 5. */
  const startScene5Comic = useCallback((releasedChar: 'char1' | 'char2') => {
    const releaseComic = LEVELS.find((level) => level.id === 'level_7')
      ?.sceneComics?.scene7_4_release.srcByReleasedCharacter?.[releasedChar];

    if (!releaseComic) {
      useGameStore
        .getState()
        .showNotification('Comic release tidak ditemukan untuk karakter yang dipilih.', 'error');
      return;
    }

    useGameStore.getState().setSceneComic({
      src: releaseComic.src,
      panels: releaseComic.panels,
      nextSceneId: 'scene7_5',
      pageIndex: 0,
    });
  }, []);
  const fixingFakeReactorId = useGameStore((s) => s.fixingFakeReactorId);

  // ── Pod selesai oleh PASANGAN ────────────────────────────────────────────
  // releasedCharacter dan puzzle_pod_control datang dari server, jadi player
  // yang tidak solving pod pun ikut tahu pod sudah terbuka. Efek ini yang
  // membuat dia ikut dapat menu pilih karakter tanpa harus buka pod sendiri.
  const releasedCharacterForPod = useGameStore((s) => s.releasedCharacter);
  const podPuzzleSolved = useGameStore((s) => s.solvedPuzzles.includes('puzzle_pod_control'));
  const scene5CharacterPicked = useGameStore((s) => !!s.scene5Character);

  useEffect(() => {
    if (!isLevel7) return;

    const st = useGameStore.getState();
    if (!st.playerCharacter) return;        // single player: ditangani di onSolve
    if (st.currentSceneId !== 'scene7_4') return;
    if (!st.releasedCharacter) return;    // pod belum selesai
    if (!st.solvedPuzzles.includes('puzzle_pod_control')) return;
    if (st.scene5Character) return;        // sudah memilih sendiri

    setScene5CharPicker(true);
  }, [
    isLevel7,
    releasedCharacterForPod,
    podPuzzleSolved,
    scene5CharacterPicked,
    currentSceneId,
  ]);

  // Level diambil dari STORE = hasil merge data API (isi admin) dengan data
  // lokal pelengkap (char layer, X-Vision, sub-view, comic). Jadi setiap
  // edit di admin langsung berlaku di gameplay.
  // Data lokal (LEVELS) hanya dipakai kalau store belum punya level ini
  // (dev preview / API mati).
  const staticLevel = LEVELS.find((l) => l.id === currentLevelId);
  const storeLevel = useGameStore((s) => s.levels.find((l) => l.id === currentLevelId));
  // useMemo penting: tanpa ini objek `level` selalu referensi baru setiap render,
  // sehingga useEffect yang bergantung pada `level` memicu infinite loop
  // (terutama di path Level 7 yang memanggil resumeTimer()).
  const level = useMemo(
    () => (storeLevel && storeLevel.scenes.length > 0 ? storeLevel : staticLevel),
    [storeLevel, staticLevel],
  );
  const scene = level?.scenes.find((s) => s.id === currentSceneId);
  const tapeReaderOpen = useGameStore((s) => (s as any).tapeReaderOpen);
  const setTapeReaderOpen = useGameStore((s) => (s as any).setTapeReaderOpen);
  const reactorPuzzles = ['puzzle_reactor_security', 'puzzle_cooling', 'puzzle_power'];
  const solvedReactorCount = reactorPuzzles.filter(p => solvedPuzzles.includes(p)).length;
  const finalButtonComic = level?.sceneComics?.scene7_5_final_button;
  const finalButtonCharacterComic =
    finalButtonComic?.srcByReleasedCharacter?.[releasedCharacter ?? 'char1'];
  const postBrainMazeComic = level?.sceneComics?.scene7_5_post_brainmaze;
  const postBrainMazeCharacterComic =
    postBrainMazeComic?.srcByReleasedCharacter?.[releasedCharacter ?? 'char1'];
  const reactorBgs = [
    '/backgrounds/scene5.png',
    '/backgrounds/scene5_1.png',
    '/backgrounds/scene5_2.png',
    '/backgrounds/scene5_3.png',
  ];
  useMusic(level?.music ?? '/audio/level1_music.mp3');
  const [sceneDialog, setSceneDialog] = useState<DialogLine[] | null>(null);
  const [visitedScenes, setVisitedScenes] = useState<Set<string>>(new Set());
  // Trigger dialog saat currentSceneId berubah
  useEffect(() => {
    if (glitchedReactors.length > 0 && prevGlitchedLength.current === 0) {
      setGlitchEffect(true);
      setTimeout(() => setGlitchEffect(false), 100); // reset trigger
    }
    prevGlitchedLength.current = glitchedReactors.length;
  }, [glitchedReactors.length]);

  useEffect(() => {
    if (!currentSceneId || !level) return;

    // Jangan trigger untuk scene _open
    if (currentSceneId.endsWith('_open')) return;

    if (isLevel7) {
      if (sceneComic) return;
      if (currentSceneId === 'scene7_5' && !viewedSceneComics.includes('scene7_5')) return;
      if (sceneDialog) return;

      if (visitedScenes.has(currentSceneId)) {
        useGameStore.getState().resumeTimer();
        return;
      }

      const dialogs = scene?.introDialog
        ?? level.sceneDialogs?.[currentSceneId]
        ?? level.sceneDialogs?.[`${currentSceneId}_enter`];
      setVisitedScenes((prev) => new Set([...prev, currentSceneId]));

      if (dialogs?.length) {
        // Di multiplayer, timer tetap berjalan (tidak pause) agar waktu
        // kedua player tetap sinkron saat dialog muncul.
        if (!useGameStore.getState().lobbyCode) useGameStore.getState().pauseTimer();
        setSceneDialog(dialogs);
      } else {
        useGameStore.getState().resumeTimer();
      }
      return;
    }

    // Jangan trigger kalau sudah pernah dikunjungi
    if (visitedScenes.has(currentSceneId)) return;

    // Tandai sudah dikunjungi
    setVisitedScenes((prev) => new Set([...prev, currentSceneId]));

    // Cek apakah ada dialog untuk scene ini
    const dialogs = (level as any)?.sceneDialogs?.[currentSceneId] as DialogLine[] | undefined;
    if (dialogs && dialogs.length > 0) {
      // Di multiplayer, timer tetap berjalan (tidak pause) agar waktu
      // kedua player tetap sinkron saat dialog muncul.
      if (!useGameStore.getState().lobbyCode) useGameStore.getState().pauseTimer();
      setSceneDialog(dialogs);
    }
  }, [currentSceneId, isLevel7, level, scene, sceneComic, sceneDialog, viewedSceneComics, visitedScenes]);

  // Handle pending scene dialogs triggered by hotspot actions
  useEffect(() => {
    if (pendingSceneDialog && !sceneDialog) {
      setSceneDialog(pendingSceneDialog);
      // Clear the pending dialog after consuming it
      useGameStore.getState().setPendingSceneDialog(null);
    }
  }, [pendingSceneDialog, sceneDialog]);

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

  // CATATAN: jangan `return null` di sini — di bawah masih ada beberapa
  // useEffect. Early-return di tengah component membuat jumlah hook berbeda
  // antar render ("Rendered more hooks than during the previous render").
  // Guard dilakukan di dalam masing-masing effect, dan early-return final
  // diletakkan setelah semua hook (lihat bawah).

  const isComputerZoom = zoomModal?.label?.includes('Layar Komputer');

  // Kumpulkan semua gambar level untuk hidden preloader
  const allLevelImages: string[] = [];
  level?.scenes?.forEach((s) => {
    const bg = resolveAssetPath(s.backgroundImage);
    if (bg) allLevelImages.push(bg);
    s.hotspots.forEach((hs) => {
      if (hs.action.type === 'open_note') {
        const img = resolveAssetPath(hs.action.image);
        if (img) allLevelImages.push(img);
      }
      if (hs.action.type === 'open_zoom') {
        const img = resolveAssetPath(hs.action.zoomImage);
        if (img) allLevelImages.push(img);
      }
      // Preload image biasa dan xVisionImage jika ada
      const hsImage = resolveAssetPath(hs.image);
      if (hsImage) allLevelImages.push(hsImage);
      const xVision = resolveAssetPath((hs as any).xVisionImage);
      if (xVision) allLevelImages.push(xVision);
    });
  });

  const handleBgLoad = () => {
    setBgReady(true);
    if (scene?.id) setLoadedSceneId(scene.id);
    // Tunggu sebentar lalu trigger intro glow
    setTimeout(() => {
      setIntroActive(true);
      // Matikan setelah animasi selesai (2.2s = 2s animasi + sedikit buffer)
      setTimeout(() => setIntroActive(false), 2200);
    }, 120);
  };
  useEffect(() => {
    if (import.meta.env.DEV) {
      const handler = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'R') {
          localStorage.removeItem('escape-room-game');
          location.reload();
        }
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, []);
  // Reload level data on HMR (level7 data updates) without resetting screen
  useEffect(() => {
    const handler = () => {
      const updated = LEVELS.find((l) => l.id === currentLevelId);
      if (!updated) return;
      useGameStore.setState((s) => ({
        levels: s.levels.some((l) => l.id === currentLevelId)
          ? s.levels.map((l) => (l.id === currentLevelId ? updated : l))
          : [...s.levels, updated],
      }));
    };
    window.addEventListener('level-data-updated', handler);
    return () => window.removeEventListener('level-data-updated', handler);
  }, [currentLevelId]);

  // Detect when all reactors are complete and show all_complete comic
  useEffect(() => {
    if (!isLevel7) return;
    if (solvedReactorCount < 3) return;
    if (allCompleteComicOpen || brainMazeOpen) return;
    if (allCompleteComicShown) return;

    // Small delay before showing comic
    const timeout = setTimeout(() => {
      setAllCompleteComicShown(true);
      setAllCompleteComicOpen(true);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [solvedReactorCount, isLevel7, allCompleteComicOpen, brainMazeOpen]);

  // Early-return SETELAH semua hook selesai, supaya urutan hook konsisten
  // (early-return di tengah component = "Rendered more hooks than ...").
  if (!level || !scene) return null;

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
          {allLevelImages.map((src, i) => (
            <img key={`${src}-${i}`} src={src} alt="" decoding="async" />
          ))}
        </div>

        <div className={styles.main}>
          {isLevel7 && <Level7SidePanel onOpenHologram={() => setHologramOpen(true)} />}  {/* ← tambah ini */}

          <div className={styles.sceneWrapper}>
            <div
              ref={backgroundRef}
              className={styles.background}
              style={{
                backgroundImage: `url(${resolveAssetPath(sceneBackgroundOverrides[scene.id] ?? scene.backgroundImage)})`,
                opacity: bgLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease'
              }}
            >
              {/* Trigger onLoad untuk bg scene aktif */}
              <img
                key={scene.backgroundImage}
                src={resolveAssetPath(scene.backgroundImage)}
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
              {(() => {
                // Treasure diambil dari store levels (API) kalau tersedia, supaya
                // posisi/nama/gambar yang diedit di admin ikut ter-reflect.
                // Fallback ke level static (LEVELS) kalau store belum termuat.
                const trs = level?.treasures;
                if (!trs || trs.length === 0 || isLevel7) return null;
                return (
                  <TreasureLayer
                    treasures={trs.filter((t) => !t.sceneId || t.sceneId === currentSceneId)}
                  />
                );
              })()}

              {/* Animasi pintu saat level selesai */}
              <SceneTransitionAnimation onTransitionEnd={handleTransitionEnd} />

              {/* HOTSPOTS ATAU LEVEL 7 SCENE MAPPING */}
              {isLevel7 ? (
                        <Level7Scene
                          _voiceChat={voiceChat}
                          onOpenMaze={() => setMazeOpen(true)}
                          onOpenPodLogin={openPodAccess}
                        />
              ) : (
                bgReady && scene.hotspots.map((hs, idx) => {
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
                      {/* Logika X-Vision di sini */}
                      {(hs.image || (hs as any).xVisionImage) && (
                        <img
                          src={resolveAssetPath(
                            (hs as any).xVisionImage && xVisionActive ? (hs as any).xVisionImage : hs.image,
                          )}
                          alt=""
                          className={styles.hotspotImage}
                          draggable={false}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      )}
                    </button>
                  );
                })
              )}

              {/* Animasi pintu escape */}
              <DoorEscapeAnimation />
            </div>
          </div>

          <Inventory voiceChat={voiceChat} />
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

        {noteModal && isLevel7
          ? <Level7NoteModal />
          : noteModal && <NoteZoom image={noteModal.image} onClose={closeNote} />
        }
        {tapeReaderOpen && isLevel7 && (
          <TapeReaderModal onClose={() => setTapeReaderOpen(false)} />
        )}
        {hackingMinigameOpen && isLevel7 && (
          <HackingMinigame
            onSuccess={() => {
              setHackingMinigameOpen(false);
              useGameStore.getState().setHackingDone(true);
              if (currentSceneId === 'scene7_4') {
                openPodAccess();
              } else {
                useGameStore.getState().setControlRoomHacked(true);
                useGameStore.getState().solvePuzzle('puzzle_control_hacked');
              }
            }}
            onClose={() => setHackingMinigameOpen(false)}
          />
        )}
        {desktopOpen && <DesktopOS onClose={() => useGameStore.getState().setDesktopOpen(false)} />}
        {podLoginOpen && isLevel7 && (
          <PodLoginGate
            onSuccess={() => {
              setPodLoginOpen(false);
              useGameStore.getState().setPodControlOpen(true);
            }}
            onClose={() => setPodLoginOpen(false)}
          />
        )}
        {handInspectOpen && isLevel7 && <HandInspect />}
        {notification && <Notification text={notification.text} type={notification.type} />}
        <AchievementPopup />
        <GlitchOverlay active={glitchEffect} duration={2000} />
          {isLevel7 && currentSceneId === 'scene7_5' && (
            <Scene5GlitchBanner glitchActive={glitchEffect} fakeInfoActive={fakeInfoActive} />
          )}
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

      {/* Scene Dialog Overlay - Non-blocking, appears on top of zoom/puzzle */}
      {sceneDialogOverlay && (
        <SceneDialogOverlay
          lines={sceneDialogOverlay.lines}
          position={sceneDialogOverlay.position}
          isOpen={true}
          onDone={() => {
            useGameStore.getState().setSceneDialogOverlay(null);
          }}
        />
      )}

      {chestOpen && isLevel7 && (
        <ChestModal onClose={() => setChestOpen(null)} />
      )}
      {podControlOpen && isLevel7 && (
        <PodControlPuzzle
          correctCode="23150"
          onSolve={(releasedChar) => {
            const store = useGameStore.getState();
            store.setReleasedCharacter(releasedChar);
            store.solvePuzzle('puzzle_pod_control');
            store.unlockAchievement('ach_lv7_scene4_complete');
            setPodControlOpen(false);

            // Kabari server bahwa INI karakter yang benar-benar dibebaskan pod.
            // Endpoint terpisah dari "release" (yang cuma melepas karakter
            // pilihan di lobby) supaya pod tidak pernah terlihat solved
            // tanpa pemainnya mencocokkan frekuensi/amplitude.
            multiplayer.podReleaseCharacter(releasedChar);

            // Single player: karakter dibebaskan langsung dipakai untuk scene 5.
            if (!store.playerCharacter) {
              startScene5Comic(releasedChar);
              return;
            }

            // Multiplayer: player memilih sendiri karakter untuk scene 5.
            setScene5CharPicker(true);
          }}
          onClose={() => {
            // Menutup pod TIDAK boleh menandai pod solved. Hanya solve
            // yang menandai benar-benar (lewat onSolve di atas).
            setPodControlOpen(false);
          }}
        />
      )}

      {/* Pod sudah membebaskan satu karakter → pilih karakter untuk scene 5 */}
      {scene5CharPicker && isLevel7 && (
        <CharacterSelectModal
          onSelect={async (char) => {
            const store = useGameStore.getState();
            // Tunggu keputusan server: kalau karakter sudah dipakai pemain lain,
            // pilihan ditolak dan modal tetap terbuka.
            const ok = await store.chooseScene5Character(char);
            if (!ok) return;
            setScene5CharPicker(false);
            // Comic pembebasan dipilih berdasarkan karakter YANG DIBEBASKAN,
            // bukan karakter yang dipilih untuk scene 5 — kalau memakai `char`,
            // memilih Katsuragi setelah Vania dibebaskan akan gagal lookup.
            startScene5Comic((store.releasedCharacter ?? char) as 'char1' | 'char2');
          }}
          onClose={() => {
            const store = useGameStore.getState();
            // Membatalkan tetap harus berhasil: pakai karakter yang dibebaskan.
            store.chooseScene5Character(
              (store.releasedCharacter ?? 'char3') as CharacterId
            );
            setScene5CharPicker(false);
            startScene5Comic((store.releasedCharacter ?? 'char1') as 'char1' | 'char2');
          }}
        />
      )}

      {sceneComic && isLevel7 && (
        <ComicScene
          src={sceneComic.src}
          panels={sceneComic.panels}
          onDone={finishSceneComic}
        />
      )}
      {reactorOpen && (
        <ReactorSecurityModal
          reactorId="reactor"
          panelImage="/backgrounds/mas_amba.jpg"
          panelImageUV="/backgrounds/mas_amba2.jpg"
          supportingImages={[
            {
              default: "/notes/simbol.jpg",
              translated: "/notes/simbol.jpg",
              fake: '/notes/simbolfake.jpg',              // ← dummy
              uvTranslatedFake: '/notes/simbol2.jpg', // ← penanda fake
              isFakeable: true,
            },

          ]}

          title="REACTOR SECURITY PANEL"
          correctCode="341732"
          puzzleId="puzzle_reactor_security"
          targetSceneId="scene7_5"
          newBackgroundImage=""
          actionLabel="DEACTIVATE SECURITY"
          accentColor="#22c55e"
          startGlitchTimerOnSolve={true}
          onClose={() => setReactorOpen(false)}
          // Ganti onSolve di KETIGA reactor jadi sama:
          onSolve={() => {
            setReactorOpen(false);
            useGameStore.getState().solvePuzzle('puzzle_reactor_security');
            useGameStore.getState().triggerSceneDialog('scene7_5_reactor_done');
            useGameStore.getState().removeGlitchedReactor('reactor');
            // Hitung jumlah reactor yg sudah selesai setelah solve ini
            const newCount = solvedReactorCount + 1;
            const newBg = reactorBgs[newCount] ?? reactorBgs[reactorBgs.length - 1];
            useGameStore.getState().setSceneBackgroundOverride('scene7_5', newBg);
          }}
        />
      )}
      {coolingOpen && isLevel7 && (
        <ReactorSecurityModal
          reactorId="cooling"
          panelImage="/backgrounds/china.jpg"
          panelImageUV="/backgrounds/china2.jpg"
          panelImageTranslated="/backgrounds/china.jpg"
          supportingImages={[
            {
              default: "/notes/china.jpg",
              translated: "/notes/china2.jpg",
              fake: '/notes/chinafake1.jpg',              // ← dummy
              translatedFake: '/notes/chinafake2.jpg', // ← dummy
              uvTranslatedFake: '/notes/chinacombo2.jpg', // ← penanda fake
              isFakeable: true, // ← flag gambar ini bisa berubah fake
            },
            {
              default: "/notes/cluechina.png",

            },
          ]}
          title="REACTOR SECURITY PANEL"
          correctCode="8248"
          puzzleId="puzzle_cooling"
          targetSceneId="scene7_5"
          newBackgroundImage=""
          accentColor="#22c55e"        // ← biru
          startGlitchTimerOnSolve={true}
          onClose={() => setCoolingOpen(false)}
          onSolve={() => {
            setCoolingOpen(false);
            useGameStore.getState().solvePuzzle('puzzle_cooling');
            useGameStore.getState().triggerSceneDialog('scene7_5_reactor_done');
            useGameStore.getState().removeGlitchedReactor('cooling');
            // Hitung jumlah reactor yg sudah selesai setelah solve ini
            const newCount = solvedReactorCount + 1;
            const newBg = reactorBgs[newCount] ?? reactorBgs[reactorBgs.length - 1];
            useGameStore.getState().setSceneBackgroundOverride('scene7_5', newBg);
          }}
        />
      )}

      {powerOpen && isLevel7 && (
        <ReactorSecurityModal
          reactorId="power"
          panelImage="/backgrounds/king.jpg"
          panelImageUV="/backgrounds/king2.jpg"
          panelImageTranslated="/backgrounds/king.jpg"
          supportingImages={[
            {
              default: "/notes/medieval1.jpg",
              translated: "/notes/medieval2.jpg",
              fake: '/notes/medievalfake1.jpg',
              translatedFake: '/notes/medievalfake2.jpg',          // ← dummy
              uvTranslatedFake: '/notes/medievalcombo2.jpg', // ← penanda fake
              isFakeable: true,
            },
          ]}
          title="POWER GRID PANEL"
          correctCode='69412'
          //correctCode="341732"
          puzzleId="puzzle_power"
          targetSceneId="scene7_5"
          newBackgroundImage=""
          accentColor="#22c55e"        // ← kuning
          startGlitchTimerOnSolve={true}
          onClose={() => setPowerOpen(false)}
          onSolve={() => {
            setPowerOpen(false);
            useGameStore.getState().solvePuzzle('puzzle_power');
            useGameStore.getState().triggerSceneDialog('scene7_5_reactor_done');
            useGameStore.getState().removeGlitchedReactor('power');
            // Hitung jumlah reactor yg sudah selesai setelah solve ini
            const newCount = solvedReactorCount + 1;
            const newBg = reactorBgs[newCount] ?? reactorBgs[reactorBgs.length - 1];
            useGameStore.getState().setSceneBackgroundOverride('scene7_5', newBg);
          }}
        />
      )}
      {mazeOpen && isLevel7 && (
        <MazePuzzle
          maxStages={reactorGlitchActive ? 2 : 1}
          startStage={reactorGlitchActive ? 1 : 0}
          onSolve={() => {
            setMazeOpen(false);
            const store = useGameStore.getState();
            const fixingId = store.fixingReactorId;

            if (fixingId) {
              // Perbaikan GLITCH: gangguan reactor ini dihapus untuk SEMUA
              // pemain (state glitch sudah shared ke lobby).
              store.removeGlitchedReactor(fixingId);
              store.setFixingReactorId(null);
              setHologramOpen(true);
              store.showNotification('Gangguan berhasil diperbaiki!', 'success');

              // Fake info dijadwalkan di store supaya tetap sinkron di 2 player
              // (muncul 10 detik setelah semua glitch diperbaiki).
              store.scheduleFakeInfo();
            } else {
              openPodAccess();
            }
          }}
          onClose={() => setMazeOpen(false)}
        />
      )}
      {hologramOpen && isLevel7 && (
        <HologramView
          onClose={() => setHologramOpen(false)}
          onFixGlitch={() => {
            setHologramOpen(false);
            setMazeOpen(true);
          }}
          onFixFake={() => {
            setHologramOpen(false);
            setSpotDiffOpen(true);
          }}
        />
      )}
      {allCompleteComicOpen && isLevel7 && (
        <Level7AllCompleteComic
          src={finalButtonCharacterComic?.src ?? finalButtonComic?.src ?? ''}
          panels={finalButtonCharacterComic?.panels ?? finalButtonComic?.panels ?? []}
          onDone={() => {
            setAllCompleteComicOpen(false);
            setBrainMazeOpen(true);
          }}
        />
      )}
      {brainMazeOpen && isLevel7 && (
        <BrainMazePuzzle
          onClose={() => setBrainMazeOpen(false)}
          onSolve={() => {
            setBrainMazeOpen(false);
            setEscapeComicOpen(true);
          }}
        />
      )}
      {escapeComicOpen && isLevel7 && (() => {
        const resolvedSrc = postBrainMazeCharacterComic?.src ?? postBrainMazeComic?.src;
        const resolvedPanels = postBrainMazeCharacterComic?.panels ?? postBrainMazeComic?.panels;
        if (!resolvedSrc || !resolvedPanels) return null;
        return (
          <ComicScene
            src={resolvedSrc}
            panels={resolvedPanels}
            onDone={() => {
              setEscapeComicOpen(false);
              const st = useGameStore.getState();
              st.completeLevel(st.player?.username ?? 'Guest');
            }}
          />
        );
      })()}
      {spotDiffOpen && isLevel7 && (
        <SpotDifferencePuzzle
          reactorId={fixingFakeReactorId ?? 'reactor'}
          onSolve={() => {
            setSpotDiffOpen(false);
            const fixingId = useGameStore.getState().fixingFakeReactorId;

            if (fixingId) {
              // Fake info reactor ini sudah teridentifikasi → hilang untuk
              // SEMUA pemain (state fake reactor shared ke lobby).
              useGameStore.getState().removeFakeReactor(fixingId);
              useGameStore.getState().setFixingFakeReactorId(null);
              const remaining = useGameStore.getState().fakeReactors;
              useGameStore.getState().setFakeInfoActive(remaining.length > 0);
              useGameStore.getState().showNotification('Fake information berhasil diidentifikasi!', 'success');
            }
            setHologramOpen(true);
          }}
          onClose={() => {
            setSpotDiffOpen(false);
            setHologramOpen(true);
          }}
        />
      )}
    </>
  );
}
