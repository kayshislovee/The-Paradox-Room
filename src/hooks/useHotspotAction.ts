import { useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { LEVELS } from '../data/levels';
import type { Hotspot } from '../types/game.types';
import { useSFX } from './useSFX';

export function useHotspotAction(
  onOpenMaze?: () => void,
  onOpenPodLogin?: () => void
) {
  const sfx = useSFX();
  const {
    currentLevelId,
    addToInventory,
    addClue,
    openPuzzle,
    openZoom,
    openNote,
    showNotification,
    hasItem,
    markHotspotUsed,
    isHotspotUsed,
    triggerSceneDialog,
  } = useGameStore();

  // Sinkronisasi item/hotspot sudah ditangani action store
  // (addToInventory / markHotspotUsed), jadi tidak perlu dispatch ulang di sini.
  const handleClick = useCallback(
    (hotspot: Hotspot) => {
      if (hotspot.visible?.hideAfterUsed && isHotspotUsed(hotspot.id)) return;

      const level = LEVELS.find((l) => l.id === currentLevelId);
      if (!level) return;

      const { action } = hotspot;

      switch (action.type) {
        case 'give_item':
        case 'give_item_and_dialog': {
          const item = level.items.find((i) => i.id === action.itemId);
          if (!item) {
            showNotification(`Item "${action.itemId}" tidak ditemukan.`, 'error');
            break;
          }

          if (currentLevelId === 'level_7') {
            const store = useGameStore.getState();
            if (store.activeCharacter === 'char1') store.addToChar1Inventory(item);
            else if (store.activeCharacter === 'char2') store.addToChar2Inventory(item);
            else store.addToChar3Inventory(item);
          } else {
            addToInventory(item);
          }
          markHotspotUsed(hotspot.id);

          if (action.type === 'give_item_and_dialog') {
            triggerSceneDialog(action.dialogId);
          }
          break;
        }

        case 'give_clue': {
          const clue = level.clues.find((c) => c.id === action.clueId);
          if (clue) {
            addClue(clue);
            markHotspotUsed(hotspot.id);
          }
          break;
        }

        case 'open_zoom': {
          sfx.playClick();
          openZoom(action.zoomImage, action.label);
          break;
        }

        case 'open_puzzle': {
          sfx.playClick();

          if (
            action.puzzleId === 'puzzle_chest_s4' &&
            useGameStore.getState().isPuzzleSolved(action.puzzleId)
          ) {
            useGameStore.getState().setChestOpen('chest_scene4');
            break;
          }

          // ── Khusus DualPuzzle level 7 — butuh hacking_device ──────────
          if (action.puzzleId === 'puzzle_dual_lock') {
            // Catatan: Pastikan 'hacking_device' ini sama persis dengan ID item di level7.ts
            // Jika di level7.ts ID-nya 'item_2', ganti string di bawah menjadi 'item_2'
            if (!hasItem('hacking_device')) {
              showNotification(
                'Kamu membutuhkan Hacking Device untuk mengakses sistem ini!',
                'error'
              );
              return;
            }
          }

          openPuzzle(action.puzzleId);
          break;
        }

        case 'open_note': {
          sfx.playNotes();
          // Support translatedImage untuk level 7
          openNote(action.image, (action as any).translatedImage);
          break;
        }

        case 'use_item': {
          if (hasItem(action.requiredItemId)) {
            showNotification(action.resultMessage, 'success');
            markHotspotUsed(hotspot.id);
            if (action.resultClueId) {
              const clue = level.clues.find((c) => c.id === action.resultClueId);
              if (clue) addClue(clue);
            }
          } else {
            const item = level.items.find((i) => i.id === action.requiredItemId);
            showNotification(
              // Diperbaiki: penulisan tanda kutip penutup pada string literal
              `Kamu butuh item "${item?.name ?? '???'}" untuk ini.`,
              'error'
            );
          }
          break;
        }
case 'open_hacking_minigame':
  if (hotspot.id === 'hs_pod_control') {
    if (useGameStore.getState().isPuzzleSolved('puzzle_pod_control')) {
      showNotification('Pod sudah dibebaskan.', 'info');
      break;
    }
    if (!hasItem('hacking_device_upgraded')) {
      showNotification('Kamu membutuhkan Hacking Device+ untuk mengakses Pod!', 'error');
      break;
    }
    if (useGameStore.getState().hackingDone) {
      if (onOpenPodLogin) onOpenPodLogin();
      else showNotification('Login Pod tidak tersedia saat ini.', 'error');
      break;
    }
    onOpenMaze?.(); // ← ganti setMazeOpen
    break;
  }
  if (!hasItem('hacking_device')) {
    showNotification('Kamu membutuhkan Hacking Device untuk meretas mesin ini.', 'error');
    break;
  }
  useGameStore.getState().setHackingMinigameOpen(true);
  break;
        case 'message': {
          showNotification(action.text, 'info');
          break;
        }
        case 'use_flashlight': {
  const { uvFlashlightActive, setUvFlashlightActive } = useGameStore.getState();
  setUvFlashlightActive(!uvFlashlightActive);
  showNotification(
    uvFlashlightActive ? 'UV Flashlight dimatikan' : 'UV Flashlight dinyalakan',
    'info'
  );
  break;
}
case 'go_to_scene': {
  const { goToScene } = useGameStore.getState();
  goToScene(action.sceneId);
  break;
}

case 'open_desktop':
  useGameStore.getState().setDesktopOpen(true);
  break;

  case 'open_pod_control': {
    const store = useGameStore.getState();
    if (store.isPuzzleSolved('puzzle_pod_control')) {
      showNotification('Pod sudah dibebaskan.', 'info');
      break;
    }

    if (!hasItem('hacking_device_upgraded')) {
      showNotification('Kamu membutuhkan Hacking Device+ untuk mengakses Pod!', 'error');
      break;
    }
    if (onOpenPodLogin) onOpenPodLogin();
    else showNotification('Login Pod tidak tersedia saat ini.', 'error');
    break;
  }
  case 'open_chest':
  useGameStore.getState().setChestOpen(action.chestId);
  break;
  case 'open_reactor':
  useGameStore.getState().setReactorOpen(true);
  break;
  case 'open_cooling':
  useGameStore.getState().setCoolingOpen(true);
  break;
case 'open_power':
  useGameStore.getState().setPowerOpen(true);
  break;
  case 'open_puzzle_and_dialog': {
    // Open puzzle and trigger dialog
    openPuzzle(action.puzzleId);
    triggerSceneDialog(action.dialogId);
    break;
  }
  case 'open_zoom_and_dialog': {
    sfx.playClick();
    openZoom(action.zoomImage, action.label);
    triggerSceneDialog(action.dialogId);
    break;
  }
  case 'open_note_and_dialog': {
    sfx.playNotes();
    openNote(action.image, (action as any).translatedImage);
    triggerSceneDialog(action.dialogId);
    break;
  }
  case 'go_to_scene_and_dialog': {
    const { goToScene } = useGameStore.getState();
    goToScene(action.sceneId);
    triggerSceneDialog(action.dialogId);
    break;
  }
  case 'open_hacking_minigame_and_dialog': {
    if (!hasItem('hacking_device')) {
      showNotification('Kamu membutuhkan Hacking Device untuk meretas mesin ini.', 'error');
      break;
    }
    useGameStore.getState().setHackingMinigameOpen(true);
    triggerSceneDialog(action.dialogId);
    break;
  }
  case 'open_desktop_and_dialog': {
    useGameStore.getState().setDesktopOpen(true);
    triggerSceneDialog(action.dialogId);
    break;
  }
  case 'enter_subview_and_dialog': {
    // The enter_subview is handled elsewhere, but we can trigger dialog here
    triggerSceneDialog(action.dialogId);
    break;
  }
  case 'trigger_scene_dialog': {
    triggerSceneDialog(action.dialogId);
    break;
  }
        }
    },
    [
      currentLevelId,
      addToInventory,
      addClue,
      openPuzzle,
      openZoom,
      openNote,
      showNotification,
      hasItem,
      markHotspotUsed,
      isHotspotUsed,
      triggerSceneDialog,
      sfx, // Diperbaiki: Memasukkan sfx ke dalam list dependencies
      onOpenMaze,
      onOpenPodLogin,
    ]
  );

  return { handleClick };
}
