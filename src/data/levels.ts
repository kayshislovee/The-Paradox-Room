import type { Level } from '../types/game.types';

// ─────────────────────────────────────────────────────────────────────────────
//  LEVEL 1 — "Lab Misterius"
//  Alur:
//    1. Klik komputer → zoom → lihat clue pola biner (10011001)
//    2. Pergi ke panel tuas di kanan → aktifkan tuas sesuai pola
//    3. Pintu terbuka → ESCAPE!
// ─────────────────────────────────────────────────────────────────────────────
const LEVEL_1: Level = {
  id: 'level_1',
  music: '/audio/level2_music.mp3', 
  title: 'Lab Misterius',
  description: 'Kamu terjebak di lab rahasia. Baca komputer untuk menemukan kode, lalu aktifkan tuas dengan pola yang benar untuk membuka pintu!',
  thumbnail: '',
  timeLimit: 600,
  starThresholds: [400, 200, 60],
  

  scenes: [
    {
      id: 'scene_lab',
      label: 'Ruangan Lab',
      backgroundImage: '/backgrounds/lab_room.png',
      hotspots: [
        // ── KOMPUTER (kiri layar) ─────────────────────────────────────────
        {
          id: 'hs_computer',
        
          x: -5,
          y: 33,
          width: 45,
          height: 45,
          cursor: 'zoom-in',
          image: '/objects/monitor.png', 
          action: {
            type: 'open_zoom',
            zoomImage: '/zooms/computer_screen.png',
            label: 'Layar Komputer — Baca dengan teliti...',
          },
        },

        // ── BUKU CATATAN di meja ──────────────────────────────────────────
       

        // ── PANEL TUAS (kanan layar) ──────────────────────────────────────
        {
          id: 'hs_lever_panel',
        
          x: 67.5,
          y: 37,
          width: 15,
          height: 10,
          cursor: 'pointer',
          image: '/objects/lever.png', 
          action: {
            type: 'open_puzzle',
            puzzleId: 'puzzle_lever_pattern',
          },
        },

        // ── PINTU (muncul setelah puzzle lever solved) ────────────────────
        {
          id: 'hs_door',

          x: 42,
          y: 8,
          width: 26,
          height: 72,
          cursor: 'pointer',
          action: {
            type: 'message',
            text: ' Pintu sudah terbuka! Kamu berhasil kabur dari lab!',
          },
          visible: {
            requiresSolved: 'puzzle_lever_pattern',
          },
        },
      ],
    },
  ],

  items: [],

  clues: [
    
  ],

  puzzles: [
    {
      id: 'puzzle_lever_pattern',
      type: 'pattern',
      title: ' Panel Lever',
   
      answer: '10011001',
      patternSize: 8,
      clueIds: [],
    },
  ],

  exitPuzzleId: 'puzzle_lever_pattern',
};

