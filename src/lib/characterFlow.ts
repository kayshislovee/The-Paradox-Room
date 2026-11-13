/**
 * Alur karakter level 7 multiplayer — satu-satunya tempat yang memutuskan
 * "karakter siapa yang sedang dikendalikan di scene ini".
 *
 * Sebelumnya keputusan ini tersebar di tiga tempat dengan tiga definisi berbeda:
 *   - Level7scene.effectiveCharacter  (layer & hotspot)
 *   - Level7SidePanel.effectiveChar   (inventory di panel)
 *   - store.activeCharacter           (dipakai useHotspotAction & CraftingModal)
 * Ketiganya hanya sepakat di single-player scene 1–3, sehingga di scene 4/5
 * inventory yang dibaca != inventory yang ditulis.
 */

import type { CharacterId } from '../types/game.types';

/** Scene 4: kedua player dipaksa memakai satu karakter yang sama. */
export const LEVEL7_SHARED_SCENE = 'scene7_4';
/** Scene 5: karakter dipilih sendiri setelah pod membebaskan salah satu orang. */
export const LEVEL7_REACTOR_SCENE = 'scene7_5';

export interface CharacterFlowInput {
  currentSceneId: string | null;
  /** Karakter yang dipilih di lobby; null = single player. */
  playerCharacter: string | null;
  /** Karakter yang dipilih sendiri untuk scene 5. */
  scene5Character: string | null;
  activeCharacter: CharacterId;
  /** autoSwitchChar dari data level (dinamis dari DB). */
  autoSwitchChar?: string | null;
}

export function isLevel7Multiplayer(input: Pick<CharacterFlowInput, 'playerCharacter'>): boolean {
  return !!input.playerCharacter;
}

/**
 * Karakter aktif untuk scene saat ini.
 *
 * Multiplayer:
 *   scene 4 (shared) → autoSwitchChar dari data (default 'char3' = Katsuragi)
 *   scene 5 → karakter yang dipilih setelah pod dibebaskan
 *   scene 1–3 → karakter pilihan sendiri di lobby (terkunci)
 * Single player → autoSwitchChar dari data (default activeCharacter).
 */
export function resolveLevel7Character(input: CharacterFlowInput): CharacterId {
  if (!input.playerCharacter) {
    return (input.autoSwitchChar as CharacterId) ?? input.activeCharacter;
  }

  if (input.currentSceneId === LEVEL7_SHARED_SCENE) {
    return (input.autoSwitchChar as CharacterId) ?? 'char3';
  }

  if (input.currentSceneId === LEVEL7_REACTOR_SCENE && input.scene5Character) {
    return input.scene5Character as CharacterId;
  }

  return input.playerCharacter as CharacterId;
}

/**
 * Apakah tombol ganti karakter boleh dipakai.
 * Di multiplayer selalu terkunci: karakter ditentukan lobby / scene, bukan player.
 */
export function canSwapCharacter(input: CharacterFlowInput): boolean {
  if (input.playerCharacter) return false;
  if (input.currentSceneId === LEVEL7_SHARED_SCENE) return false;
  if (input.currentSceneId === LEVEL7_REACTOR_SCENE) return false;
  return true;
}

/** Inventory milik karakter tertentu. */
export function pickInventory<T>(
  character: CharacterId,
  inventories: { char1: T[]; char2: T[]; char3: T[] }
): T[] {
  if (character === 'char1') return inventories.char1;
  if (character === 'char2') return inventories.char2;
  return inventories.char3;
}

/**
 * Karakter yang "dipakai" sebagai substitute di scene 5 single player:
 * kalau sedang Katsuragi, kembali ke orang yang dibebaskan.
 */
export function fallbackCharacter(
  current: CharacterId,
  releasedCharacter: 'char1' | 'char2' | null
): CharacterId {
  if (current === 'char3') return (releasedCharacter ?? 'char1') as CharacterId;
  return 'char3';
}