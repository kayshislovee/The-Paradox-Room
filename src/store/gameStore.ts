import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  GameState,
  GameScreen,
  Item,
  Clue,
  SettingsState,
  Level,
  Achievement,
  Treasure,
  DialogLine,
} from '../types/game.types';
import { LEVELS as FALLBACK_LEVELS } from '../data/levels';
import {
  fetchLevels,
  fetchLevel,
  submitScore,
  fetchHintConfig,
  fetchProgress,
  saveProgress,
  reportTreasureFound,
  fetchMyAchievements,
  fetchMyTreasures,
} from '../hooks/useapi';
import type { CharacterId } from '../types/game.types';
import { multiplayer } from '../lib/multiplayer';
import { resolveAssetPath } from '../lib/assetPath';
import { CHEST_ITEMS } from '../components/Level7/ChestModal';
import {
  mapAchievement,
  buildLevelFromApi,
  mergeApiIntoLevel,
  mapTreasure,
} from '../lib/apiMap';

// ─── Helper sinkronisasi state bersama ────────────────────────────────────────

/** Gabung daftar lokal dengan daftar server tanpa kehilangan entri lokal. */
function union<T>(local: T[], incoming: T[]): T[] {
  const seen = new Set(local.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))));
  const extra = incoming.filter((x) => !seen.has(typeof x === 'string' ? x : JSON.stringify(x)));
  return extra.length ? [...local, ...extra] : local;
}


/**
 * Level dari store (sudah berisi data API + pelengkap lokal).
 * Data lokal HANYA dipakai kalau store belum punya level itu.
 */
function findLevel(state: GameStore, levelId: string | null | undefined): Level | undefined {
  if (!levelId) return undefined;
  return state.levels.find((l) => l.id === levelId) ?? FALLBACK_LEVELS.find((l) => l.id === levelId);
}

/**
 * Treasure yang gagal disimpan ke server (koneksi putus / server error).
 * Disimpan dulu supaya bisa dicoba lagi nanti — tidak hilang begitu saja.
 */
const pendingTreasureSaves = new Set<string>();

async function saveTreasureToServer(
  treasureId: string,
  token: string,
): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await reportTreasureFound(treasureId, token);
      return true;
    } catch (err) {
      if (attempt === 2) {
        console.warn('[gameStore] Gagal menyimpan treasure ke server:', err);
      }
      await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
    }
  }
  return false;
}

function currentLevelOf(state: GameStore): Level | undefined {
  return findLevel(state, state.currentLevelId);
}

/** Server menyimpan id item; UI butuh objek Item lengkap. */
function resolveItems(ids: string[], state: GameStore): Item[] {
  const pools: Item[][] = [];
  const current = currentLevelOf(state);
  if (current?.items) pools.push(current.items);
  for (const l of state.levels) {
    if (l.items && l.id !== current?.id) pools.push(l.items);
  }
  // Item chest tidak terdaftar di data level, tapi tetap bisa dipegang karakter.
  pools.push(CHEST_ITEMS);

  const missing = new Set(ids);
  const out: Item[] = [];
  for (const pool of pools) {
    for (const item of pool) {
      if (missing.has(item.id)) {
        out.push(item);
        missing.delete(item.id);
      }
    }
    if (missing.size === 0) break;
  }
  return out;
}

function resolveClues(ids: string[], state: GameStore): Clue[] {
  const pools: Clue[][] = [];
  const current = currentLevelOf(state);
  if (current?.clues) pools.push(current.clues);
  for (const l of state.levels) {
    if (l.clues && l.id !== current?.id) pools.push(l.clues);
  }

  const missing = new Set(ids);
  const out: Clue[] = [];
  for (const pool of pools) {
    for (const clue of pool) {
      if (missing.has(clue.id)) {
        out.push(clue);
        missing.delete(clue.id);
      }
    }
    if (missing.size === 0) break;
  }
  return out;
}

/** Gabung inventory: objek lokal menang (biar tetap punya ikon/nama terbaru). */
function mergeById(local: Item[], incoming: Item[]): Item[] {
  const have = new Set(local.map((i) => i.id));
  const extra = incoming.filter((i) => !have.has(i.id));
  return extra.length ? [...local, ...extra] : local;
}

/**
 * Inventory milik orang lain: server yang menentukan isinya, jadi item yang
 * sudah dipakai PASANGAN harus benar-benar hilang. Objek lokal dipakai kembali
 * untuk id yang sama agar ikon/nama tetap konsisten dengan data level.
 */
function replaceById(local: Item[], incoming: Item[]): Item[] {
  const localById = new Map(local.map((i) => [i.id, i]));
  return incoming.map((item) => localById.get(item.id) ?? item);
}

const UV_FLASHLIGHT: Item = {
  id: 'item_uv_flashlight',
  name: 'UV Flashlight',
  description: 'Senter UV untuk melihat hal tersembunyi',
  icon: '🔦',
  image: '/objects/flashlight.png',
};

// ─── SETTINGS STORE ──────────────────────────────────────────────────────────
interface SettingsStore extends SettingsState {
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setLanguage: (lang: 'id' | 'en') => void;
  musicMuted: boolean;
  toggleMusicMuted: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      musicVolume: 0.7,
      sfxVolume: 0.8,
      language: 'id',
      setMusicVolume: (v) => set({ musicVolume: v }),
      setSfxVolume: (v) => set({ sfxVolume: v }),
      setLanguage: (lang) => set({ language: lang }),
      musicMuted: false,
      toggleMusicMuted: () => set((s) => ({ musicMuted: !s.musicMuted })),

    }),
    { name: 'escape-room-settings' }
  )
);

