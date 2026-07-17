import { useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { LEVELS } from '../data/levels';
import type { Hotspot } from '../types/game.types';

export function useHotspotAction() {
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
  } = useGameStore();

  const handleClick = useCallback(
    (hotspot: Hotspot) => {
      if (hotspot.visible?.hideAfterUsed && isHotspotUsed(hotspot.id)) return;

      const level = LEVELS.find((l) => l.id === currentLevelId);
      if (!level) return;

      const { action } = hotspot;

      switch (action.type) {
        case 'give_item': {
          const item = level.items.find((i) => i.id === action.itemId);
          if (item) {
            addToInventory(item);
            markHotspotUsed(hotspot.id);
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
  openZoom(action.zoomImage, action.label);
  if (!isHotspotUsed(hotspot.id)) {
    addClue({
      id: `clue_zoom_${hotspot.id}`,
      type: 'text',
      content: 'Melihat Komputer',
      hint: `Lihatlah dengan teliti layar komputer ini, mungkin ada petunjuk di dalamnya.`,
    });
     // ← HAPUS baris ini
  }
  break;
}

case 'open_puzzle': {
  openPuzzle(action.puzzleId);
  if (!isHotspotUsed(hotspot.id)) {
    addClue({
      id: `clue_puzzle_${hotspot.id}`,
      type: 'text',
      content: 'Panel Input Ditemukan',
      hint: `Masukkan kode yang benar untuk membuka panel ini`,
    });
 // ← HAPUS baris ini
  }
  break;
}

case 'open_note': {
  openNote(action.image);
  if (!isHotspotUsed(hotspot.id)) {
    addClue({
      id: `clue_note_${hotspot.id}`,
      type: 'text',
      content: 'Catatan dibaca',
      hint: `Kamu membaca sebuah catatan`,
    });
     // ← HAPUS baris ini
  }
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
              `Kamu butuh item "${item?.name ?? '???'}" untuk ini.`,
              'error'
            );
          }
          break;
        }

        case 'message': {
          showNotification(action.text, 'info');
          break;
        }
      }
    },
    [currentLevelId, addToInventory, addClue, openPuzzle, openZoom, openNote,
     showNotification, hasItem, markHotspotUsed, isHotspotUsed]
  );

  return { handleClick };
}