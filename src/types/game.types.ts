// ─── ITEM ───────────────────────────────────────────────────────────────────
export interface Item {
  id: string;
  name: string;
  description: string;
  icon: string;
  image?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  sceneId?: string;
  requiresCharacter?: 'char1' | 'char2';
}

// ─── CLUE ───────────────────────────────────────────────────────────────────
export interface Clue {
  id: string;
  type: 'text' | 'number' | 'color' | 'symbol';
  content: string;
  hint: string;
}

// ─── PUZZLE ─────────────────────────────────────────────────────────────────
export type PuzzleType = 'keypad' | 'sequence' | 'pattern' | 'combination' | 'computer';

export interface Puzzle {
  id: string;
  type: PuzzleType;
  title: string;
  answer: string | string[];
  maxDigits?: number;
  patternSize?: number;
  clueIds: string[];
  reward?: string;
  symbolAnswer?: string[]; // ← tambah ini

}

// ─── HOTSPOT ─────────────────────────────────────────────────────────────────
export interface Hotspot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  cursor?: string;
  action:
  | { type: 'give_item'; itemId: string }
  | { type: 'give_item_and_dialog'; itemId: string; dialogId: string }
  | { type: 'give_clue'; clueId: string }
  | { type: 'open_puzzle'; puzzleId: string }
  | { type: 'open_puzzle_and_dialog'; puzzleId: string; dialogId: string }
  | { type: 'open_zoom'; zoomImage: string; label: string }
  | { type: 'open_zoom_and_dialog'; zoomImage: string; label: string; dialogId: string }
  | { type: 'use_item'; requiredItemId: string; resultClueId?: string; resultMessage: string }
  | { type: 'message'; text: string }
  | { type: 'open_note'; image: string; translatedImage?: string } // ← tambah translatedImage
  | { type: 'open_note_and_dialog'; image: string; translatedImage?: string; dialogId: string }
  | { type: 'use_item'; requiredItemId: string; resultClueId?: string; resultMessage: string }
  | { type: 'message'; text: string }
  | { type: 'use_flashlight' }
  | { type: 'go_to_scene'; sceneId: string }
  | { type: 'go_to_scene_and_dialog'; sceneId: string; dialogId: string }
  | { type: 'open_hacking_minigame' }
  | { type: 'open_hacking_minigame_and_dialog'; dialogId: string }
  | { type: 'open_desktop' }
  | { type: 'open_desktop_and_dialog'; dialogId: string }
  | { type: 'open_pod_control' }
  | { type: 'open_chest'; chestId: string }
  | { type: 'open_reactor' }
  | { type: 'open_cooling' }    // ← tambah
  | { type: 'open_power' }    // ← tambah
  | { type: 'open_maze' }     // ← tambah
  | { type: 'trigger_scene_dialog'; dialogId: string } // ← trigger custom scene dialog
  | { type: 'enter_subview'; subView: string }
  | { type: 'enter_subview_and_dialog'; subView: string; dialogId: string }
  | { type: 'exit_subview' }
  glitchImage?: string; // ← gambar untuk reactor glitch

  visible?: {
    requiresItem?: string;
    requiresSolved?: string;
    hideAfterUsed?: boolean;
    requiresCharacter?: 'char1' | 'char2';  // ← hanya muncul untuk karakter tertentu
    requiresXVision?: boolean;   // ← hanya muncul saat x-vision aktif
  };
  image?: string;
  zIndex?: number;
  imageStyle?: {
    objectFit?: string;
    objectPosition?: string;
  };
  alreadyUsed?: boolean;
  xVisionImage?: string; // ← gambar alternatif saat X Vision aktif

}