// ─── GAME STORE ───────────────────────────────────────────────────────────────
interface GameStore extends GameState {
  levels: Level[];
  isLoadingLevels: boolean;
  loadLevels: () => Promise<void>;
  /**
   * Ambil detail level dari API (lengkap dengan hasil edit admin) tanpa
   * memulai level. Dipakai untuk prolog/comic sebelum gameplay dimulai.
   */
  loadLevelPreview: (levelId: string) => Promise<Level | undefined>;
  /** Level yang sudah pernah di-load DETAIL (merge API + lokal). */
  detailedLevelIds: string[];
  hintMaxTokens: number;
  hintRefillSeconds: number;
  loadHintConfig: () => Promise<void>;
  goTo: (screen: GameScreen) => void;
  startLevel: (levelId: string) => Promise<void>;
  goToScene: (sceneId: string) => void;
  addToInventory: (item: Item) => void;
  removeFromInventory: (itemId: string) => void;
  hasItem: (itemId: string) => boolean;
  addClue: (clue: Clue) => void;
  hasClue: (clueId: string) => boolean;
  solvePuzzle: (puzzleId: string) => void;
  isPuzzleSolved: (puzzleId: string) => boolean;
  markHotspotUsed: (hotspotId: string) => void;
  isHotspotUsed: (hotspotId: string) => boolean;
  openPuzzle: (puzzleId: string) => void;
  closePuzzle: () => void;
  openZoom: (image: string, label: string) => void;
  closeZoom: () => void;
  noteModal: { image: string; translatedImage?: string } | null;
  openNote: (image: string, translatedImage?: string) => void;
  closeNote: () => void;
  tickTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  showNotification: (text: string, type?: 'info' | 'success' | 'error') => void;
  clearNotification: () => void;
  completeLevel: (playerName?: string) => void;
  hintsRemaining: number;
  hintsUsed: number;
  useHint: () => string | null;
  resetHints: () => void;
  useHintToken: () => boolean;
  refillHintTokens: () => void;
  player: { id: number; username: string; email: string } | null;
  token: string | null;
  isGuest: boolean;
  setPlayer: (player: { id: number; username: string; email: string }, token: string) => void;
  setGuest: () => void;
  logout: () => void;
  syncProgress: () => Promise<void>;
  loadMyProgress: () => Promise<void>;
  foundTreasures: string[];
  /** Treasure yang baru saja dikumpulkan (untuk showcase). */
  collectedTreasure: Treasure | null;
  // Treasure yang ditemukan di sesi ini (tidak dipersist). Dipakai supaya
  // popup achievement hanya muncul kalau kedua treasure ditemukan di sesi
  // yang sama — bukan kalau satu sudah ada dari sesi sebelumnya.
  sessionFoundTreasures: string[];
  treasuresLoaded: boolean;
  unlockedAchievements: string[];
  newAchievement: Achievement | null;
  findTreasure: (treasureId: string) => Promise<void>;
  /** Treasure yang baru dikumpulkan; null = tidak ada showcase. */
  setCollectedTreasure: (t: Treasure | null) => void;
  unlockAchievement: (achievementId: string) => void;
  unlockAchievementByKey: (key: string) => void;
  clearNewAchievement: () => void;
  checkTimeAchievement: () => Promise<void>;
  triggerDoorAnimation: boolean;
  setTriggerDoorAnimation: (v: boolean) => void;
  triggerSceneTransition: boolean;
  setTriggerSceneTransition: (v: boolean) => void;
  pendingNextSceneId: string | null;
  setPendingNextSceneId: (v: string | null) => void;
  sceneComic: {
    src: string;
    panels: import('../types/game.types').ComicPanel[];
    nextSceneId: string;
    pages?: import('../types/game.types').ComicPage[];
    pageIndex?: number;
  } | null;
  setSceneComic: (comic: NonNullable<GameStore['sceneComic']> | null) => void;
  finishSceneComic: () => void;
  activeTransitionSceneId: string | null; // ✅ Fix: Properti baru yang ditambahkan agar as any tidak diperlukan
  sceneBackgroundOverrides: Record<string, string>;
  setSceneBackgroundOverride: (sceneId: string, bg: string) => void;
  lobbyCode: string | null;
  setLobbyCode: (code: string | null) => void;
  remotePaused: boolean;
  remotePausedBy: string | null;
  setRemotePaused: (paused: boolean, by: string | null) => void;
  lobbyPuzzleInputs: Record<string, any>;
  lobbyLastInputBy: string | null;
  setLobbyPuzzleInputs: (inputs: Record<string, any>, by: string | null) => void;
  stopVoiceCallback: (() => void) | null;
  setStopVoiceCallback: (fn: (() => void) | null) => void;
  voiceActive: boolean;
  setVoiceActive: (v: boolean) => void;
  activeCharacter: CharacterId;
  xVisionActive: boolean;
  translationActive: boolean;
  switchCharacter: () => void;
  setActiveCharacter: (char: CharacterId) => void;
  toggleXVision: () => void;
  toggleTranslation: () => void;
  puzzleInputStates: Record<string, any>;
  setPuzzleInputState: (puzzleId: string, state: any) => void;
  uvFlashlightActive: boolean;
  setUvFlashlightActive: (v: boolean) => void;
  char1Inventory: Item[];
  char2Inventory: Item[];
  addToChar3Inventory: (item: Item) => void;
  addToChar1Inventory: (item: Item) => void;
  addToChar2Inventory: (item: Item) => void;
  removeFromChar3Inventory: (itemId: string) => void;
  removeFromChar1Inventory: (itemId: string) => void;
  removeFromChar2Inventory: (itemId: string) => void;
  tapeReaderOpen: boolean;
  setTapeReaderOpen: (v: boolean) => void;
  hackingDone: boolean;
  setHackingDone: (v: boolean) => void;
  controlRoomState: 'locked' | 'accessed' | 'tape_playing';
  setControlRoomState: (state: 'locked' | 'accessed' | 'tape_playing') => void;
  insertedTapeId: string | null;
  setInsertedTapeId: (id: string | null) => void;
  controlRoomHacked: boolean;
  setControlRoomHacked: (v: boolean) => void;
  hackingMinigameOpen: boolean;
  setHackingMinigameOpen: (v: boolean) => void;
  desktopOpen: boolean;
  setDesktopOpen: (v: boolean) => void;
  desktopLoggedIn: boolean;
  setDesktopLoggedIn: (v: boolean) => void;
  desktopUsername: string;
  desktopId: string;
  setDesktopUsername: (v: string) => void;
  setDesktopId: (v: string) => void;
  desktopRepairedFiles: string[];
  repairFile: (fileId: string) => void;
  cctvUnlocked: boolean;
  setCctvUnlocked: (v: boolean) => void;
  setScreen: (screen: string) => void;
  handInspectOpen: boolean;
  setHandInspectOpen: (v: boolean) => void;
  desktopFolderLocked: boolean;
  setDesktopFolderLocked: (v: boolean) => void;
  char3Inventory: Item[];
  podControlOpen: boolean;
  setPodControlOpen: (v: boolean) => void;
  chestOpen: string | null;
  setChestOpen: (id: string | null) => void;
  takenChestItems: string[];
  takeChestItem: (itemId: string) => void;
  podFaceUnlocked: boolean,
  setPodFaceUnlocked: (v: boolean) => void;
  podLoginUsername: string;
  podLoginEmployeeId: string;
  podLoginDone: boolean;
  setPodLoginUsername: (v: string) => void;
  setPodLoginEmployeeId: (v: string) => void;
  setPodLoginDone: (v: boolean) => void;
  viewedSceneComics: string[];
markSceneComicViewed: (sceneId: string) => void;
releasedCharacter: 'char1' | 'char2' | null;
setReleasedCharacter: (char: 'char1' | 'char2') => void;
reactorOpen: boolean;
setReactorOpen: (v: boolean) => void;
coolingOpen: boolean;
setCoolingOpen: (v: boolean) => void;
powerOpen: boolean;
setPowerOpen: (v: boolean) => void;
glitchedReactors: string[];
addGlitchedReactor: (id: string) => void;
removeGlitchedReactor: (id: string) => void;
  /** Reactor yang glitch-nya sudah dihapus lokal, server belum mengonfirmasi. */
  pendingGlitchClears: string[];
fixingReactorId: string | null;
setFixingReactorId: (id: string | null) => void;
anyReactorSolved: boolean;
setAnyReactorSolved: (v: boolean) => void;
startReactorGlitchTimer: () => void;
fakeInfoActive: boolean;
setFakeInfoActive: (v: boolean) => void;
fakeReactors: string[];
addFakeReactor: (id: string) => void;
removeFakeReactor: (id: string) => void;
  /** Reactor yang fake info-nya sudah dihapus lokal, server belum mengonfirmasi. */
  pendingFakeClears: string[];
  /** Fake info sudah dijadwalkan (muncul setelah semua glitch diperbaiki). */
  fakeInfoScheduled: boolean;
  scheduleFakeInfo: () => void;
setFixingFakeReactorId: (id: string | null) => void;
  fixingFakeReactorId: string | null;
  shownSceneDialogs: string[];
  markSceneDialogShown: (dialogId: string) => void;
  triggerSceneDialog: (dialogId: string) => void;
  pendingSceneDialog: DialogLine[] | null;
  setPendingSceneDialog: (dialogs: DialogLine[] | null) => void;
  // Overlay dialog (non-blocking, appears on top of zoom/puzzle)
  sceneDialogOverlay: { lines: DialogLine[]; position?: 'bottom' | 'left' | 'right' } | null;
  setSceneDialogOverlay: (dialog: { lines: DialogLine[]; position?: 'bottom' | 'left' | 'right' } | null) => void;
  playerCharacter: string | null;
  setPlayerCharacter: (char: string | null) => void;
  scene5Character: string | null;
  setScene5Character: (char: string | null) => void;
  /** Pilihan karakter scene 5 tiap pemain: playerId -> character. */
  scene5Choices: Record<string, string>;
  setScene5Choices: (choices: Record<string, string>) => void;
  syncCharacterState: (char: CharacterId) => void;
  chooseScene5Character: (char: CharacterId) => Promise<boolean>;
  sharedRevision: number;
  applySharedGameState: (
    state: {
      solved_puzzles?: string[];
      used_hotspots?: string[];
      found_treasures?: string[];
      inventory?: string[];
      discovered_clues?: string[];
      character_inventories?: Record<string, string[]>;
      puzzle_inputs?: Record<string, any>;
      last_input_by?: string | null;
      shared_hint_tokens?: number;
      shared_hints_used?: number;
      released_character?: string | null;
      scene5_character?: string | null;
      glitched_reactors?: string[];
      glitched_cleared?: string[];
      fake_reactors?: string[];
      fake_cleared?: string[];
      fake_info_active?: boolean;
      any_reactor_solved?: boolean;
      pod_logged_in?: boolean;
      revision?: number;
    },
    action: string,
    triggeredBy: string | null
  ) => void;
}


