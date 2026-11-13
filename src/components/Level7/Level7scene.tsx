import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { LEVELS } from '../../data/levels';
import type { Hotspot, Scene, Item, CharacterId } from '../../types/game.types';
import { useHotspotAction } from '../../hooks/useHotspotAction';
import { MonitorOverlay } from './MonitorOverlay';
import { ComicScene } from '../Comic/ComicScene';
import { CharacterSelectModal } from './CharacterSelectModal';
import { resolveLevel7Character } from '../../lib/characterFlow';

export function Level7Scene({
  onOpenMaze,
  onOpenPodLogin,
}: {
  onOpenMaze?: () => void;
  onOpenPodLogin?: () => void;
  _voiceChat?: unknown;
}) {
  // === STORE & HOOKS ===
  const currentSceneId = useGameStore((s) => s.currentSceneId);
  const activeCharacter = useGameStore((s) => s.activeCharacter);
  const xVisionActive = useGameStore((s) => s.xVisionActive);
  const uvFlashlightActive = useGameStore((s) => s.uvFlashlightActive);
  const levels = useGameStore((s) => s.levels);
  const sceneBackgroundOverrides = useGameStore((s) => s.sceneBackgroundOverrides);
  const usedHotspots = useGameStore((s) => s.usedHotspots);
  const char1Inventory = useGameStore((s) => s.char1Inventory);
  const char2Inventory = useGameStore((s) => s.char2Inventory);
  const char3Inventory = useGameStore((s) => (s as any).char3Inventory) ?? [];
  const playerCharacter = useGameStore((s) => s.playerCharacter);
  const scene5Character = useGameStore((s) => s.scene5Character);
  const isMultiplayer = !!playerCharacter;

  // Determine effective character based on scene and multiplayer state.
  // Delegasi ke resolveLevel7Character() supaya sama persis dengan yang dipakai
  // Level7SidePanel dan store (satu sumber kebenaran).
  const sceneForChar = levels.find((l) => l.id === 'level_7')?.scenes?.find((s) => s.id === currentSceneId) as any;
  const autoSwitchChar = sceneForChar?.autoSwitchChar ?? null;

  const effectiveCharacter: CharacterId = resolveLevel7Character({
    currentSceneId,
    playerCharacter,
    scene5Character,
    activeCharacter,
    autoSwitchChar,
  });
  const inventory = effectiveCharacter === 'char1'
    ? char1Inventory
    : effectiveCharacter === 'char2'
      ? char2Inventory
      : char3Inventory;
  const controlRoomHacked = useGameStore((s) => s.controlRoomHacked);

  // === STATE ===
  const [activeComicId, setActiveComicId] = useState<string | null>(null);
  const [subViewsState, setSubViewsState] = useState<Record<string, string | null>>({
    char1: null,
    char2: null,
    char3: null,
  });
  const [bgLoaded, setBgLoaded] = useState(false);
  const [introActive, setIntroActive] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [uvReveal, setUvReveal] = useState<Record<string, number>>({});
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const uvAnimRefs = useRef<Record<string, number>>({});

  const FLASHLIGHT_RADIUS = 120;

  const viewedSceneComics = useGameStore((s) => s.viewedSceneComics);
  const markSceneComicViewed = useGameStore((s) => s.markSceneComicViewed);
  const glitchedReactors = useGameStore(s => s.glitchedReactors);
  const { handleClick } = useHotspotAction(onOpenMaze, onOpenPodLogin);

  // Helper subView — gunakan effectiveCharacter (locked in multiplayer)
  const activeSubChar = effectiveCharacter;
  const subView = subViewsState[activeSubChar] ?? null;
  const setSubView = (view: string | null) => {
    setSubViewsState((prev) => ({ ...prev, [activeSubChar]: view }));
  };

  // === DERIVED DATA ===
  // Untuk gameplay pakai dari store (biar data API bisa override)
  const storeLevel7 = useGameStore((s) => s.levels.find((l) => l.id === 'level_7'));
  const level = (storeLevel7 && storeLevel7.scenes && storeLevel7.scenes.length > 0) ? storeLevel7 : (LEVELS.find((l) => l.id === 'level_7') ?? storeLevel7);
  
  // Khusus untuk comic data, selalu pakai LEVELS static agar fresh saat dev
  const levelStatic = (storeLevel7 && storeLevel7.scenes && storeLevel7.scenes.length > 0) ? storeLevel7 : LEVELS.find((l) => l.id === 'level_7');

  console.log('[Level Source]', {
    fromStore: !!levels.find((l) => l.id === 'level_7'),
    sceneComicPanels: level?.scenes.find(s => s.id === 'scene7_4')?.sceneComic?.panels,
  });
  const scene: Scene | undefined = level?.scenes.find((s) => s.id === currentSceneId);

  const layerOf = (ch: CharacterId): any =>
    ch === 'char1'
      ? scene?.char1Layer
      : ch === 'char2'
        ? scene?.char2Layer
        : (scene as any)?.char3Layer;

  // Layer POV karakter aktif. Kalau scene ini tidak punya layer untuk karakter
  // itu (mis. Katsuragi di scene 1-3 yang hanya punya POV Kayshi & Vania),
  // pakai layer karakter lain supaya scene tetap bisa dimainkan — bukan hanya
  // background tanpa hotspot.
  const layer =
    layerOf(effectiveCharacter) ??
    layerOf('char1') ??
    layerOf('char2') ??
    (scene as any)?.char3Layer;

  const subViewMap = effectiveCharacter === 'char1'
    ? (scene as any)?.char1SubViews
    : effectiveCharacter === 'char2'
      ? (scene as any)?.char2SubViews
      : (scene as any)?.char3SubViews;

  const activeView = subView && subViewMap?.[subView] ? subViewMap[subView] : layer;
  const isStorageSubView = effectiveCharacter === 'char2' && subView === 'storage_room';

  const backgroundOverride = currentSceneId ? sceneBackgroundOverrides[currentSceneId] : undefined;
  const bg = activeView
    ? backgroundOverride ?? (effectiveCharacter === 'char2' && xVisionActive && !isStorageSubView && activeView.backgroundImageXVision
        ? activeView.backgroundImageXVision
        : activeView.backgroundImage)
    : scene?.backgroundImage ?? '';

  const uvBg = isStorageSubView
    ? (activeView?.backgroundImageXVision ?? '')
    : (activeView?.backgroundImageXVision ?? '');

  const isUvOverlayActive = uvFlashlightActive && (effectiveCharacter === 'char2' || effectiveCharacter === 'char3');
  const hotspots: Hotspot[] = activeView ? activeView.hotspots : (scene?.hotspots ?? []);

  // Comic data — selalu fresh dari level static/dev data
  const currentComicData = (() => {
    if (!activeComicId) return null;
    const rootComics = (levelStatic as any)?.sceneComics as Record<string, any> | undefined;
    return rootComics?.[activeComicId] ?? null;
  })();

  const visibleHotspots = hotspots.filter((h) => {
    if (controlRoomHacked && (h.id === 'hs_main_monitor' || h.id === 'hs_main_monitor_locked' || h.id === 'hs_use_hacking_device')) {
      return false;
    }
    if (h.id === 'hs_main_monitor_locked') {
      const hasHackDevice = inventory.some((i: Item) => i.id === 'hacking_device');
      if (hasHackDevice) return false;
    }
    if (h.visible?.requiresCharacter && h.visible.requiresCharacter !== effectiveCharacter) return false;
    if (h.visible?.requiresXVision && !xVisionActive) return false;
    if (h.visible?.hideAfterUsed && usedHotspots.includes(h.id)) return false;
    // Treasure yang sudah didapat hilang dari POV semua player
    if ((h.action as any)?.type === 'collect_treasure' && useGameStore.getState().foundTreasures.includes((h.action as any).treasureId)) return false;
    if (h.visible?.requiresItem && !inventory.find((i: Item) => i.id === h.visible?.requiresItem)) return false;
    if (h.visible?.requiresSolved && !useGameStore.getState().solvedPuzzles.includes(h.visible.requiresSolved)) return false;
    return true;
  });

  // === SINGLE useEffect untuk reset + comic trigger ===
  useEffect(() => {
    // Reset dulu setiap ganti scene
    setSubViewsState({ char1: null, char2: null, char3: null });
    setActiveComicId(null);

    if (!currentSceneId) return;
    if (viewedSceneComics.includes(currentSceneId)) return;

    const rootComics = (levelStatic as any)?.sceneComics as Record<string, any> | undefined;
    const rootComic = rootComics?.[currentSceneId];
    // root level sceneComics (scene 5, dll)
    if (rootComic?.trigger === 'on_enter') {
      setActiveComicId(currentSceneId);
    }
  }, [currentSceneId, levelStatic, viewedSceneComics]);

  // === useEffect auto-switch karakter ===
  useEffect(() => {
    const store = useGameStore.getState();
    const lvl = levels.find((l) => l.id === 'level_7') ?? LEVELS.find((l) => l.id === 'level_7');

    // Scene 5: karakter sudah dipilih lewat CharacterSelectModal setelah pod
    // dibebaskan. Kalau belum ada pilihan (mis. masuk langsung), tetap pakai
    // karakter lobby supaya tidak jatuh ke state kosong.
    if (currentSceneId === 'scene7_5') {
      const targetChar = store.playerCharacter
        ? (store.scene5Character ?? store.playerCharacter)
        : (store.releasedCharacter ?? 'char1');
      store.setActiveCharacter(targetChar as CharacterId);

      const hackingDevice = lvl?.items?.find((item) => item.id === 'hacking_device');
      if (hackingDevice && !store.char3Inventory.some((item) => item.id === 'hacking_device')) {
        store.addToChar3Inventory(hackingDevice);
      }

      if (targetChar && targetChar !== 'char3') {
        const inv = targetChar === 'char1' ? store.char1Inventory : store.char2Inventory;
        if (!inv.some((i: any) => i.id === 'item_uv_flashlight')) {
          const uvItem = {
            id: 'item_uv_flashlight',
            name: 'UV Flashlight',
            description: 'Senter UV untuk melihat objek tersembunyi',
            icon: '🔦',
            image: '/objects/flashlight.png',
          };
          targetChar === 'char1' ? store.addToChar1Inventory(uvItem) : store.addToChar2Inventory(uvItem);
        }
      }
      return;
    }

    if (currentSceneId === 'scene7_4') {
      const hackingDeviceUpgraded = lvl?.items?.find((item) => item.id === 'hacking_device_upgraded');
      if (hackingDeviceUpgraded && !store.char3Inventory.some((item) => item.id === 'hacking_device_upgraded')) {
        store.addToChar3Inventory(hackingDeviceUpgraded);
      }
      // Karakter untuk scene 4 diambil dari data level (autoSwitchChar), bukan
      // hardcode 'char3'. Kalau tidak ada, fallback ke char3 (legacy).
      const autoChar = (lvl?.scenes?.find((s) => s.id === currentSceneId) as any)?.autoSwitchChar;
      if (autoChar && store.playerCharacter) {
        // multiplayer: tetap char3 (shared) — autoSwitchChar hanya single player
      } else if (autoChar && !store.playerCharacter) {
        store.setActiveCharacter(autoChar as CharacterId);
      }
    }

    // Single-player only: auto-switch logic dari data level (autoSwitchChar).
    if (!store.playerCharacter) {
      const sc = lvl?.scenes.find((s) => s.id === currentSceneId);
      const autoChar = (sc as any)?.autoSwitchChar;
      if (autoChar) {
        store.setActiveCharacter(autoChar);
      } else if (store.activeCharacter === 'char3') {
        store.setActiveCharacter('char1');
      }
    } else {
      // Multiplayer: karakter diambil dari resolveLevel7Character (data-driven).
      const wanted = resolveLevel7Character({
        currentSceneId,
        playerCharacter: store.playerCharacter,
        scene5Character: store.scene5Character,
        activeCharacter: store.activeCharacter,
      });
      if (wanted !== store.activeCharacter) {
        store.setActiveCharacter(wanted);
      }
    }
  }, [currentSceneId, playerCharacter, scene5Character]);

  // === useEffect bgLoaded reset ===
  useEffect(() => {
    setBgLoaded(false);
    setIntroActive(false);
  }, [currentSceneId, subView]);

  // === useEffect cleanup RAFs ===
  useEffect(() => {
    return () => {
      Object.values(uvAnimRefs.current).forEach((id) => cancelAnimationFrame(id));
      uvAnimRefs.current = {};
    };
  }, []);

  // === EVENT HANDLERS ===
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
  };

  const animateTo = (id: string, from: number, to: number) => {
    cancelAnimationFrame(uvAnimRefs.current[id] ?? 0);
    let current = from;
    const step = () => {
      current += (to - current) * 0.28;
      setUvReveal((s) => ({ ...s, [id]: current }));
      if (Math.abs(current - to) > 0.5) {
        uvAnimRefs.current[id] = requestAnimationFrame(step);
      } else {
        setUvReveal((s) => ({ ...s, [id]: to }));
        cancelAnimationFrame(uvAnimRefs.current[id] ?? 0);
        delete uvAnimRefs.current[id];
      }
    };
    uvAnimRefs.current[id] = requestAnimationFrame(step);
  };

  const handleHotspotClick = (hotspot: Hotspot) => {
    const action = hotspot.action as any;
    const targetGlitchId =
      action.type === 'open_reactor' ? 'reactor' :
      action.type === 'open_cooling' ? 'cooling' :
      action.type === 'open_power' ? 'power' : null;

    if (targetGlitchId && glitchedReactors.includes(targetGlitchId)) {
      useGameStore.getState().showNotification(
        effectiveCharacter === 'char3'
          ? 'Reaktor sedang glitch — Katsuragi harus memperbaikinya dengan Hacking Device+.'
          : 'Reaktor sedang glitch — harus diperbaiki Katsuragi dengan Hacking Device+.',
        'error'
      );
    }

    if (action.type === 'collect_treasure' && action.treasureId) {
      useGameStore.getState().findTreasure(action.treasureId);
      return;
    }
    if (action.type === 'enter_subview') {
      setSubView(action.subView);
      return;
    }
    if (action.type === 'open_maze') { onOpenMaze?.(); return; }
    if (action.type === 'exit_subview') {
      setSubView(null);
      return;
    }

    // Intercept navigation to scene7_5 in multiplayer — show character select modal
    if (action.type === 'go_to_scene' && action.sceneId === 'scene7_5' && isMultiplayer) {
      setShowCharacterSelect(true);
      return;
    }

    handleClick(hotspot);
  };

  const handleBgLoad = () => {
    setBgLoaded(true);
    setTimeout(() => {
      setIntroActive(true);
      setTimeout(() => setIntroActive(false), 2200);
    }, 120);
  };

  // === RENDER COMIC ===
  if (currentComicData) {
    return (
      <ComicScene
        src={currentComicData.src}
        panels={currentComicData.panels}
        onDone={() => {
          if (currentSceneId) markSceneComicViewed(currentSceneId);
          setActiveComicId(null);
        }}
        isLastPage
      />
    );
  }

  // === RENDER SCENE ===
  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, cursor: (uvFlashlightActive && effectiveCharacter === 'char2') ? 'crosshair' : 'default' }}
      onMouseMove={handleMouseMove}
    >
      {/* Background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          opacity: bgLoaded ? 1 : 0,
        }}
      />
      <img key={bg} src={bg} style={{ display: 'none' }} onLoad={handleBgLoad} alt="" />

      {/* UV Flashlight overlay */}
      {isUvOverlayActive && uvBg && (mousePos.x > 0 || mousePos.y > 0) && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${uvBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          WebkitMaskImage: `radial-gradient(circle ${FLASHLIGHT_RADIUS}px at ${mousePos.x}px ${mousePos.y}px, black 0%, black 60%, transparent 100%)`,
          maskImage: `radial-gradient(circle ${FLASHLIGHT_RADIUS}px at ${mousePos.x}px ${mousePos.y}px, black 0%, black 60%, transparent 100%)`,
          pointerEvents: 'none',
          zIndex: 4,
          filter: 'saturate(1.8) brightness(0.7)',
        }} />
      )}

      {/* Glow ring */}
      {uvFlashlightActive && (
        <div style={{
          position: 'absolute',
          left: mousePos.x - FLASHLIGHT_RADIUS,
          top: mousePos.y - FLASHLIGHT_RADIUS,
          width: FLASHLIGHT_RADIUS * 2,
          height: FLASHLIGHT_RADIUS * 2,
          borderRadius: '50%',
          border: '3px solid rgba(179, 0, 255, 0.11)',
          boxShadow: '0 0 20px rgba(179, 0, 255, 0), inset 0 0 20px rgba(179, 0, 255, 0)',
          pointerEvents: 'none',
          zIndex: 5,
        }} />
      )}

      {/* UV object images */}
      {isUvOverlayActive && (mousePos.x > 0 || mousePos.y > 0) && hotspots
        .filter((h) => (h as any).uvImage)
        .map((h) => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (!rect) return null;

          const hx = (h.x / 100) * rect.width;
          const hy = (h.y / 100) * rect.height;
          const hw = (h.width / 100) * rect.width;
          const hh = (h.height / 100) * rect.height;
          const centerX = hx + hw / 2;
          const centerY = hy + hh / 2;

          const dist = Math.hypot(mousePos.x - centerX, mousePos.y - centerY);
          const boundingRadius = Math.hypot(hw / 2, hh / 2);
          const isLit = dist <= FLASHLIGHT_RADIUS + boundingRadius;
          const targetRadius = FLASHLIGHT_RADIUS + boundingRadius;
          const currentReveal = uvReveal[h.id] ?? 0;

          if (isLit && currentReveal < targetRadius) animateTo(h.id, currentReveal || 0, targetRadius);
          if (!isLit && currentReveal > 0) animateTo(h.id, currentReveal, 0);

          if (h.visible?.requiresCharacter && h.visible.requiresCharacter !== effectiveCharacter) return null;
          if (h.visible?.requiresXVision && !xVisionActive) return null;
          if (h.visible?.hideAfterUsed && usedHotspots.includes(h.id)) return null;
          if (h.visible?.requiresItem && !inventory.find((i: Item) => i.id === h.visible?.requiresItem)) return null;
          if (h.visible?.requiresSolved && !useGameStore.getState().solvedPuzzles.includes(h.visible.requiresSolved)) return null;

          const revealRadius = uvReveal[h.id] ?? 0;
          if (revealRadius < 2) return null;

          const localX = Math.max(0, Math.min(hw, mousePos.x - hx));
          const localY = Math.max(0, Math.min(hh, mousePos.y - hy));
          const leftDist = localX;
          const rightDist = hw - localX;
          const topDist = localY;
          const bottomDist = hh - localY;
          const minSide = Math.min(leftDist, rightDist, topDist, bottomDist);
          const side = minSide === leftDist ? 'left' : minSide === rightDist ? 'right' : minSide === topDist ? 'top' : 'bottom';

          const revealPercent = Math.max(0, Math.min(1, revealRadius / targetRadius));
          const p = Math.round(revealPercent * 100);
          let clipPath = '';
          if (side === 'left') clipPath = `polygon(0 0, ${p}% 0, ${p}% 100%, 0 100%)`;
          else if (side === 'right') clipPath = `polygon(${100 - p}% 0, 100% 0, 100% 100%, ${100 - p}% 100%)`;
          else if (side === 'top') clipPath = `polygon(0 0, 100% 0, 100% ${p}%, 0 ${p}%)`;
          else clipPath = `polygon(0 ${100 - p}%, 100% ${100 - p}%, 100% 100%, 0 100%)`;

          return (
            <div
              key={h.id + '_uv'}
              onClick={() => { handleHotspotClick(h); }}
              style={{
                position: 'absolute',
                left: `${h.x}%`,
                top: `${h.y}%`,
                width: `${h.width}%`,
                height: `${h.height}%`,
                backgroundImage: `url(${(h as any).uvImage})`,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                clipPath,
                WebkitClipPath: clipPath,
                pointerEvents: revealPercent >= 0.12 ? 'auto' : 'none',
                zIndex: 8,
                cursor: h.cursor ?? 'pointer',
                transition: 'clip-path 120ms linear',
              }}
            />
          );
        })}

      {/* Intro Glow */}
      {introActive && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.18) 0%, transparent 70%)',
          animation: 'introGlow 2s ease-out forwards',
          pointerEvents: 'none', zIndex: 5,
        }} />
      )}

      {/* Hotspots */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {visibleHotspots.map((hotspot, idx) => {
          const isHighlighted = false;
          const actionType = (hotspot.action as any)?.type;
          const targetGlitchId =
            actionType === 'open_reactor' ? 'reactor' :
            actionType === 'open_cooling' ? 'cooling' :
            actionType === 'open_power' ? 'power' : null;
          const isGlitchedHotspot = targetGlitchId ? glitchedReactors.includes(targetGlitchId) : false;

          return (
            <HotspotButton
              key={hotspot.id}
              hotspot={hotspot}
              onClick={() => handleHotspotClick(hotspot)}
              introActive={introActive}
              isHighlighted={isHighlighted}
              index={idx}
              isGlitched={isGlitchedHotspot && !!(hotspot as any).glitchImage}
            />
          );
        })}
      </div>

      {effectiveCharacter === 'char1' && subView === 'control_room' && <MonitorOverlay />}

      {/* Tombol kembali dari sub-view */}
      {subView && (
        <button
          onClick={() => setSubView(null)}
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            zIndex: 35,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            background: 'rgba(10, 15, 30, 0.85)',
            border: '1.5px solid rgba(0, 200, 255, 0.7)',
            borderRadius: 6,
            color: '#00c8ff',
            fontFamily: '"Courier New", monospace',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 2,
            cursor: 'pointer',
            boxShadow: '0 0 16px rgba(0, 200, 255, 0.3)',
            backdropFilter: 'blur(6px)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 200, 255, 0.25)';
            e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 200, 255, 0.7)';
            e.currentTarget.style.transform = 'scale(1.04)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(10, 15, 30, 0.85)';
            e.currentTarget.style.boxShadow = '0 0 16px rgba(0, 200, 255, 0.3)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <span style={{ fontSize: 14 }}>◀</span> KEMBALI KE LORONG UTAMA
        </button>
      )}

      {/* Multiplayer character indicator */}
      {isMultiplayer && (
        <div style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          background: 'rgba(10, 15, 30, 0.85)',
          border: '1.5px solid rgba(0, 200, 255, 0.6)',
          borderRadius: 6,
          fontFamily: '"Courier New", monospace',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.5,
          color: '#00c8ff',
          boxShadow: '0 0 12px rgba(0, 200, 255, 0.25)',
          backdropFilter: 'blur(6px)',
        }}>
          <span style={{ fontSize: 14 }}>👤</span>
          <span>Kontrol: {effectiveCharacter === 'char1' ? 'ETHAN' : effectiveCharacter === 'char2' ? 'Vania' : 'Katsuragi'}</span>
        </div>
      )}

      {/* Character selection modal sebelum masuk scene7_5 */}
      {showCharacterSelect && (
        <CharacterSelectModal
          onSelect={async (char) => {
            // Satu action untuk semua jalur: simpan lokal, siarkan ke server,
            // carry item Katsuragi bila perlu, lalu pindah scene.
            // Tunggu balasan server: kalau karakter sudah dipakai pemain lain,
            // server menolak (409) dan karakter TIDAK berganti.
            const ok = await useGameStore.getState().chooseScene5Character(char);
            if (!ok) return;
            setShowCharacterSelect(false);
            useGameStore.getState().goToScene('scene7_5');
          }}
          onClose={() => setShowCharacterSelect(false)}
        />
      )}

      <style>{`
        @keyframes introGlow {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// === HOTSPOT BUTTON COMPONENT ===
function HotspotButton({ hotspot, onClick, introActive, isHighlighted, index, isGlitched }: {
  hotspot: Hotspot;
  onClick: () => void;
  introActive: boolean;
  isHighlighted?: boolean;
  index: number;
  isGlitched?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const handleClick = () => {
    if (pressed) return;
    setPressed(true);
    setTimeout(() => {
      setPressed(false);
      onClick();
    }, 400);
  };

  return (
    <button
      style={{
        position: 'absolute',
        left: `${hotspot.x}%`,
        top: `${hotspot.y}%`,
        width: `${hotspot.width}%`,
        height: `${hotspot.height}%`,
        cursor: hotspot.cursor ?? 'pointer',
        appearance: 'none',
        WebkitAppearance: 'none',
        outline: 'none',
        background: isHighlighted && introActive ? 'rgba(0, 200, 255, 0.15)' : 'transparent',
        border: isHighlighted ? '2px dashed rgba(0, 200, 255, 0.8)' : 'none',
        borderRadius: 8,
        boxShadow: 'none',
        padding: 0,
        zIndex: hovered ? 10 : isHighlighted ? 5 : 1,
        animationName: isHighlighted && introActive ? 'highlightPulse' : undefined,
        animationDuration: '2.5s',
        animationIterationCount: 'infinite',
      }}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
    >
      {hotspot.image && !(hotspot as any).uvImage ? (
        <img
          src={isGlitched && (hotspot as any).glitchImage
            ? (hotspot as any).glitchImage
            : hotspot.image}
          style={{
            width: '100%', height: '100%', objectFit: 'contain',
            mixBlendMode: 'screen',
            transition: 'transform 0.25s ease, filter 0.25s ease',
            transform: pressed
              ? 'scale(0.94) translateY(3px)'
              : hovered
                ? 'scale(1.06)'
                : 'scale(1)',
            filter: pressed
              ? 'brightness(1.6) drop-shadow(0 0 18px rgba(255,255,255,0.9))'
              : hovered || isHighlighted
                ? 'brightness(1.35) drop-shadow(0 0 16px rgba(200,184,154,0.95))'
                : 'none',
            animationName: introActive ? 'introGlowImage' : 'none',
            animationDuration: '2s',
            animationTimingFunction: 'ease-in-out',
            animationFillMode: 'forwards',
            animationDelay: introActive ? `${index * 80}ms` : '0ms',
          }}
          draggable={false}
          alt=""
        />
      ) : null}

      <style>{`
        @keyframes introGlowImage {
          0%   { filter: drop-shadow(0 0 0px rgba(200,184,154,0)) brightness(1); }
          25%  { filter: drop-shadow(0 0 16px rgba(200,184,154,0.95)) brightness(1.18); }
          65%  { filter: drop-shadow(0 0 16px rgba(200,184,154,0.95)) brightness(1.18); }
          100% { filter: drop-shadow(0 0 0px rgba(200,184,154,0)) brightness(1); }
        }
        @keyframes highlightPulse {
          0%   { box-shadow: 0 0 0 0 rgba(0, 200, 255, 0.7); transform: scale(1); }
          50%  { box-shadow: 0 0 25px 8px rgba(0, 200, 255, 0.9); transform: scale(1.04); }
          100% { box-shadow: 0 0 0 0 rgba(0, 200, 255, 0); transform: scale(1); }
        }
        @keyframes fadeInLabel {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </button>
  );
}

export { Level7Scene as GameScene };