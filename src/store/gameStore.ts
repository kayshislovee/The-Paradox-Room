import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  GameState,
  GameScreen,
  Item,
  Clue,
  SettingsState,
  Level,
  Hotspot,
  PuzzleType,
  Achievement,
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

// ─── SETTINGS STORE ──────────────────────────────────────────────────────────
interface SettingsStore extends SettingsState {
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setLanguage: (lang: 'id' | 'en') => void;
  resetProgress: () => void;
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
      resetProgress: () => {
        useGameStore.getState().resetAllProgress();
      },
    }),
    { name: 'escape-room-settings' }
  )
);

// ─── GAME STORE ───────────────────────────────────────────────────────────────
interface GameStore extends GameState {
  levels: Level[];
  isLoadingLevels: boolean;
  loadLevels: () => Promise<void>;
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
  noteModal: { image: string } | null;
  openNote: (image: string) => void;
  closeNote: () => void;
  tickTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  showNotification: (text: string, type?: 'info' | 'success' | 'error') => void;
  clearNotification: () => void;
  completeLevel: (playerName?: string) => void;
  resetAllProgress: () => void;
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
  unlockedAchievements: string[];
  newAchievement: Achievement | null;
  findTreasure: (treasureId: string) => Promise<void>;
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
sceneBackgroundOverrides: Record<string, string>;
setSceneBackgroundOverride: (sceneId: string, bg: string) => void;
}

const initialGameState: GameState = {
  screen: 'level_select', //splash
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
  unlockedAchievements: [],
  newAchievement: null,
  triggerDoorAnimation: false,
  triggerSceneTransition: false,
pendingNextSceneId: null,
sceneBackgroundOverrides: {},

};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialGameState,
      triggerSceneTransition: false,
setTriggerSceneTransition: (v) => set({ triggerSceneTransition: v }),
pendingNextSceneId: null,
setPendingNextSceneId: (v) => set({ pendingNextSceneId: v }),
      setTriggerDoorAnimation: (v) => set({ triggerDoorAnimation: v }),