const LEVEL_2: Level = {
  id: 'level_2',
  music: '/audio/level2_music.mp3', 
  title: 'Koridor Sekolah',
  description: 'Terjebak di koridor sekolah! Baca semua notes untuk menemukan kode 3 digit lalu buka pintu EXIT.',
  thumbnail: '',
  timeLimit: 480,
  starThresholds: [360, 180, 30],

  scenes: [
    {
      id: 'scene_hallway',
      label: 'Koridor Sekolah',
      backgroundImage: '/backgrounds/school_hallway.png',
      hotspots: [
        // ── NOTES 1 — di loker paling kiri (ditempel, berisi clue basket) ───
        {
          id: 'hs_note1',
          x: 3.5,
          y: 30,
          width: 10,
          height: 15,
          cursor: 'zoom-in',
          image: '/objects/note2.png',
          zIndex: 2,
         action: {
  type: 'open_note',
  image: '/notes/note2.png', // ← path ke asset
},
        },

        // ── NOTES 2 — di lantai dekat bola basket kiri (none) ───────────────
        {
          id: 'hs_note2',
          x: 28,
          y: 83,
          width: 10,
          height: 15,
          cursor: 'zoom-in',
           image: '/objects/notenone1.png',
          action: {
            type: 'open_note',
            image: '/notes/none.png', // ← path ke asset
          },
        },

        // ── NOTES 3 — paling kanan lantai (clue blue balls) ─────────────────
        {
          id: 'hs_note3',
          x: 65,
          y: 80,
          width: 13,
          height: 18,
          cursor: 'zoom-in',
           image: '/objects/note1.png',
           zIndex: 2,
          action: {
            type: 'open_note',
            image: '/notes/note1.png', // ← path ke asset
          },
        },

        // ── NOTES 4 — tengah lantai (clue lockers combinations) ─────────────
        {
          id: 'hs_note4',
          x: 46,
          y: 81,
          width: 13,
          height: 18,
          cursor: 'zoom-in',
           image: '/objects/note3.png',
          action: {
            type: 'open_note',
           image: '/notes/note3.png', // ← path ke asset
          },
        },

        // ── NOTES 5 — loker kanan atas (none) ───────────────────────────────
        {
          id: 'hs_note5',
          x: 86.6,
          y: 34,
          width: 10,
          height: 15,
          cursor: 'zoom-in',
           image: '/objects/notenone2.png',
          action: {
            type: 'open_note',
           image: '/notes/none.png', // ← path ke asset
          },
        },

        // ── KEYPAD di sebelah pintu (puzzle utama) ───────────────────────────
        {
          id: 'hs_keypad',
          x: 56,
          y: 30,
          width: 15,
          height: 18,
          cursor: 'pointer',
           image: '/objects/codepanel.png',
          action: {
            type: 'open_puzzle',
            puzzleId: 'puzzle_exit_keypad',
          },
        },

        // ── PINTU EXIT (muncul setelah keypad solved) ────────────────────────
        {
          id: 'hs_exit_door',
          x: 40,
          y: 15,
          width: 22,
          height: 65,
          cursor: 'pointer',
          action: {
            type: 'message',
            text: ' Kamu berhasil kabur dari sekolah! Selamat!',
          },
          visible: {
            requiresSolved: 'puzzle_exit_keypad',
          },
        },

        // ── MADING di sebelah kiri pintu (tidak bisa diklik, dekoratif) ──────
        // Note yang ditempel di sebelah pintu → tidak interaktif sesuai brief

        // ── BOLA BASKET — easter egg info ────────────────────────────────────
       

        // ── APEL di tempat sampah ─────────────────────────────────────────────
       
        // ── LOKER TERBUKA kiri — bisa dilihat isinya ─────────────────────────
        
      ],
    },
  ],

  items: [],

  clues: [],

  puzzles: [
    {
      id: 'puzzle_exit_keypad',
      type: 'keypad',
      title: ' Keypad Pintu EXIT',
     
      answer: '374',
      maxDigits: 3,
      clueIds: [],
    },
  ],

  exitPuzzleId: 'puzzle_exit_keypad',
};

const LEVEL_3: Level = {
  id: 'level_3',
  title: 'Perpustakaan',
  description: 'Terjebak di perpustakaan misterius. Baca catatan yang tersebar dan temukan kode untuk membuka pintu!',
  thumbnail: '',
  timeLimit: 480,
  starThresholds: [360, 180, 30],
  music: '/audio/level3_music.mp3',

  scenes: [
    {
      id: 'scene_library',
      label: 'Perpustakaan',
      backgroundImage: '/backgrounds/library.png',
      hotspots: [
        // Notes kiri
        {
          id: 'hs_note_left',
          x: 3,
          y: 30,
          width: 26,
          height: 20,
          cursor: 'zoom-in',
          image: '/objects/note_perpus.png',
          action: {
            type: 'open_note',
            image: '/notes/notekiri.png',
          },
        },

        // Notes kanan
        {
          id: 'hs_note_right',
          x: 68,
          y: 30,
          width: 26,
          height: 20,
          cursor: 'zoom-in',
          image: '/objects/note_perpus.png',
          action: {
            type: 'open_note',
            image: '/notes/notekanan.png',
          },
        },

        // Keypad
        {
          id: 'hs_keypad_library',
          x: 81,
          y: 42,
          width: 16,
          height: 24,
          cursor: 'pointer',
          image: '/objects/code_perpus.png',
          action: {
            type: 'open_puzzle',
            puzzleId: 'puzzle_library_door',
          },
        },

        // Pintu (muncul setelah puzzle solved)
        {
          id: 'hs_door_library',
          x: 82,
          y: 5,
          width: 16,
          height: 88,
          cursor: 'pointer',
          action: {
            type: 'message',
            text: ' Pintu terbuka! Kamu berhasil kabur dari perpustakaan!',
          },
          visible: {
            requiresSolved: 'puzzle_library_door',
          },
        },
      ],
    },
  ],

  items: [],
  clues: [],

  puzzles: [
    {
      id: 'puzzle_library_door',
      type: 'keypad',
      title: ' Panel Kode Pintu',
      answer: '573',
      maxDigits: 3,
      clueIds: [],
    },
  ],

  exitPuzzleId: 'puzzle_library_door',
};

