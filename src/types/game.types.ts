// ─── ITEM ───────────────────────────────────────────────────────────────────
export interface Item {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// ─── CLUE ───────────────────────────────────────────────────────────────────
export interface Clue {
  id: string;
  type: 'text' | 'number' | 'color' | 'symbol';
  content: string;
  hint: string;
}

// ─── PUZZLE ─────────────────────────────────────────────────────────────────
export type PuzzleType = 'keypad' | 'sequence' | 'pattern' | 'combination';

export interface Puzzle {
  id: string;
  type: PuzzleType;
  title: string;
  answer: string | string[];
  maxDigits?: number;
  patternSize?: number;
  clueIds: string[];
  reward?: string;
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
    | { type: 'give_clue'; clueId: string }
    | { type: 'open_puzzle'; puzzleId: string }
    | { type: 'open_zoom'; zoomImage: string; label: string }
    | { type: 'open_note'; image: string }
    | { type: 'use_item'; requiredItemId: string; resultClueId?: string; resultMessage: string }
    | { type: 'message'; text: string };
  visible?: {
    requiresItem?: string;
    requiresSolved?: string;
    hideAfterUsed?: boolean;
  };
  image?: string;
  zIndex?: number;
  imageStyle?: {
    objectFit?: string;
    objectPosition?: string;
  };
  alreadyUsed?: boolean;
}

// ─── SCENE ───────────────────────────────────────────────────────────────────
export interface Scene {
  id: string;
  label: string;
  backgroundImage: string;
  hotspots: Hotspot[];
  hidden?: boolean;
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
}

// ─── LEVEL ───────────────────────────────────────────────────────────────────
export interface Level {
  id: string;
  dialogMusic?: string;
  hints?: string[];
  isLocked?: boolean;
  title: string;
  music?: string;
  description: string;
  thumbnail: string;
  timeLimit: number;
  scenes: Scene[];
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
  sfx?:string
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
  | 'gameplay'
  | 'win'
  | 'lose'
  | 'settings'
  | 'achievements';

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
  noteModal: { image: string } | null;
  activePuzzleId: string | null;
  notification: { text: string; type: 'info' | 'success' | 'error' } | null;
  triggerDoorAnimation: boolean;
  triggerSceneTransition: boolean;
pendingNextSceneId: string | null;
sceneBackgroundOverrides: Record<string, string>;
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