// ─── SCENE ───────────────────────────────────────────────────────────────────
export interface Scene {
  id: string;
  label: string;
  backgroundImage: string;
  hotspots: Hotspot[];
  comicPages?: ComicPage[];
  sceneComic?: SceneComic;
  introDialog?: DialogLine[];
  hidden?: boolean;
  // ── Level 7 only ──────────────────────────────────────────────────────────
  // Setiap scene bisa punya layer karakter berbeda
  char1Layer?: CharacterLayer;  // POV karakter 1 (Multi Language Reader)
  char2Layer?: CharacterLayer;  // POV karakter 2 (X Vision)
  char3Layer?: CharacterLayer;  // POV karakter 3 (X Vision)
  autoSwitchChar?: 'char1' | 'char2' | 'char3';

}

export interface SceneComic {
  src: string;
  srcByReleasedCharacter?: Partial<Record<'char1' | 'char2', ComicPage>>;
  panels: ComicPanel[];
}

// ─── CHARACTER LAYER ─────────────────────────────────────────────────────────
export interface CharacterLayer {
  backgroundImage: string;
  backgroundImageXVision?: string;  // ← optional, dipakai saat X Vision aktif
  hotspots: Hotspot[];
  hotspotsXVision?: Hotspot[];    // ← optional, hanya muncul saat X Vision aktif
}
// ─── CHARACTER LAYER (Level 7) ───────────────────────────────────────────────
// Setiap karakter punya background dan hotspot sendiri dalam 1 scene
export interface CharacterLayer {
  backgroundImage: string;
  backgroundImageXVision?: string; // bg alternatif saat X Vision aktif (char2 only)
  hotspots: Hotspot[];
}

// ─── CHARACTER (Level 7) ─────────────────────────────────────────────────────
export type CharacterId = 'char1' | 'char2' | 'char3';

export interface Character {
  id: CharacterId;
  name: string;
  avatar: string;           // gambar avatar untuk HUD
  skill: CharacterSkill;
}

export interface CharacterSkill {
  id: string;
  name: string;
  description: string;
  icon: string;
  cooldown?: number;        // detik cooldown setelah dipakai (opsional)
}
// ─── ACHIEVEMENT ─────────────────────────────────────────────────────────────
export type AchievementType = 'time' | 'treasure';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: AchievementType;
  levelId?: string;
  isGolden?: boolean;
}

// ─── TREASURE ────────────────────────────────────────────────────────────────
export interface Treasure {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  image?: string;
  achievementId: string;
  sceneId?: string;
  name?: string;
  description?: string;
}

// ─── LEVEL ───────────────────────────────────────────────────────────────────
export interface Level {
  id: string;
  dialogMusic?: string;
  hints?: string[];
  // Hint per scene & per karakter (level 7 multiplayer). Tiap hint punya
  // biaya token sendiri. Kalau ada, menggantikan `hints`.
  sceneHints?: Record<string, Record<string, { text: string; cost: number }[]>>;
  isLocked?: boolean;
  title: string;
  music?: string;
  description: string;
  thumbnail: string;
  timeLimit: number;
  scenes: Scene[];
  sceneComics?: Record<
    string,
    SceneComic & {
      trigger: 'on_enter' | 'on_reactor_complete' | 'on_all_complete' | 'on_cctv_complete' | 'on_pod_release' | 'on_final_button' | 'on_post_brainmaze';
    }
  >;
  items: Item[];
  treasures?: Treasure[];
  achievements?: Achievement[];
  clues: Clue[];
  introDialog?: DialogLine[];
  puzzles: Puzzle[];
  exitPuzzleId: string;
  starThresholds: [number, number, number];
  characterAvatar?: string;
  characterName?: string;
  exitLightPos?: { x: number; y: number };
  exitDoorShape?: { width: number; height: number };
  doorPolygon?: { x: number; y: number }[];
  exitDoorPoints?: string;
  sceneTransitionPoints?: Record<string, string>;