// ✅ Fix: Menghapus strik `: GameState` agar tidak error dengan properti yang hanya ada di `GameStore`
const initialGameState: Partial<GameStore> = {
  screen: 'splash',
  currentLevelId: null,
  currentSceneId: null,
  inventory: [],
  discoveredClues: [],
  solvedPuzzles: [],
  usedHotspots: [],
  timeElapsed: 0,
  timerActive: false,
  levelProgress: {},
  zoomModal: null,
  noteModal: null,
  activePuzzleId: null,
  notification: null,
  hintsRemaining: 5,
  hintsUsed: 0,
  hintTokens: 5,
  player: null,
  token: null,
  isGuest: false,
  lastHintRefill: 0,
  foundTreasures: [],
  collectedTreasure: null,
  sessionFoundTreasures: [],
  treasuresLoaded: false,
  unlockedAchievements: [],
  newAchievement: null,
  triggerDoorAnimation: false,
  triggerSceneTransition: false,
  pendingNextSceneId: null,
  sceneComic: null,
  activeTransitionSceneId: null,
  sceneBackgroundOverrides: {},
  lobbyCode: null,
  remotePaused: false,
  remotePausedBy: null,
  lobbyPuzzleInputs: {},
  lobbyLastInputBy: null,
  stopVoiceCallback: null,
  voiceActive: false,
  activeCharacter: 'char1' as CharacterId,
  xVisionActive: false,
  translationActive: false,
  puzzleInputStates: {},
  uvFlashlightActive: false,
  char1Inventory: [],
  char2Inventory: [],
  tapeReaderOpen: false,
  hackingDone: false,
  controlRoomState: 'locked',
  insertedTapeId: null,
  controlRoomHacked: false,
  hackingMinigameOpen: false,
  desktopOpen: false,
  desktopLoggedIn: false,
  desktopUsername: '',
  desktopId: '',
  desktopRepairedFiles: [],
  cctvUnlocked: false,
  handInspectOpen: false,
  desktopFolderLocked: true,
  char3Inventory: [] as Item[],
  podControlOpen: false,
  chestOpen: null,
  takenChestItems: [],
  podFaceUnlocked: false,
  podLoginUsername: '',
  podLoginEmployeeId: '',
  podLoginDone: false,
  viewedSceneComics: [],
  shownSceneDialogs: [],
  pendingSceneDialog: null,
  sceneDialogOverlay: null,
  releasedCharacter: null,
  playerCharacter: null,
  scene5Character: null,
  scene5Choices: {},
  sharedRevision: -1,
  reactorOpen: false,
  coolingOpen: false,
  powerOpen: false,
  glitchedReactors: [],
  pendingGlitchClears: [],
  fixingReactorId: null,
  anyReactorSolved: false,
  fakeInfoActive: false,
  fakeReactors: [],
  pendingFakeClears: [],
  fakeInfoScheduled: false,
  fixingFakeReactorId: null,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...(initialGameState as GameStore),
      
     
      setReactorOpen: (v) => set({ reactorOpen: v }),
      setCoolingOpen: (v) => set({ coolingOpen: v }),
      setPowerOpen: (v) => set({ powerOpen: v }),
      setFakeInfoActive: (v) => {
        set({ fakeInfoActive: v });
        multiplayer.syncReactorState({ fakeInfoActive: v });
      },
      addGlitchedReactor: (id) => {
        set((s) => ({
          glitchedReactors: s.glitchedReactors.includes(id)
            ? s.glitchedReactors
            : [...s.glitchedReactors, id],
        }));
        multiplayer.syncReactorState({ glitchAdd: [id] });
      },
      removeGlitchedReactor: (id) => {
        // Hanya hapus kalau reactor ini memang sedang glitch. Kalau tidak,
        // jangan tandai reactor sebagai "sudah diperbaiki" sebelum
        // ganguannya muncul (reactor yang baru saja solved akan glitch
        // beberapa detik kemudian).
        if (!get().glitchedReactors.includes(id)) return;
        set((s) => ({
          glitchedReactors: s.glitchedReactors.filter(r => r !== id),
          pendingGlitchClears: s.pendingGlitchClears.includes(id)
            ? s.pendingGlitchClears
            : [...s.pendingGlitchClears, id],
        }));
        multiplayer.syncReactorState({ glitchClear: [id] });
      },
      addFakeReactor: (id) => {
        set((s) => ({
          fakeReactors: s.fakeReactors.includes(id)
            ? s.fakeReactors
            : [...s.fakeReactors, id],
        }));
        multiplayer.syncReactorState({ fakeAdd: [id] });
      },
      removeFakeReactor: (id) => {
        if (!get().fakeReactors.includes(id)) return;
        set((s) => ({
          fakeReactors: s.fakeReactors.filter(r => r !== id),
          pendingFakeClears: s.pendingFakeClears.includes(id)
            ? s.pendingFakeClears
            : [...s.pendingFakeClears, id],
        }));
        multiplayer.syncReactorState({ fakeClear: [id] });
      },
      scheduleFakeInfo: () => {
        // Fake info muncul SATU KALI, 10 detik setelah semua glitch diperbaiki.
        // Urutan mainnya: solve reactor -> glitch -> Katsuragi perbaiki -> fake info.
        if (get().fakeInfoScheduled) return;
        set({ fakeInfoScheduled: true });

        let attempts = 0;
        const tick = () => {
          const current = get();
          if (current.glitchedReactors.length > 0 && attempts < 40) {
            attempts++;
            window.setTimeout(tick, 3000);
            return;
          }

          // Fake info juga kena semua reactor, tapi Katsuragi harus
          // mengidentifikasi satu per satu lewat spot-diff.
          current.addFakeReactor('reactor');
          current.addFakeReactor('cooling');
          current.addFakeReactor('power');

          if (useGameStore.getState().fakeReactors.length > 0) {
            useGameStore.getState().setFakeInfoActive(true);
          }
        };

        window.setTimeout(tick, 10_000);
      },
      setFixingReactorId: (id) => set({ fixingReactorId: id }),
      setFixingFakeReactorId: (id: string | null) => set({ fixingFakeReactorId: id }),
      setAnyReactorSolved: (v) => {
        set({ anyReactorSolved: v });
        multiplayer.syncReactorState({ anyReactorSolved: v });
      },
      startReactorGlitchTimer: () => {
        const state = get();
        // Gangguan (glitch) kena SEMUA reactor sekaligus dan muncul di POV
        // semua pemain. Tapi perbaikannya 1 reactor per 1 (maze simple
        // untuk tiap reactor yang error).
        if (state.anyReactorSolved || state.glitchedReactors.length > 0) return;

        get().setAnyReactorSolved(true);
        window.setTimeout(() => {
          const current = get();
          if (current.glitchedReactors.length > 0) return;
          current.addGlitchedReactor('reactor');
          current.addGlitchedReactor('cooling');
          current.addGlitchedReactor('power');
        }, 5_000);
      },
      setReleasedCharacter: (char) => set({ releasedCharacter: char }),
      setPlayerCharacter: (char) => set({ playerCharacter: char }),
      setScene5Character: (char) => set({ scene5Character: char }),
  setScene5Choices: (choices) => set({ scene5Choices: choices ?? {} }),
      markSceneComicViewed: (sceneId) => set((s) => ({
  viewedSceneComics: [...s.viewedSceneComics, sceneId]
})),
      setPodFaceUnlocked: (v) => set({ podFaceUnlocked: v }),
      markSceneDialogShown: (dialogId) => set((s) => ({
        shownSceneDialogs: s.shownSceneDialogs.includes(dialogId)
          ? s.shownSceneDialogs
          : [...s.shownSceneDialogs, dialogId]
      })),
      triggerSceneDialog: (dialogId) => {
        const state = useGameStore.getState();
        if (state.shownSceneDialogs.includes(dialogId)) return;
        const level = FALLBACK_LEVELS.find((l) => l.id === state.currentLevelId);
        if (!level) return;
        const dialogs = level.sceneDialogs?.[dialogId];
        if (dialogs && dialogs.length > 0) {
          state.markSceneDialogShown(dialogId);
          // Check if this dialog should use overlay mode (non-blocking)
          const isOverlayDialog = ['scene7_3_folder', 'scene7_4_machine', 'scene7_4_chest', 'scene7_5_reactor_done', 'scene7_5_outro', 'scene7_3_mark', 'scene7_1_item', 'scene7_1_flashlight'].includes(dialogId);
          if (isOverlayDialog) {
            // Overlay dialog - non-blocking, appears on top of zoom/puzzle
            state.setSceneDialogOverlay({ lines: dialogs, position: 'bottom' });
            // Don't pause timer for overlay dialogs
          } else {
            // Full-screen dialog - blocks interaction
            state.pauseTimer();
            state.setPendingSceneDialog(dialogs);
          }
        }
      },
      setSceneComic: (comic) => set({ sceneComic: comic }),
      setPodLoginUsername: (v) => set({ podLoginUsername: v }),
      setPendingSceneDialog: (dialogs) => set({ pendingSceneDialog: dialogs }),
      setSceneDialogOverlay: (dialog) => set({ sceneDialogOverlay: dialog }),
      setPodLoginEmployeeId: (v) => set({ podLoginEmployeeId: v }),
      setPodLoginDone: (v) => {
        set({ podLoginDone: v });
        // Pod itu satu perangkat untuk satu tim: begitu SATU pemain berhasil
        // login (username + ID + photocard), semua pemain dihitung sudah login
        // supaya tidak harus login ulang di browser masing-masing.
        if (v) multiplayer.syncPodLogin();
      },
      setChestOpen: (id) => set({ chestOpen: id }),
      takeChestItem: (itemId) => set((s) => ({
        takenChestItems: [...s.takenChestItems, itemId]
      })),
      setPodControlOpen: (v) => set({ podControlOpen: v }),
      setHandInspectOpen: (v) => set({ handInspectOpen: v }),
      setDesktopFolderLocked: (v) => set({ desktopFolderLocked: v }),
      repairFile: (fileId) => set((s) => ({
        desktopRepairedFiles: [...s.desktopRepairedFiles, fileId]
      })),
      setCctvUnlocked: (v) => set({ cctvUnlocked: v }),
      setDesktopUsername: (v) => set({ desktopUsername: v }),
      setDesktopId: (v) => set({ desktopId: v }),
      setDesktopLoggedIn: (v) => set({ desktopLoggedIn: v }),
      setDesktopOpen: (v) => set({ desktopOpen: v }),
      setControlRoomHacked: (v) => set({ controlRoomHacked: v }),
      setHackingMinigameOpen: (v) => set({ hackingMinigameOpen: v }),
      setInsertedTapeId: (id) => set({ insertedTapeId: id }),
      setControlRoomState: (state) => set({ controlRoomState: state }),
      setHackingDone: (v) => set({ hackingDone: v }),
      setTapeReaderOpen: (v) => set({ tapeReaderOpen: v }),
      addToChar1Inventory: (item) => {
        set((s) => ({ char1Inventory: [...s.char1Inventory, item] }));
        multiplayer.syncAction('character_state', { character: 'char1', inventory: get().char1Inventory });
      },
      addToChar2Inventory: (item) => {
        set((s) => ({ char2Inventory: [...s.char2Inventory, item] }));
        multiplayer.syncAction('character_state', { character: 'char2', inventory: get().char2Inventory });
      },
      addToChar3Inventory: (item) => {
        set((s) => ({ char3Inventory: [...s.char3Inventory, item] }));
        multiplayer.syncAction('character_state', { character: 'char3', inventory: get().char3Inventory });
      },
      removeFromChar3Inventory: (itemId) => {
        set((s) => ({ char3Inventory: s.char3Inventory.filter((i) => i.id !== itemId) }));
        multiplayer.syncAction('character_state', { character: 'char3', inventory: get().char3Inventory });
      },
      removeFromChar1Inventory: (itemId) => {
        set((s) => ({ char1Inventory: s.char1Inventory.filter((i) => i.id !== itemId) }));
        multiplayer.syncAction('character_state', { character: 'char1', inventory: get().char1Inventory });
      },
      removeFromChar2Inventory: (itemId) => {
        set((s) => ({ char2Inventory: s.char2Inventory.filter((i) => i.id !== itemId) }));
        multiplayer.syncAction('character_state', { character: 'char2', inventory: get().char2Inventory });
      },
      setUvFlashlightActive: (v) => set({ uvFlashlightActive: v }),
      setPuzzleInputState: (puzzleId, state) => set((s) => ({
        puzzleInputStates: { ...s.puzzleInputStates, [puzzleId]: state },
      })),
      switchCharacter: () => {
        if (get().playerCharacter) return;
        const current = get().activeCharacter;
        if (current === 'char3') return;
        set({ activeCharacter: current === 'char1' ? 'char2' : 'char1' });
      },
      setActiveCharacter: (char) => {
        set({ activeCharacter: char });
      },
      syncCharacterState: (char) => {
        const s = get();
        const inv =
          char === 'char1' ? s.char1Inventory : char === 'char2' ? s.char2Inventory : s.char3Inventory;
        multiplayer.syncAction('character_state', { character: char, inventory: inv });
      },

      // ── Pilih karakter untuk scene 5 (setelah pod membebaskan orang) ───────
      chooseScene5Character: async (char) => {
        const prevScene5 = get().scene5Character;
        const prevActive = get().activeCharacter;

        const applyLocal = () => {
          set({ scene5Character: char, activeCharacter: char });

          if (char === 'char3') return;

          // Item reactor ada di Katsuragi. Kalau player memilih Kayshi/Vania,
          // device-nya ikut pindah supaya reactor tetap bisa diperbaiki.
          const katItems = get().char3Inventory.filter(
            (i) => i.id === 'hacking_device' || i.id === 'hacking_device_upgraded'
          );
          const targetList =
            char === 'char1' ? get().char1Inventory : get().char2Inventory;

          if (char === 'char1') {
            for (const item of katItems) {
              if (!targetList.some((i) => i.id === item.id)) get().addToChar1Inventory(item);
            }
          } else {
            for (const item of katItems) {
              if (!targetList.some((i) => i.id === item.id)) get().addToChar2Inventory(item);
            }
          }

          if (!targetList.some((i) => i.id === 'item_uv_flashlight')) {
            get()[char === 'char1' ? 'addToChar1Inventory' : 'addToChar2Inventory'](UV_FLASHLIGHT);
          }
        };

        // Single player (tanpa lobby): langsung terapkan, tidak ada server.
        if (!get().lobbyCode) {
          applyLocal();
          return true;
        }

        // Multiplayer: server yang jadi arbiter. Karakter yang sudah dipakai
        // pemain lain ditolak (HTTP 409) supaya tidak ada dua pemain memakai
        // karakter yang sama di scene 5.
        const res = await multiplayer.selectScene5Character(char);

        if (res !== true) {
          const message =
            (res && typeof res === 'object' && (res as any).message) ||
            'Karakter sudah dipilih pemain lain.';
          set({ scene5Character: prevScene5, activeCharacter: prevActive });
          get().showNotification(message, 'error');
          return false;
        }

        applyLocal();
        return true;
      },


      // ── Terapkan state bersama dari server ke state lokal ──────────────────
      // Dipanggil tiap ada event .game.state.updated atau hasil polling.
      // Semua field bersifat monoton (solving/mengambil tidak pernah dibatalkan),
      // jadi cukup union — tidak ada yang bisa "hilang" karena telat arrive.
      applySharedGameState: (state, action, triggeredBy) => {
        if (!get().lobbyCode) return;

        const revision = typeof state.revision === 'number' ? state.revision : get().sharedRevision;
        const myUsername = get().player?.username;

        set((s) => {
          const patch: Partial<GameStore> = {};

          if (typeof revision === 'number') patch.sharedRevision = revision;

          // Progress: union dengan lokal.
          if (state.solved_puzzles?.length) {
            patch.solvedPuzzles = union(s.solvedPuzzles, state.solved_puzzles);
          }
          if (state.used_hotspots?.length) {
            patch.usedHotspots = union(s.usedHotspots, state.used_hotspots);
          }
          if (state.found_treasures?.length) {
            patch.foundTreasures = union(s.foundTreasures, state.found_treasures);
          }

          // Level 1–6: satu inventory bersama. Item dikirim server sebagai id,
          // di-resolve kembali ke objek Item penuh supaya UI tetap utuh.
          if (state.inventory?.length) {
            patch.inventory = mergeById(s.inventory, resolveItems(state.inventory, s));
          }

          // Level 7: tiap karakter punya inventory sendiri dan bisa spent (crafting,
          // tukar photocard), jadi di sini server yang berwenang. Milik kita tetap
          // lokal supaya item yang baru saja dipakai tidak berkedip hilang sebelum
          // sinkronisasi sampai. Hanya karakter milik PASANGAN yang ditimpa.
          const sharedChars = state.character_inventories ?? {};
          for (const key of ['char1', 'char2', 'char3'] as const) {
            const ids = sharedChars[key];
            if (!ids) continue;
            if (s.playerCharacter && s.playerCharacter === key) continue;

            const resolved = resolveItems(ids, s);
            // Kalau sebagian id tidak bisa di-resolve ke data level, jangan
            // menimpa — lebih baik tampilan stale daripada item hilang.
            if (resolved.length !== ids.length) continue;

            if (key === 'char1') patch.char1Inventory = replaceById(s.char1Inventory, resolved);
            if (key === 'char2') patch.char2Inventory = replaceById(s.char2Inventory, resolved);
            if (key === 'char3') patch.char3Inventory = replaceById(s.char3Inventory, resolved);
          }

          // Clue bersama (monoton).
          if (state.discovered_clues?.length) {
            patch.discoveredClues = union(s.discoveredClues, resolveClues(state.discovered_clues, s));
          }

          // Gangguan reactor (glitch + fake info) = snapshot bersama, TAPI
          // daftar "sudah diperbaiki" harus ikut dihormati supaya hasil
          // perbaikan Katsuragi tidak muncul lagi di pemain lain.
          if (Array.isArray(state.glitched_reactors)) {
            const serverCleared = state.glitched_cleared ?? [];
            const cleared = union(serverCleared, s.pendingGlitchClears);
            patch.glitchedReactors = union(s.glitchedReactors, state.glitched_reactors)
              .filter((id) => !cleared.includes(id));

            // Pending clear yang sudah dikonfirmasi server boleh dibuang.
            const stillPending = s.pendingGlitchClears.filter((id) => !serverCleared.includes(id));
            if (stillPending.length !== s.pendingGlitchClears.length) {
              patch.pendingGlitchClears = stillPending;
            }
          }
          if (Array.isArray(state.fake_reactors)) {
            const serverClearedFake = state.fake_cleared ?? [];
            const clearedFake = union(serverClearedFake, s.pendingFakeClears);
            const mergedFake = union(s.fakeReactors, state.fake_reactors)
              .filter((id) => !clearedFake.includes(id));
            patch.fakeReactors = mergedFake;
            patch.fakeInfoActive = mergedFake.length > 0;

            const stillPendingFake = s.pendingFakeClears.filter((id) => !serverClearedFake.includes(id));
            if (stillPendingFake.length !== s.pendingFakeClears.length) {
              patch.pendingFakeClears = stillPendingFake;
            }
          } else if (typeof state.fake_info_active === 'boolean') {
            patch.fakeInfoActive = state.fake_info_active;
          }
          if (state.any_reactor_solved && !s.anyReactorSolved) {
            patch.anyReactorSolved = true;
          }

          // Pod sudah di-login oleh salah satu pemain => semua pemain dihitung
          // sudah login (pod adalah satu perangkat untuk satu tim).
          if (state.pod_logged_in && !s.podLoginDone) {
            patch.podLoginDone = true;
          }

          // Keputusan karakter level 7 milik TIM (pod hanya bisa membebaskan satu
          // orang untuk keduanya), jadi ikut mengikuti server.
          if (state.released_character && s.releasedCharacter !== state.released_character) {
            patch.releasedCharacter = state.released_character as 'char1' | 'char2';
          }
          // scene5_character TIDAK ikut di sini — itu pilihan per player dan
          // dibaca dari lobby.players, bukan dari state bersama.

          return patch;
        });

        // ── Sinyal khusus per aksi ────────────────────────────────────
        // Input puzzle disinkronkan lewat setiap sumber (websocket maupun polling)
        // supaya tetap konsisten walau websocket sempat putus.
        if (state.puzzle_inputs) {
          useGameStore.setState({
            lobbyPuzzleInputs: state.puzzle_inputs,
            lobbyLastInputBy: state.last_input_by ?? triggeredBy ?? null,
          });
        }

        // Hint dipakai teammate → samakan jumlah token & hint card.
        if (action === 'hint_used' && triggeredBy && triggeredBy !== myUsername) {
          set((s) => ({
            hintTokens:
              typeof state.shared_hint_tokens === 'number'
                ? state.shared_hint_tokens
                : s.hintTokens,
            hintsUsed:
              typeof state.shared_hints_used === 'number'
                ? state.shared_hints_used
                : s.hintsUsed,
          }));
          useGameStore.getState().showNotification(`💡 ${triggeredBy} menggunakan hint!`, 'info');
        }
      },

      toggleXVision: () => {
        if (get().activeCharacter !== 'char2') return;
        set((s) => ({ xVisionActive: !s.xVisionActive }));
      },

      toggleTranslation: () => {
        if (get().activeCharacter !== 'char1' && get().activeCharacter !== 'char2') return;
        set((s) => ({ translationActive: !s.translationActive }));
      },
      setVoiceActive: (v) => set({ voiceActive: v }),
      setStopVoiceCallback: (fn) => set({ stopVoiceCallback: fn }),
      setLobbyPuzzleInputs: (inputs, by) => set({ lobbyPuzzleInputs: inputs, lobbyLastInputBy: by }),
      setLobbyCode: (code) => set({ lobbyCode: code }),
  setRemotePaused: (paused, by) => set({ remotePaused: paused, remotePausedBy: by }),

      setTriggerSceneTransition: (v) => set({ triggerSceneTransition: v }),
      setPendingNextSceneId: (v) => set({ pendingNextSceneId: v }),
      setTriggerDoorAnimation: (v) => set({ triggerDoorAnimation: v }),

      setSceneBackgroundOverride: (sceneId, bg) =>
        set((s) => ({
          sceneBackgroundOverrides: { ...s.sceneBackgroundOverrides, [sceneId]: bg },
        })),

      levels: FALLBACK_LEVELS,
  detailedLevelIds: [],
      isLoadingLevels: false,
      hintMaxTokens: 5,
      hintRefillSeconds: 60,

      findTreasure: async (treasureId) => {
        const state = get();
        if (state.foundTreasures.includes(treasureId)) return;
        const newFound = [...state.foundTreasures, treasureId];
        const newSessionFound = [...state.sessionFoundTreasures, treasureId];
        set({ foundTreasures: newFound, sessionFoundTreasures: newSessionFound });
        multiplayer.syncAction('treasure_found', { treasureId });

        const level = findLevel(state, state.currentLevelId);

        // Achievement explorer muncul HANYA kalau semua treasure di level ini
        // sudah ditemukan. Cek dilakukan lokal supaya popup muncul segera,
        // tidak bergantung pada respons server (yang achievement_key-nya
        // bisa tidak cocok dengan id di frontend).
        // Achievement explorer muncul HANYA kalau semua treasure di level ini
        // sudah ditemukan. dicek lokal supaya popup muncul segera dan tidak
        // bergantung pada respons server (yang achievement_key-nya bisa tidak
        // cocok dengan id di frontend).
        const checkAllFound = () => {
          if (!level?.treasures || level.treasures.length === 0) return;
          // Popup hanya muncul kalau semua treasure ditemukan di sesi ini
          // (sessionFoundTreasures mencapai total). Kalau satu treasure sudah
          // ada dari sesi sebelumnya, tidak ada popup — tapi achievement tetap
          // akan terbuka lewat loadMyProgress di splash.
          const allFoundThisSession =
            level.treasures.every((t) => newSessionFound.includes(t.id));
          if (allFoundThisSession) {
            const treasureAchs = level.achievements?.filter((a) => a.type === 'treasure');
            treasureAchs?.forEach((a) => get().unlockAchievement(a.id));
          }
        };

        // Tampilkan showcase treasure (gambar + nama + deskripsi), ditutup
        // dengan klik di mana saja.
        const treasureData = level?.treasures?.find((t) => t.id === treasureId);
        if (treasureData) {
          set({ collectedTreasure: treasureData });
        }

        // Simpan ke server supaya benar-benar masuk ke database
        // (player_treasures). Guest tidak punya akun => tidak bisa disimpan.
        if (!state.isGuest && state.token) {
          const ok = await saveTreasureToServer(treasureId, state.token);
          if (ok) {
            pendingTreasureSaves.delete(treasureId);
          } else {
            pendingTreasureSaves.add(treasureId);
            get().showNotification('Treasure belum tersimpan ke server, akan dicoba lagi.', 'error');
          }
        }

        checkAllFound();
      },

      setCollectedTreasure: (t) => set({ collectedTreasure: t }),

      unlockAchievement: (achievementId) => {
        const state = get();
        if (state.unlockedAchievements.includes(achievementId)) return;
        let achievement: Achievement | undefined;
        for (const level of state.levels) {
          achievement = level.achievements?.find((a) => a.id === achievementId);
          if (achievement) break;
        }
        if (!achievement) return;
        set({
          unlockedAchievements: [...state.unlockedAchievements, achievementId],
          newAchievement: achievement,
        });
        setTimeout(() => get().clearNewAchievement(), 4000);
      },

      unlockAchievementByKey: (key) => {
        const state = get();
        if (state.unlockedAchievements.includes(key)) return;
        const allAchievements = state.levels.flatMap(
          (l) => l.achievements ?? []
        );
        const ach = allAchievements.find((a) => a.id === key);
        if (!ach) return;
        set({
          unlockedAchievements: [...state.unlockedAchievements, key],
          newAchievement: ach,
        });
        setTimeout(() => get().clearNewAchievement(), 4000);
      },

      clearNewAchievement: () => set({ newAchievement: null }),

      checkTimeAchievement: async () => {
        const state = get();
        const level = findLevel(state, state.currentLevelId);
        if (!level?.achievements) return;
        const timeLeft = level.timeLimit - state.timeElapsed;
        const achievements = level.achievements.filter((a) => a.type === 'time');

        for (const ach of achievements) {
          const shouldUnlock = ach.isGolden
            ? timeLeft > 5 * 60
            : true;

          if (shouldUnlock) {
            get().unlockAchievement(ach.id);

            if (!state.isGuest && state.token) {
              try {
                await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'}/achievements/unlock`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`,
                  },
                  body: JSON.stringify({ achievement_key: ach.id }),
                });
              } catch (e) {
                console.warn('Gagal unlock achievement:', e);
              }
            }
          }
        }
      },

      loadMyProgress: async () => {
        const state = get();
        if (!state.token || state.isGuest) {
          set({ treasuresLoaded: true });
          return;
        }
        try {
          const [achievements, treasures] = await Promise.all([
            fetchMyAchievements(state.token),
            fetchMyTreasures(state.token),
          ]);
          set({
            unlockedAchievements: Array.isArray(achievements) ? achievements : get().unlockedAchievements,
            foundTreasures: Array.isArray(treasures) ? treasures : get().foundTreasures,
            treasuresLoaded: true,
          });
        } catch (e) {
          console.warn('Gagal load progress:', e);
          set({ treasuresLoaded: true });
        }
      },

      syncProgress: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const progress = await fetchProgress(token);
          const mapped: Record<string, { completed: boolean; bestTime: number; stars: number }> = {};
          progress.forEach((p) => {
            mapped[p.level_key] = {
              completed: p.completed,
              bestTime: p.best_time,
              stars: p.stars,
            };
          });
          set({ levelProgress: mapped });
        } catch (err: unknown) {
          console.warn('Gagal sync progress:', err);
        }
      },

      setPlayer: (player, token) => set({ player, token, isGuest: false }),
      setGuest: () => set({ player: null, token: null, isGuest: true }),
      logout: () => set({ player: null, token: null, isGuest: false, screen: 'splash' }),

      loadLevels: async () => {
        set({ isLoadingLevels: true });
        try {
          const apiLevels = await fetchLevels();
          if (apiLevels.length > 0) {
            const mapped: Level[] = apiLevels.map((l) => ({
              id: l.level_key,
              title: l.title,
              description: l.description,
              thumbnail: l.thumbnail,
              characterAvatar: resolveAssetPath((l as any).character_avatar ?? undefined),
              characterName: (l as any).character_name ?? undefined,
              timeLimit: l.time_limit,
              starThresholds: l.star_thresholds as [number, number, number],
              music: l.music ?? undefined,
              isLocked: l.is_locked,
              dialogMusic: l.dialog_music ?? undefined,
              scenes: [],
              puzzles: [],
              hints: [],
              introDialog: [],
              items: [],
              clues: [],
              exitPuzzleId: '',
              treasures: (l.treasures ?? []).map((t) => mapTreasure(t as any, (l as any).achievements ?? [])),
              achievements: (l as any).achievements?.map(mapAchievement),
            }));
            set((s) => {
              // Level yang sudah pernah di-load lengkap (punya scenes, hasil
              // merge API + data lokal) TIDAK boleh ditimpa versi ringkas
              // dari endpoint index — kalau ditimpa, scene/hotspot gameplay
              // ikut hilang.
              const merged = mapped.map((m) => {
                const existing = s.levels.find((l) => l.id === m.id);
                // Level yang SUDAH pernah di-load detail (merge API + data
                // lokal) tidak boleh ditimpa versi ringkas dari index.
                // Level yang masih data lokal murni HARUS ditimpa,
                // supaya isi admin langsung dipakai.
                if (existing && s.detailedLevelIds.includes(m.id) && m.scenes.length === 0) {
                  return existing;
                }
                return m;
              });

              return {
                levels: [
                  ...merged,
                  ...FALLBACK_LEVELS.filter((l) => !merged.find((m) => m.id === l.id)),
                ],
                treasuresLoaded: true,
              };
            });
          }
        } catch (err: unknown) {
          console.warn('⚠️ Gagal fetch levels dari API, pakai data lokal.', err);
            set({ treasuresLoaded: true });
        } finally {
          set({ isLoadingLevels: false });
        }
      },

      loadLevelPreview: async (levelId) => {
        let level: Level | undefined;

        try {
          const apiDetail = (await fetchLevel(levelId)) as any;
          const local = FALLBACK_LEVELS.find((l) => l.id === levelId);

          // Database = sumber utama untuk semua yang bisa disunting di admin.
          // Data lokal hanya melengkapi (item, char layer, comic, sub-view).
          level = local
            ? mergeApiIntoLevel(local, apiDetail)
            : buildLevelFromApi(apiDetail);
        } catch {
          level = FALLBACK_LEVELS.find((l) => l.id === levelId);
        }

        if (!level) return undefined;

        set((s) => ({
          detailedLevelIds: s.detailedLevelIds.includes(levelId)
            ? s.detailedLevelIds
            : [...s.detailedLevelIds, levelId],
        }));

        // Simpan ke store supaya komponen (App, LevelSelect) memakai data
        // yang sama dengan yang akan dipakai gameplay.
        set((s) => {
          const exists = s.levels.some((l) => l.id === level!.id);
          return {
            levels: exists
              ? s.levels.map((l) => (l.id === level!.id ? level! : l))
              : [...s.levels, level!],
          };
        });

        return level;
      },

      loadHintConfig: async () => {
        try {
          const config = await fetchHintConfig();
          set({
            hintMaxTokens: config.max_tokens,
            hintRefillSeconds: config.refill_seconds,
          });
        } catch (err: unknown) {
          console.warn('⚠️ Gagal fetch hint config, pakai default.', err);
        }
      },

      goTo: (screen) => set({
        screen, foundTreasures: [], newAchievement: null,
        xVisionActive: false,
        translationActive: false,
      }),

      startLevel: async (levelId) => {
        // Pastikan treasure yang sudah dikumpulkan di-load dari server sebelum
        // gameplay dimulai, supaya TreasureLayer tidak menampilkan yang sudah
        // di-collect (dan tidak ada flash semua treasure).
        const preState = get();
        if (preState.token && !preState.isGuest) {
          await get().loadMyProgress();
        } else {
          set({ treasuresLoaded: true });
        }

        let level: Level | undefined;

        // Database = sumber utama untuk semua yang bisa disunting di admin.
        // Data lokal hanya melengkapi (item, char layer, comic, sub-view),
        // sehingga perubahan dari admin langsung terlihat di game.
        try {
          const apiDetail = (await fetchLevel(levelId)) as any;
          const local = FALLBACK_LEVELS.find((l) => l.id === levelId);

          level = local
            ? mergeApiIntoLevel(local, apiDetail)
            : buildLevelFromApi(apiDetail);
        } catch (err: unknown) {
          console.warn(`⚠️ Gagal fetch level "${levelId}" dari API, pakai data lokal.`, err);
          level = FALLBACK_LEVELS.find((l) => l.id === levelId);
        }

        if (!level) return;

        set((s) => ({
          detailedLevelIds: s.detailedLevelIds.includes(levelId)
            ? s.detailedLevelIds
            : [...s.detailedLevelIds, levelId],
        }));

        const fallback = FALLBACK_LEVELS.find((l) => l.id === levelId);
        if (fallback) {
          level.treasures ??= fallback.treasures ?? [];
          level.achievements ??= fallback.achievements ?? [];
        }

        set((s) => {
          const exists = s.levels.some((l) => l.id === level!.id);
          const newLevels = exists
            ? s.levels.map((l) => (l.id === level!.id ? level! : l))
            : [...s.levels, level!];
          return { levels: newLevels };
        });

        const initialSceneId = level.scenes[0]?.id ?? '';
        const initialScene = level.scenes[0];
        const initialComicPages = initialScene?.comicPages;
        const initialSceneComic = initialComicPages?.[0] ?? initialScene?.sceneComic;

        set({
          screen: 'gameplay',
          currentLevelId: levelId,
          currentSceneId: initialSceneId,
          sceneComic: initialSceneComic && !(get().viewedSceneComics?.includes(initialSceneId) ?? false)
            ? {
                ...initialSceneComic,
                nextSceneId: initialSceneId,
                pages: initialComicPages,
                pageIndex: 0,
              }
            : null,
          inventory: [],
          discoveredClues: [],
          solvedPuzzles: [],
          usedHotspots: [],
          timeElapsed: 0,
          timerActive: true,
          zoomModal: null,
          noteModal: null,
          activePuzzleId: null,
          notification: null,
          hintsUsed: 0,
          hintsRemaining: 5,
          // foundTreasures TIDAK di-reset: treasure yang sudah dikumpulkan
          // harus tetap hilang saat level dimainkan ulang.
          foundTreasures: get().foundTreasures,
          viewedSceneComics: levelId === 'level_7' ? [] : get().viewedSceneComics,
          newAchievement: null,
          triggerDoorAnimation: false,
          releasedCharacter: null,
          activeCharacter: (get().playerCharacter as CharacterId) ?? (levelId === 'level_7' ? 'char2' : 'char1'),
          playerCharacter: get().playerCharacter,
          scene5Character: null,
          // Inventory per karakter ikut di-reset: level 7 memindahkan item antar
          // karakter (pod, transfer reactor), jadi sisa sesi lama akan bocor ke
          // sesi berikutnya kalau tidak dibersihkan.
          char1Inventory: [],
          char2Inventory: [],
          char3Inventory: [],
          takenChestItems: [],
glitchedReactors: [],
fixingReactorId: null,
          anyReactorSolved: false,
          fakeReactors: [],
          pendingGlitchClears: [],
          pendingFakeClears: [],
          fakeInfoActive: false,
          fakeInfoScheduled: false,
        });
      },

      goToScene: (sceneId) => {
        const { currentLevelId, currentSceneId, solvedPuzzles, sceneComic, releasedCharacter } = get();

        if (sceneComic) return;

        if (currentLevelId === 'level_6') {
          if (sceneId.includes('scene_garden_2') && !solvedPuzzles.includes('puzzle_color_pattern')) {
            get().showNotification('Selesaikan Puzzle 1 terlebih dahulu untuk membuka area ini!', 'error');
            return;
          }
          if (sceneId.includes('scene_garden_3') && !solvedPuzzles.includes('puzzle_arrow_input')) {
            get().showNotification('Selesaikan Puzzle 2 terlebih dahulu untuk membuka area ini!', 'error');
            return;
          }
        }

        if (currentLevelId === 'level_7' && sceneId === 'scene7_5' && !releasedCharacter) {
          get().showNotification('Selesaikan transfer dan pilih karakter yang akan dibebaskan terlebih dahulu.', 'error');
          return;
        }

        const level = findLevel(get(), currentLevelId);
        const targetScene = level?.scenes.find((scene) => scene.id === sceneId);
        const fallbackTargetScene = FALLBACK_LEVELS
          .find((fallbackLevel) => fallbackLevel.id === currentLevelId)
          ?.scenes.find((scene) => scene.id === sceneId);
        const configuredScene = targetScene ?? fallbackTargetScene;
        const configuredSceneComic = configuredScene?.sceneComic;
        const configuredComicPages = configuredScene?.comicPages;
        if (currentLevelId === 'level_7' && configuredScene && currentSceneId !== sceneId) {
           if (!get().lobbyCode) get().pauseTimer();
        }
        const alreadyViewed = (get().viewedSceneComics ?? []).includes(sceneId);
        if ((configuredSceneComic || configuredComicPages?.length) && currentSceneId !== sceneId && !alreadyViewed) {
          const firstPage = configuredComicPages?.[0] ?? configuredSceneComic;
          if (!firstPage) return;
          set({
            sceneComic: {
              ...firstPage,
              nextSceneId: sceneId,
              pages: configuredComicPages,
              pageIndex: 0,
            },
            currentSceneId: sceneId,
          });
          return;
        }

        set({ currentSceneId: sceneId });
      },

      finishSceneComic: () => {
        const pendingComic = get().sceneComic;
        if (!pendingComic) return;

        const nextPageIndex = (pendingComic.pageIndex ?? 0) + 1;
        const nextPage = pendingComic.pages?.[nextPageIndex];
        if (nextPage) {
          set({
            sceneComic: {
              ...nextPage,
              nextSceneId: pendingComic.nextSceneId,
              pages: pendingComic.pages,
              pageIndex: nextPageIndex,
            },
          });
          return;
        }

        const { currentLevelId, currentSceneId } = get();
        const level = findLevel(get(), currentLevelId);
        const targetScene = level?.scenes.find((scene) => scene.id === pendingComic.nextSceneId);

        if (currentSceneId !== pendingComic.nextSceneId) {
          const { releasedCharacter } = get();
          const sceneComicConfig = targetScene?.sceneComic as any;
          let firstPage = targetScene?.comicPages?.[0] ?? targetScene?.sceneComic;
          // Gunakan srcByReleasedCharacter jika tersedia
          if (sceneComicConfig?.srcByReleasedCharacter && releasedCharacter) {
            const charComic = sceneComicConfig.srcByReleasedCharacter[releasedCharacter];
            if (charComic) {
              firstPage = charComic;
            }
          }
          if (firstPage) {
            set({
              currentSceneId: pendingComic.nextSceneId,
              sceneComic: {
                ...firstPage,
                nextSceneId: pendingComic.nextSceneId,
                pages: targetScene?.comicPages,
                pageIndex: 0,
              },
            });
            return;
          }
        }

        const viewedId = pendingComic.nextSceneId;
        set((s) => ({
          currentSceneId: pendingComic.nextSceneId,
          sceneComic: null,
          viewedSceneComics: s.viewedSceneComics.includes(viewedId)
            ? s.viewedSceneComics
            : [...s.viewedSceneComics, viewedId],
        }));
      },

      addToInventory: (item) => {
        if (get().inventory.find((i) => i.id === item.id)) return;
        set((s) => ({ inventory: [...s.inventory, item] }));
        multiplayer.syncAction('item_collected', { itemId: item.id });
        get().showNotification(`${item.icon} "${item.name}" ditambahkan ke inventory!`, 'success');
      },

      removeFromInventory: (itemId) => {
        set((s) => ({ inventory: s.inventory.filter((i) => i.id !== itemId) }));
        multiplayer.syncAction('item_removed', { itemId });
      },

      hasItem: (itemId) => {
        const s = get();
        return !!(
          s.inventory.find((i) => i.id === itemId) ||
          s.char1Inventory.find((i) => i.id === itemId) ||
          s.char2Inventory.find((i) => i.id === itemId) ||
          s.char3Inventory.find((i) => i.id === itemId)
        );
      },

      addClue: (clue) => {
        if (get().discoveredClues.find((c) => c.id === clue.id)) return;
        set((s) => ({ discoveredClues: [...s.discoveredClues, clue] }));
        multiplayer.syncAction('clue_discovered', { clueId: clue.id });
        get().showNotification(`Clue ditemukan: "${clue.hint}"`, 'info');
      },

      hasClue: (clueId) => !!get().discoveredClues.find((c) => c.id === clueId),

      solvePuzzle: (puzzleId) => {
        if (get().solvedPuzzles.includes(puzzleId)) return;
        set((s) => ({ solvedPuzzles: [...s.solvedPuzzles, puzzleId] }));

        // Siarasikan ke lobby (hanya bila sedang bermain bersama).
        // Sebelumnya dikunci di balik `playerCharacter`, padahal character hanya
        // diisi untuk level 7 — jadi sinkronisasi puzzle mati total di level 1–6.
        const s = get();
        if (s.lobbyCode) {
          multiplayer.syncAction('puzzle_solved', { puzzleId, character: s.playerCharacter });
        }

        const { currentLevelId } = get();
        const level = findLevel(get(), currentLevelId);
        if (!level) return;

        if (level.exitPuzzleId === puzzleId) {
          get().closePuzzle();

          const sceneId = get().currentSceneId;
          if (!sceneId) return; // ✅ Fix null safety jika sceneId kosong 

          const fallbackLevel = FALLBACK_LEVELS.find((l) => l.id === currentLevelId);
          const allScenes = [
            ...(level.scenes ?? []),
            ...(fallbackLevel?.scenes ?? []),
          ];

          const openScene = allScenes.find((s) => s.id === sceneId + '_open');

          console.log('currentSceneId:', sceneId);
          console.log('mencari scene:', sceneId + '_open');
          console.log('scenes tersedia:', allScenes.map((s) => s.id));
          console.log('openScene ditemukan:', openScene?.id);

          if (openScene) {
            set((s) => ({
              levels: s.levels.map((l) =>
                l.id === currentLevelId
                  ? {
                    ...l,
                    scenes: l.scenes.some((sc) => sc.id === openScene.id)
                      ? l.scenes
                      : [...l.scenes, openScene],
                  }
                  : l
              ),
            }));
            set({ currentSceneId: openScene.id });
          }

          setTimeout(() => {
            set({ triggerDoorAnimation: true });
          }, 80);

          return;
        }

        if (currentLevelId === 'level_7') {
          // Achievement scene (sesuai puzzle yang baru selesai)
          const achMap: Record<string, string> = {
            puzzle_dual_lock: 'ach_lv7_scene1_complete',
            puzzle_scene2: 'ach_lv7_scene2_complete',
            puzzle_scene3: 'ach_lv7_scene3_complete',
          };
          if (achMap[puzzleId]) get().unlockAchievement(achMap[puzzleId]);

          // Transisi scene diambil dari data puzzle (extraData), bukan hardcode.
          const puzzle = level?.puzzles?.find((p) => p.id === puzzleId);
          const extra = (puzzle as any)?.extraData ?? (puzzle as any)?.extra_data ?? {};
          get().closePuzzle();

          if (puzzleId === 'puzzle_scene2') {
            // Semua tape di inventory dihilangkan setelah scene 2 selesai.
            const s = get();
            const tapes = (inv: Item[]) => inv.filter((i) => i.id.startsWith('item_tape'));
            const t1 = tapes(s.char1Inventory), t2 = tapes(s.char2Inventory), t3 = tapes(s.char3Inventory), t0 = tapes(s.inventory);
            if (t1.length) t1.forEach((i) => get().removeFromChar1Inventory(i.id));
            if (t2.length) t2.forEach((i) => get().removeFromChar2Inventory(i.id));
            if (t3.length) t3.forEach((i) => get().removeFromChar3Inventory(i.id));
            if (t0.length) t0.forEach((i) => get().removeFromInventory(i.id));
          }

          if (extra.goToScene) {
            setTimeout(() => get().goToScene(extra.goToScene), 300);
          }
          if (extra.comicKey) {
            const comic = (level as any)?.sceneComics?.[extra.comicKey];
            if (comic) {
              set({
                sceneComic: {
                  src: comic.src,
                  panels: comic.panels,
                  nextSceneId: extra.comicNextScene ?? 'scene7_4',
                  pageIndex: 0,
                },
              });
            } else if (extra.goToScene) {
              setTimeout(() => get().goToScene(extra.goToScene), 300);
            }
          }
          if (puzzleId === 'puzzle_scene3') {
            set({ desktopOpen: false });
          }
          // puzzle_pod_control: redirect ke scene7_5 sudah ditangani sepenuhnya di GameScene.tsx onSolve
        }

        const currentScene = level.scenes.find((s) => s.id === get().currentSceneId);
        const isLevel6Transition =
          (currentScene?.id.endsWith('_1') && puzzleId === 'puzzle_color_pattern') ||
          (currentScene?.id.endsWith('_2') && puzzleId === 'puzzle_arrow_input');

        if (isLevel6Transition) {
          const originalSceneId = get().currentSceneId;

          const allScenes = level.scenes.filter((s) => !s.id.endsWith('_open'));
          const currentIndex = allScenes.findIndex((s) => s.id === originalSceneId);
          const nextScene = allScenes[currentIndex + 1];

          console.log('isLevel6Transition triggered');
          console.log('originalSceneId:', originalSceneId);
          console.log('nextScene:', nextScene?.id);

          if (nextScene) {
            if (originalSceneId === 'scene_garden_1') {
              get().unlockAchievement('ach_scene1_complete');
            } else if (originalSceneId === 'scene_garden_2') {
              get().unlockAchievement('ach_scene2_complete');
            }

            get().closePuzzle();

            const openScene = level.scenes.find((s) => s.id === originalSceneId + '_open');
            if (openScene) {
              get().setSceneBackgroundOverride(originalSceneId ?? '', openScene.backgroundImage);
              set({ currentSceneId: openScene.id });
            }

            setTimeout(() => {
              // ✅ Fix: as any dihilangkan karena tipe activeTransitionSceneId sudah ditambahkan
              set({
                triggerSceneTransition: true,
                pendingNextSceneId: nextScene.id,
                activeTransitionSceneId: originalSceneId,
              });
            }, 50);
          }
        }
      },

      isPuzzleSolved: (puzzleId) => get().solvedPuzzles.includes(puzzleId),

      markHotspotUsed: (hotspotId) => {
        set((s) => ({ usedHotspots: [...s.usedHotspots, hotspotId] }));
        multiplayer.syncAction('hotspot_used', { hotspotId });
      },

      isHotspotUsed: (hotspotId) => get().usedHotspots.includes(hotspotId),

      // Waktu tetap berjalan saat puzzle terbuka (user minta timer tidak stuck).
