// ─── ITEM ───────────────────────────────────────────────────────────────────
export interface Item {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji atau path gambar
}

// ─── CLUE ───────────────────────────────────────────────────────────────────
export interface Clue {
  id: string;
  type: 'text' | 'number' | 'color' | 'symbol';
  content: string; // isi clue, misal "3-7-2" atau "MERAH"
  hint: string;    // deskripsi clue untuk player
}

// ─── PUZZLE ─────────────────────────────────────────────────────────────────
export type PuzzleType = 'keypad' | 'sequence' | 'pattern' | 'combination';

export interface Puzzle {
  id: string;
  type: PuzzleType;
  title: string;
  answer: string | string[]; // string untuk keypad/combination, string[] untuk sequence
  maxDigits?: number;        // untuk keypad
  patternSize?: number;      // untuk pattern (misal 3x3 = 9)
  clueIds: string[];         // clue yang dibutuhkan untuk solve
  reward?: string;           // itemId yang didapat setelah solve (opsional)
}

// ─── HOTSPOT (Objek yang bisa diklik di scene) ───────────────────────────────
export interface Hotspot {
  id: string;
 
  x: number;       // posisi % dari kiri
  y: number;       // posisi % dari atas
  width: number;   // ukuran % lebar
  height: number;  // ukuran % tinggi
  cursor?: string; // 'pointer' | 'zoom-in' | dll

  // Aksi saat diklik:
  action:
    | { type: 'give_item'; itemId: string }
    | { type: 'give_clue'; clueId: string }
    | { type: 'open_puzzle'; puzzleId: string }
    | { type: 'open_zoom'; zoomImage: string; label: string }
  | { type: 'open_note'; image: string }
    | { type: 'use_item'; requiredItemId: string; resultClueId?: string; resultMessage: string }
    | { type: 'message'; text: string };

  // Kondisi kemunculan:
  visible?: {
    requiresItem?: string;      // muncul hanya jika player punya item ini
    requiresSolved?: string;    // muncul hanya jika puzzle ini sudah solved
    hideAfterUsed?: boolean;    // hilang setelah diklik

    
  };
image?: string; 
 zIndex?: number;       // path ke asset PNG
  imageStyle?: {         // style tambahan untuk gambar
    objectFit?: string;
    objectPosition?: string;
  };
  alreadyUsed?: boolean; // internal state
}

// ─── SCENE (Satu view/sudut ruangan) ─────────────────────────────────────────
export interface Scene {
  id: string;
  label: string;
  backgroundImage: string; // path ke gambar background
  hotspots: Hotspot[];
}

// ─── LEVEL ──────────────────────────────────────────────────────────────────
export interface Level {
  id: string;
  title: string;
  music?: string;
  description: string;
  thumbnail: string;
  timeLimit: number;   // detik
  scenes: Scene[];
  items: Item[];
  clues: Clue[];
  puzzles: Puzzle[];
  exitPuzzleId: string; // puzzle terakhir yang harus diselesaikan untuk escape
  starThresholds: [number, number, number]; // [3bintang, 2bintang, 1bintang] dalam detik tersisa
}

// ─── GAME STATE ──────────────────────────────────────────────────────────────
export type GameScreen =
'splash'
  | 'main_menu'
  | 'level_select'
  | 'gameplay'
  | 'win'
  | 'settings';

export interface GameState {
  screen: GameScreen;
  currentLevelId: string | null;
  currentSceneId: string | null;
  inventory: Item[];
  discoveredClues: Clue[];
  solvedPuzzles: string[];    // array of puzzleId
  usedHotspots: string[];     // array of hotspotId
  timeElapsed: number;        // detik
  timerActive: boolean;

  // Progress tersimpan per level
  levelProgress: Record<string, LevelProgress>;

  // Zoom modal
  zoomModal: { image: string; label: string } | null;
 noteModal: { image: string } | null;

  // Active puzzle modal
  activePuzzleId: string | null;

  // Notification/toast
  notification: { text: string; type: 'info' | 'success' | 'error' } | null;
}

export interface LevelProgress {
  completed: boolean;
  bestTime: number;   // detik
  stars: number;      // 1-3
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────
export interface SettingsState {
  musicVolume: number;   // 0-1
  sfxVolume: number;     // 0-1
  language: 'id' | 'en';
}