  comicSrc?: string;
  sceneDialogs?: Record<string, DialogLine[]>;
  comicPages?: ComicPage[];
  characters?: Character[];  // daftar karakter yang bisa dimainkan
  isLevel7?: boolean;
}
export interface ComicPanel {
  x: number;
  y: number;
  width: number;
  height: number;
  enterFrom?: 'fade' | 'scale' | 'slide-left' | 'slide-right' | 'slide-up';
  effect?: 'flash' | 'shake' | 'none';
  duration?: number;
  zoom?: number;
  sfx?: string
}

export interface ComicPage {
  src: string;
  panels: ComicPanel[];
}
// ─── GAME SCREEN ─────────────────────────────────────────────────────────────
export type GameScreen =
  | 'splash'
  | 'main_menu'
  | 'level_select'
  | 'loading'
  | 'gameplay'
  | 'win'
  | 'lose'
  | 'lobby'
  | 'settings'
  | 'achievements'
  | 'treasures';

// ─── GAME STATE ──────────────────────────────────────────────────────────────
export interface GameState {
  screen: GameScreen;
  currentLevelId: string | null;
  currentSceneId: string | null;
  inventory: Item[];
  discoveredClues: Clue[];
  solvedPuzzles: string[];
  usedHotspots: string[];
  timeElapsed: number;
  timerActive: boolean;
  hintsRemaining: number;
  hintsUsed: number;
  hintTokens: number;
  lastHintRefill: number;
  player: { id: number; username: string; email: string } | null;
  token: string | null;
  isGuest: boolean;
  foundTreasures: string[];
  unlockedAchievements: string[];
  newAchievement: Achievement | null;
  levelProgress: Record<string, LevelProgress>;
  zoomModal: { image: string; label: string } | null;
  activePuzzleId: string | null;
  notification: { text: string; type: 'info' | 'success' | 'error' } | null;
  triggerDoorAnimation: boolean;
  triggerSceneTransition: boolean;
  pendingNextSceneId: string | null;
  sceneBackgroundOverrides: Record<string, string>;
  lobbyCode: string | null;
  lobbyPuzzleInputs: Record<string, any>;
  lobbyLastInputBy: string | null;
  stopVoiceCallback: (() => void) | null;
  voiceActive: boolean;
  noteModal: { image: string; translatedImage?: string } | null; // ← tambah translatedImage
  activeCharacter: CharacterId;      // karakter yang sedang aktif
  xVisionActive: boolean;            // skill X Vision karakter 2
  translationActive: boolean;
  puzzleInputStates: Record<string, any>;
  uvFlashlightActive: boolean;
  char1Inventory: Item[];
  char2Inventory: Item[];
  tapeReaderOpen: boolean;


}
export interface SubView {
  backgroundImage: string;
  backgroundImageXVision?: string;
  hotspots: Hotspot[];
}

export interface Scene {
  id: string;
  label: string;
  backgroundImage: string;
  hotspots: Hotspot[];
  sceneComic?: SceneComic;
  hidden?: boolean;
  highlightHotspots?: string[];
  initialFocusHotspot?: string;
  // ── Level 7 only ──────────────────────────────────────────────────────────
  char1Layer?: CharacterLayer;
  char2Layer?: CharacterLayer;
  char3Layer?: CharacterLayer;
  char1SubViews?: Record<string, SubView>;
  char2SubViews?: Record<string, SubView>;
  char3SubViews?: Record<string, SubView>;
  autoSwitchChar?: 'char1' | 'char2' | 'char3';
}
export interface LevelProgress {
  completed: boolean;
  bestTime: number;
  stars: number;
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────
export interface SettingsState {
  musicVolume: number;
  sfxVolume: number;
  language: 'id' | 'en';
}

export interface DialogLine {
  character: string;
  avatar?: string;
  text: string;
  avatarLeft?: string;
  avatarRight?: string;
  side?: 'left' | 'right';
  isSystem?: boolean;
  avatarLeftStyle?: {
    bottom?: number;
    left?: number;
    height?: number;
  };
  avatarRightStyle?: {
    bottom?: number;
    right?: number;
    height?: number;
  };
}

export interface Dialog {
  id: string;
  lines: DialogLine[];
}