sceneBackgroundOverrides: {},
setSceneBackgroundOverride: (sceneId, bg) =>
  set((s) => ({
    sceneBackgroundOverrides: { ...s.sceneBackgroundOverrides, [sceneId]: bg },
  })),      levels: FALLBACK_LEVELS,
      isLoadingLevels: false,
      hintMaxTokens: 5,
      hintRefillSeconds: 60,

      findTreasure: async (treasureId) => {
        const state = get();
        if (state.foundTreasures.includes(treasureId)) return;
        const newFound = [...state.foundTreasures, treasureId];
        set({ foundTreasures: newFound });

        const level = [...state.levels, ...FALLBACK_LEVELS].find((l) => l.id === state.currentLevelId);

        if (!state.isGuest && state.token) {
          try {
            const result = await reportTreasureFound(treasureId, state.token);
            if (result.achievement_unlocked && result.achievement_key) {
              get().unlockAchievementByKey(result.achievement_key);
            }
          } catch (e) {
            console.warn('Gagal report treasure:', e);
            if (!level?.treasures) return;
            const allFound = level.treasures.every((t) => newFound.includes(t.id));
            if (allFound) {
              const treasureAchs = level.achievements?.filter((a) => a.type === 'treasure');
              treasureAchs?.forEach((a) => get().unlockAchievement(a.id));
            }
          }
        } else {
          if (!level?.treasures) return;
          const allFound = level.treasures.every((t) => newFound.includes(t.id));
          if (allFound) {
            const treasureAchs = level.achievements?.filter((a) => a.type === 'treasure');
            treasureAchs?.forEach((a) => get().unlockAchievement(a.id));
          }
        }
      },

      unlockAchievement: (achievementId) => {
        const state = get();
        if (state.unlockedAchievements.includes(achievementId)) return;
        let achievement: Achievement | undefined;
        for (const level of [...state.levels, ...FALLBACK_LEVELS]) {
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
        const allAchievements = [...state.levels, ...FALLBACK_LEVELS].flatMap(
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
        const level = [...state.levels, ...FALLBACK_LEVELS].find(
          (l) => l.id === state.currentLevelId
        );
        if (!level?.achievements) return;
        const timeLeft = level.timeLimit - state.timeElapsed;
        const achievements = level.achievements.filter((a) => a.type === 'time');

        for (const ach of achievements) {
          const shouldUnlock = ach.isGolden
            ? timeLeft > 5 * 60
            : true; // non-golden selalu unlock saat selesai

          if (shouldUnlock) {
            get().unlockAchievement(ach.id);

            // Kirim ke API kalau bukan guest
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
        if (!state.token || state.isGuest) return;
        try {
          const [achievements, treasures] = await Promise.all([
            fetchMyAchievements(state.token),
            fetchMyTreasures(state.token),
          ]);
          set({
            unlockedAchievements: Array.isArray(achievements) ? achievements : [],
            foundTreasures: Array.isArray(treasures) ? treasures : [],
          });
        } catch (e) {
          console.warn('Gagal load progress:', e);
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
            }));
            set({ levels: mapped });
          }
        } catch (err: unknown) {
          console.warn('⚠️ Gagal fetch levels dari API, pakai data lokal.', err);
        } finally {
          set({ isLoadingLevels: false });
        }
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

      goTo: (screen) => set({ screen, foundTreasures: [], newAchievement: null }),

      // ─── START LEVEL (DIPERBARUI) ─────────────────────────────────────────────
      startLevel: async (levelId) => {
        let level: Level | undefined;
        
        // 1. Definisikan array level mana saja yang dipaksa load dari lokal
        const USE_LOCAL_LEVELS = ['level_6']; 

        // 2. Cek apakah level tersebut masuk daftar development lokal
        if (USE_LOCAL_LEVELS.includes(levelId)) {
          console.log(`Development override: Menggunakan data lokal untuk ${levelId}`);
          level = FALLBACK_LEVELS.find((l) => l.id === levelId);
        } else {
          // 3. Jika bukan level lokal, lakukan fetch ke database/API seperti biasa
          try {
            const apiDetail = await fetchLevel(levelId);
            level = {
              id: apiDetail.level_key,
              title: apiDetail.title,
              description: apiDetail.description,
              thumbnail: apiDetail.thumbnail,
              timeLimit: apiDetail.time_limit,
              starThresholds: apiDetail.star_thresholds as [number, number, number],
              music: apiDetail.music ?? undefined,
              dialogMusic: apiDetail.dialog_music ?? undefined,
              exitPuzzleId: '',
              scenes: apiDetail.scenes.map((s) => ({
                id: s.scene_key,
                label: s.label,
                backgroundImage: s.background_image ?? '',
                hotspots: s.hotspots.map((h) => ({
                  id: h.hotspot_key,
                  x: h.x,
                  y: h.y,
                  width: h.width,
                  height: h.height,
                  cursor: h.cursor,
                  image: h.image ?? undefined,
                  zIndex: h.z_index,
                  action: (h.action_data ?? { type: h.action_type }) as Hotspot['action'],
                  visible: (h.visible_data ?? undefined) as Hotspot['visible'],
                })),
              })),
              puzzles: apiDetail.puzzles.map((p) => ({
                id: p.puzzle_key,
                type: p.type as PuzzleType,
                title: p.title,
                answer: p.answer,
                maxDigits: p.max_digits ?? undefined,
                patternSize: p.pattern_size ?? undefined,
                clueIds: p.clue_ids ?? [],
              })),
              hints: apiDetail.hints.map((h) => h.text),
              introDialog: apiDetail.dialog_lines
                .filter((d) => d.type === 'intro')
                .map((d) => ({
                  character: d.character,
                  avatar: d.avatar ?? undefined,
                  avatarLeft: d.avatar_left ?? undefined,
                  avatarRight: d.avatar_right ?? undefined,
                  text: d.text,
                  side: d.side as 'left' | 'right',
                  isSystem: d.is_system,
                })),
              items: [],
              clues: [],
            };
            const sceneWithExit = apiDetail.scenes.find((s) => s.exit_puzzle_id);
            if (sceneWithExit?.exit_puzzle_id) {
              level.exitPuzzleId = sceneWithExit.exit_puzzle_id;
            }
          } catch (err: unknown) {
            console.warn(`⚠️ Gagal fetch level "${levelId}" dari API, pakai data lokal.`, err);
            level = FALLBACK_LEVELS.find((l) => l.id === levelId);
          }
        }

        if (!level) return;

        // Ambil treasures & achievements dari fallback lokal
        const fallback = FALLBACK_LEVELS.find((l) => l.id === levelId);
        if (fallback) {
          level.treasures = fallback.treasures ?? [];
          level.achievements = fallback.achievements ?? [];
        }

        set((s) => {
          const exists = s.levels.some((l) => l.id === level!.id);
          const newLevels = exists
            ? s.levels.map((l) => (l.id === level!.id ? level! : l))
            : [...s.levels, level!];
          return { levels: newLevels };
        });

        set({
          screen: 'gameplay',
          currentLevelId: levelId,
          currentSceneId: level.scenes[0]?.id ?? '',
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
          foundTreasures: [],
          newAchievement: null,
          triggerDoorAnimation: false,
        });
      },
      // ──────────────────────────────────────────────────────────────────────────

      goToScene: (sceneId) => set({ currentSceneId: sceneId }),

      addToInventory: (item) => {
        if (get().inventory.find((i) => i.id === item.id)) return;
        set((s) => ({ inventory: [...s.inventory, item] }));
        get().showNotification(`${item.icon} "${item.name}" ditambahkan ke inventory!`, 'success');
      },

      removeFromInventory: (itemId) =>
        set((s) => ({ inventory: s.inventory.filter((i) => i.id !== itemId) })),

      hasItem: (itemId) => !!get().inventory.find((i) => i.id === itemId),

      addClue: (clue) => {
        if (get().discoveredClues.find((c) => c.id === clue.id)) return;
        set((s) => ({ discoveredClues: [...s.discoveredClues, clue] }));
        get().showNotification(`Clue ditemukan: "${clue.hint}"`, 'info');
      },

      hasClue: (clueId) => !!get().discoveredClues.find((c) => c.id === clueId),

      solvePuzzle: (puzzleId) => {
        if (get().solvedPuzzles.includes(puzzleId)) return;
        set((s) => ({ solvedPuzzles: [...s.solvedPuzzles, puzzleId] }));

        const { levels, currentLevelId, currentSceneId } = get();
        const level = [...levels, ...FALLBACK_LEVELS].find((l) => l.id === currentLevelId);
        if (!level) return;

     if (level.exitPuzzleId === puzzleId) {
  get().closePuzzle();

  // Pakai get() langsung, hindari stale closure
  const sceneId = get().currentSceneId;
  
  // Cari scene open dari FALLBACK_LEVELS (lokal) karena API tidak punya
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
    // Tambahkan scene ini ke level yang aktif di store
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
        const currentScene = level.scenes.find((s) => s.id === get().currentSceneId);
const isLevel6Transition =
  (currentScene?.id.endsWith('_1') && puzzleId === 'puzzle_color_pattern') ||
  (currentScene?.id.endsWith('_2') && puzzleId === 'puzzle_arrow_input');

if (isLevel6Transition) {
  const originalSceneId = get().currentSceneId;
  const currentIndex = level.scenes.findIndex((s) => s.id === originalSceneId);
  const nextScene = level.scenes[currentIndex + 1];
  if (nextScene) {
    get().closePuzzle();

    const openScene = level.scenes.find((s) => s.id === originalSceneId + '_open');
   if (originalSceneId) {
  get().setSceneBackgroundOverride(originalSceneId, openScene?.backgroundImage || '');
    }

    setTimeout(() => {
      set({
        triggerSceneTransition: true,
        pendingNextSceneId: nextScene.id,
        activeTransitionSceneId: originalSceneId,
      } as any);
    }, 50);
  }
}
      },

      isPuzzleSolved: (puzzleId) => get().solvedPuzzles.includes(puzzleId),

      markHotspotUsed: (hotspotId) =>
        set((s) => ({ usedHotspots: [...s.usedHotspots, hotspotId] })),

      isHotspotUsed: (hotspotId) => get().usedHotspots.includes(hotspotId),

      openPuzzle: (puzzleId) => set({ activePuzzleId: puzzleId, timerActive: false }),
      closePuzzle: () => set({ activePuzzleId: null, timerActive: true }),
      openZoom: (image, label) => set({ zoomModal: { image, label } }),
      closeZoom: () => set({ zoomModal: null }),
      openNote: (image) => set({ noteModal: { image } }),
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

      pauseTimer: () => set({ timerActive: false }),
      resumeTimer: () => set({ timerActive: true }),

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

        // Cek achievement waktu sebelum set screen
        await get().checkTimeAchievement();

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

      resetAllProgress: () =>
        set({
          ...initialGameState,
          levelProgress: {},
          hintTokens: get().hintTokens,
          lastHintRefill: get().lastHintRefill,
        }),

      useHint: () => {
        const state = get();
        const level = state.levels.find((l: Level) => l.id === state.currentLevelId);
        const maxHints = level?.hints?.length ?? 0;
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
        };
      },
    }
  )
);