openPuzzle: (puzzleId) => set({ activePuzzleId: puzzleId }),
      closePuzzle: () => set({ activePuzzleId: null, timerActive: true }),
      openZoom: (image, label) => set({ zoomModal: { image, label } }),
      closeZoom: () => set({ zoomModal: null }),
      openNote: (image: string, translatedImage?: string) => set({ noteModal: { image, translatedImage } }),
      closeNote: () => set({ noteModal: null }),

      tickTimer: () => {
        if (!get().timerActive) return;
        const level = get().levels.find((l: Level) => l.id === get().currentLevelId);
        if (!level) return;

        const newTime = get().timeElapsed + 1;

        if (newTime >= level.timeLimit) {
          set({ timeElapsed: level.timeLimit, timerActive: false, screen: 'lose' });
        } else {
          set({ timeElapsed: newTime });
        }
      },

      // No-op bila state sudah cocok — mencegah infinite re-render (zustand tetap
      // mem-broadcast ke subscriber bila objek selalu baru).
      pauseTimer: () => set((s) => (s.timerActive ? { timerActive: false } : s)),
      resumeTimer: () => set((s) => (s.timerActive ? s : { timerActive: true })),

      showNotification: (text, type = 'info') => {
        set({ notification: { text, type } });
        setTimeout(() => get().clearNotification(), 3000);
      },

      clearNotification: () => set({ notification: null }),

      completeLevel: async (playerName) => {
        const { currentLevelId, timeElapsed, levels } = get();
        if (!currentLevelId) return;
        const level = levels.find((l: Level) => l.id === currentLevelId);
        if (!level) return;
        const timeLeft = level.timeLimit - timeElapsed;
        let stars = 1;
        if (timeLeft >= level.starThresholds[0]) stars = 3;
        else if (timeLeft >= level.starThresholds[1]) stars = 2;
        const existing = get().levelProgress[currentLevelId];
        const bestTime = existing ? Math.min(existing.bestTime, timeElapsed) : timeElapsed;

        await get().checkTimeAchievement();

        if (currentLevelId === 'level_6') {
          get().unlockAchievement('ach_scene3_complete');
        }
        if (currentLevelId === 'level_7') {
          get().unlockAchievement('ach_lv7_scene5_complete');
          get().unlockAchievement('ach_level7_complete');
          if (stars === 3) {
            get().unlockAchievement('ach_level7_golden');
          }
        }

        set((s) => ({
          screen: 'win',
          timerActive: false,
          levelProgress: {
            ...s.levelProgress,
            [currentLevelId]: {
              completed: true,
              bestTime,
              stars: Math.max(stars, existing?.stars ?? 0),
            },
          },
        }));

        const { token } = get();
        if (token) {
          saveProgress(token, {
            level_key: currentLevelId,
            completed: true,
            best_time: bestTime,
            stars: Math.max(stars, existing?.stars ?? 0),
          }).catch((err: unknown) => console.warn('Gagal save progress:', err));
        }

        if (!get().isGuest) {
          const levelEntry = levels.find((l: Level) => l.id === currentLevelId);
          const numericId = (levelEntry as Level & { _apiId?: number })?._apiId;
          if (numericId) {
            submitScore({
              level_id: numericId,
              player_name: get().player?.username ?? playerName ?? 'Guest',
              time_elapsed: timeElapsed,
              stars,
            }).catch((err: unknown) => console.warn('Gagal submit skor:', err));
          }
        }
      },

      useHint: () => {
        const state = get();
        const level = findLevel(state, state.currentLevelId);
        // Level 7/6 memakai sceneHints (per scene & karakter); hitung jumlah
        // hint yang tersedia dari sana kalau ada.
        const sceneHints = (level as any)?.sceneHints as
          | Record<string, Record<string, { text: string; cost: number }[]>>
          | undefined;
        const charKey = (state.playerCharacter ?? state.activeCharacter ?? 'char1') as string;
        const sceneHintList = sceneHints?.[state.currentSceneId ?? '']?.[charKey];
        const maxHints =
          sceneHintList && sceneHintList.length > 0
            ? sceneHintList.length
            : (level?.hints?.length ?? 0);
        if (state.hintsUsed >= maxHints) return null;
        set({ hintsUsed: state.hintsUsed + 1 });
        return 'hint';
      },

      resetHints: () => set({ hintsRemaining: 3, hintsUsed: 0 }),

      useHintToken: () => {
        const state = get();
        if (state.hintTokens <= 0) return false;
        set({ hintTokens: state.hintTokens - 1 });
        return true;
      },

      refillHintTokens: () => {
        const state = get();
        const max: number = (state as GameStore).hintMaxTokens ?? 5;
        if (state.hintTokens >= max) return;
        set({ hintTokens: state.hintTokens + 1, lastHintRefill: Date.now() });
      },
    }),
    {
      name: 'escape-room-game',
      partialize: (state) => ({
        levelProgress: state.levelProgress,
        hintTokens: state.hintTokens,
        lastHintRefill: state.lastHintRefill,
        unlockedAchievements: state.unlockedAchievements,
        foundTreasures: state.foundTreasures,
        token: state.token,
        player: state.player,
        isGuest: state.isGuest,
        sceneBackgroundOverrides: state.sceneBackgroundOverrides,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<GameStore>;
        const max: number = (currentState as GameStore).hintMaxTokens ?? 5;
        const now = Date.now();
        const lastRefill = persisted.lastHintRefill ?? 0;
        const savedTokens = persisted.hintTokens ?? max;
        let newTokens = savedTokens;
        let newLastRefill = lastRefill;
        if (savedTokens < max && lastRefill > 0) {
          const elapsed = now - lastRefill;
          const refillSeconds: number = (currentState as GameStore).hintRefillSeconds ?? 60;
          const tokensToAdd = Math.floor(elapsed / (refillSeconds * 1000));
          newTokens = Math.min(max, savedTokens + tokensToAdd);
          if (tokensToAdd > 0) newLastRefill = now;
        }
        return {
          ...currentState,
          levelProgress: persisted.levelProgress ?? {},
          hintTokens: newTokens,
          lastHintRefill: newLastRefill,
          unlockedAchievements: persisted.unlockedAchievements ?? [],
          token: persisted.token ?? null,
          player: persisted.player ?? null,
          isGuest: persisted.isGuest ?? false,
          podLoginUsername: '',
          podLoginEmployeeId: '',
          podLoginDone: false,
          podFaceUnlocked: false,
        };
      },
    }
  )
);
