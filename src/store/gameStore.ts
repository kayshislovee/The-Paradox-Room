import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  GameState,
  GameScreen,
  Item,
  Clue,
  SettingsState,
} from '../types/game.types';
import { LEVELS } from '../data/levels';

// ─── SETTINGS STORE ──────────────────────────────────────────────────────────
interface SettingsStore extends SettingsState {
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setLanguage: (lang: 'id' | 'en') => void;
  resetProgress: () => void;
   musicMuted: boolean;           // ← tambahkan ini
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
      musicMuted: false,                                           // ← tambahkan ini
toggleMusicMuted: () => set((s) => ({ musicMuted: !s.musicMuted })), // ← tambahkan i
      resetProgress: () => {
        useGameStore.getState().resetAllProgress();
      },
    }),
    { name: 'escape-room-settings' }
  )
);

// ─── GAME STORE ───────────────────────────────────────────────────────────────
interface GameStore extends GameState {
  // Navigasi
  goTo: (screen: GameScreen) => void;
  startLevel: (levelId: string) => void;
  goToScene: (sceneId: string) => void;

  // Gameplay actions
  addToInventory: (item: Item) => void;
  removeFromInventory: (itemId: string) => void;
  hasItem: (itemId: string) => boolean;
  addClue: (clue: Clue) => void;
  hasClue: (clueId: string) => boolean;
  solvePuzzle: (puzzleId: string) => void;
  isPuzzleSolved: (puzzleId: string) => boolean;
  markHotspotUsed: (hotspotId: string) => void;
  isHotspotUsed: (hotspotId: string) => boolean;

  // Puzzle modal
  openPuzzle: (puzzleId: string) => void;
  closePuzzle: () => void;

  // Zoom modal
  openZoom: (image: string, label: string) => void;
  closeZoom: () => void;

  // Note modal
 noteModal: { image: string } | null;
openNote: (image: string) => void;
  closeNote: () => void;

  // Timer
  tickTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;

  // Notification
  showNotification: (text: string, type?: 'info' | 'success' | 'error') => void;
  clearNotification: () => void;

  // Win / complete level
  completeLevel: () => void;

  // Progress
  resetAllProgress: () => void;
}

const initialGameState: GameState = {
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
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialGameState,

      // ── Navigasi ──────────────────────────────────────────────────────────
      goTo: (screen) => set({ screen }),

      startLevel: (levelId) => {
        const level = LEVELS.find((l) => l.id === levelId);
        if (!level) return;
        set({
          screen: 'gameplay',
          currentLevelId: levelId,
          currentSceneId: level.scenes[0].id,
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
        });
      },

      goToScene: (sceneId) => set({ currentSceneId: sceneId }),

      // ── Inventory ─────────────────────────────────────────────────────────
      addToInventory: (item) => {
        if (get().inventory.find((i) => i.id === item.id)) return;
        set((s) => ({ inventory: [...s.inventory, item] }));
        get().showNotification(`${item.icon} "${item.name}" ditambahkan ke inventory!`, 'success');
      },

      removeFromInventory: (itemId) =>
        set((s) => ({ inventory: s.inventory.filter((i) => i.id !== itemId) })),

      hasItem: (itemId) => !!get().inventory.find((i) => i.id === itemId),

      // ── Clue ──────────────────────────────────────────────────────────────
      addClue: (clue) => {
        if (get().discoveredClues.find((c) => c.id === clue.id)) return;
        set((s) => ({ discoveredClues: [...s.discoveredClues, clue] }));
        get().showNotification(`Clue ditemukan: "${clue.hint}"`, 'info');
      },

      hasClue: (clueId) => !!get().discoveredClues.find((c) => c.id === clueId),

      // ── Puzzle ────────────────────────────────────────────────────────────
      solvePuzzle: (puzzleId) => {
        if (get().solvedPuzzles.includes(puzzleId)) return;
        set((s) => ({ solvedPuzzles: [...s.solvedPuzzles, puzzleId] }));

        // Cek apakah ini adalah exit puzzle
        const level = LEVELS.find((l) => l.id === get().currentLevelId);
        if (level && level.exitPuzzleId === puzzleId) {
          setTimeout(() => get().completeLevel(), 800);
        }
      },

      isPuzzleSolved: (puzzleId) => get().solvedPuzzles.includes(puzzleId),

      // ── Hotspot ───────────────────────────────────────────────────────────
      markHotspotUsed: (hotspotId) =>
        set((s) => ({ usedHotspots: [...s.usedHotspots, hotspotId] })),

      isHotspotUsed: (hotspotId) => get().usedHotspots.includes(hotspotId),

      // ── Modal Puzzle ──────────────────────────────────────────────────────
      openPuzzle: (puzzleId) => {
        set({ activePuzzleId: puzzleId, timerActive: false });
      },

      closePuzzle: () => set({ activePuzzleId: null, timerActive: true }),

      // ── Modal Zoom ────────────────────────────────────────────────────────
      openZoom: (image, label) => set({ zoomModal: { image, label } }),
      closeZoom: () => set({ zoomModal: null }),
      noteModal: null,
      openNote: (image) => set({ noteModal: { image } }),
      closeNote: () => set({ noteModal: null }),

      // ── Timer ─────────────────────────────────────────────────────────────
      tickTimer: () => {
        if (!get().timerActive) return;
        const level = LEVELS.find((l) => l.id === get().currentLevelId);
        if (!level) return;
        const newTime = get().timeElapsed + 1;
        if (newTime >= level.timeLimit) {
          // Game over: waktu habis
          set({ timeElapsed: level.timeLimit, timerActive: false, screen: 'win' });
        } else {
          set({ timeElapsed: newTime });
        }
      },

      pauseTimer: () => set({ timerActive: false }),
      resumeTimer: () => set({ timerActive: true }),

      // ── Notification ──────────────────────────────────────────────────────
      showNotification: (text, type = 'info') => {
        set({ notification: { text, type } });
        setTimeout(() => get().clearNotification(), 3000);
      },

      clearNotification: () => set({ notification: null }),

      // ── Win ───────────────────────────────────────────────────────────────
      completeLevel: () => {
        const { currentLevelId, timeElapsed } = get();
        if (!currentLevelId) return;

        const level = LEVELS.find((l) => l.id === currentLevelId);
        if (!level) return;

        const timeLeft = level.timeLimit - timeElapsed;
        let stars = 1;
        if (timeLeft >= level.starThresholds[0]) stars = 3;
        else if (timeLeft >= level.starThresholds[1]) stars = 2;

        const existing = get().levelProgress[currentLevelId];
        const bestTime = existing
          ? Math.min(existing.bestTime, timeElapsed)
          : timeElapsed;

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
      },

      // ── Reset ─────────────────────────────────────────────────────────────
      resetAllProgress: () =>
        set({ ...initialGameState, levelProgress: {} }),
    }),
    {
      name: 'escape-room-game',
      partialize: (state) => ({ levelProgress: state.levelProgress }),
    }
  )
);