const LEVEL_4: Level = {
  id: 'level_4',
  title: 'Minimarket',
  description: 'Terjebak di minimarket! Hitung total harga barang yang ada di meja kasir dan masukkan kodenya untuk membuka pintu.',
  thumbnail: '',
  timeLimit: 480,
  starThresholds: [360, 180, 30],
  music: '/audio/level4_music.mp3',

  scenes: [
    {
      id: 'scene_store',
      label: 'Minimarket',
      backgroundImage: '/backgrounds/minimarket.png',
      hotspots: [
        // Komputer kasir — langsung zoom input kode
        {
          id: 'hs_computer_store',
          x: 1,
          y: 55,
          width: 40,
          height: 34,
          cursor: 'zoom-in',
          image: '/objects/monitormarket.png',
          action: {
            type: 'open_puzzle',
            puzzleId: 'puzzle_store_computer',
          },
        },

        // Buku "count" di meja — clue hint
        

        // Pintu (muncul setelah puzzle solved)
        {
          id: 'hs_door_store',
          x: 38,
          y: 5,
          width: 24,
          height: 80,
          cursor: 'pointer',
          action: {
            type: 'message',
            text: 'Pintu terbuka! Kamu berhasil kabur dari minimarket!',
          },
          visible: {
            requiresSolved: 'puzzle_store_computer',
          },
        },
      ],
    },
  ],

  items: [],
  clues: [],

  puzzles: [
    {
      id: 'puzzle_store_computer',
      type: 'keypad',
      title: 'Komputer Kasir',
      
      answer: '755',
      maxDigits: 3,
      clueIds: [],
    },
  ],

  exitPuzzleId: 'puzzle_store_computer',
};

const LEVEL_5: Level = {
  id: 'level_5',
  title: 'Toko Mainan',
  description: 'Terjebak di toko mainan! Baca catatan yang ada dan masukkan kode 6 digit untuk membuka pintu EXIT.',
  thumbnail: '',
  timeLimit: 540,
  starThresholds: [420, 240, 60],
  music: '/audio/level5_music.mp3',

  scenes: [
    {
      id: 'scene_toystore',
      label: 'Toko Mainan',
      backgroundImage: '/backgrounds/toystore.png',
      hotspots: [
        // Layar komputer
        {
          id: 'hs_computer_toy',
          x: 38,
          y: 44,
          width: 55,
          height: 39,
          cursor: 'zoom-in',
          image: '/objects/monitortoy.png',
          zIndex: 1, 
          action: {
            type: 'open_puzzle',
            puzzleId: 'puzzle_toystore_door',
          },
        },

        // Note di samping komputer (di layar, sticky note)
        {
          id: 'hs_note_monitor',
          x: 69,
          y: 47.5,
          width: 10,
          height: 14,
          cursor: 'zoom-in',
          image: '/objects/notemonitor.png',
          zIndex: 2, 
          action: {
            type: 'open_note',
            image: '/notes/toynote1.png',
          },
        },

        // Note di meja (bawah)
        {
          id: 'hs_note_desk',
          x: 22,
          y: 75,
          width: 15,
          height: 14,
          cursor: 'zoom-in',
          image: '/objects/notemeja.png',
          zIndex: 3, 
          action: {
            type: 'open_note',
            image: '/notes/toynote2.png',
          },
        },

        // Pintu EXIT (muncul setelah puzzle solved)
        {
          id: 'hs_door_toy',
          x: 38,
          y: 8,
          width: 22,
          height: 72,
          cursor: 'pointer',
          action: {
            type: 'message',
            text: 'Pintu terbuka! Kamu berhasil kabur dari toko mainan!',
          },
          visible: {
            requiresSolved: 'puzzle_toystore_door',
          },
        },
      ],
    },
  ],

  items: [],
  clues: [],

  puzzles: [
    {
      id: 'puzzle_toystore_door',
      type: 'keypad',
      title: ' Komputer Kasir',
      answer: '5797',
      maxDigits: 4,
      clueIds: [],
    },
  ],

  exitPuzzleId: 'puzzle_toystore_door',
};

export const LEVELS: Level[] = [LEVEL_4,LEVEL_1,LEVEL_5, LEVEL_2,LEVEL_3];
