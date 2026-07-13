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
        
          x: 5,
          y: 36,
          width: 23,
          height: 29,
          cursor: 'zoom-in',
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
        
          x: 68,
          y: 21,
          width: 11,
          height: 37,
          cursor: 'pointer',
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
  //music: '/audio/level2_music.mp3', 
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
          x: 6,
          y: 34,
          width: 5,
          height: 12,
          cursor: 'zoom-in',
         action: {
  type: 'open_note',
  image: '/notes/note2.png', // ← path ke asset
},
        },

        // ── NOTES 2 — di lantai dekat bola basket kiri (none) ───────────────
        {
          id: 'hs_note2',
          x: 28,
          y: 84,
          width: 6,
          height: 11,
          cursor: 'zoom-in',
          action: {
            type: 'open_note',
            image: '/notes/none.png', // ← path ke asset
          },
        },

        // ── NOTES 3 — paling kanan lantai (clue blue balls) ─────────────────
        {
          id: 'hs_note3',
          x: 70,
          y: 85,
          width: 8,
          height: 11,
          cursor: 'zoom-in',
          action: {
            type: 'open_note',
            image: '/notes/note1.png', // ← path ke asset
          },
        },

        // ── NOTES 4 — tengah lantai (clue lockers combinations) ─────────────
        {
          id: 'hs_note4',
          x: 49,
          y: 85,
          width: 6,
          height: 11,
          cursor: 'zoom-in',
          action: {
            type: 'open_note',
           image: '/notes/note3.png', // ← path ke asset
          },
        },

        // ── NOTES 5 — loker kanan atas (none) ───────────────────────────────
        {
          id: 'hs_note5',
          x: 89,
          y: 37,
          width: 5,
          height: 12,
          cursor: 'zoom-in',
          action: {
            type: 'open_note',
           image: '/notes/none.png', // ← path ke asset
          },
        },

        // ── KEYPAD di sebelah pintu (puzzle utama) ───────────────────────────
        {
          id: 'hs_keypad',
          x: 61.2,
          y: 30,
          width: 5.6,
          height: 15,
          cursor: 'pointer',
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

export const LEVELS: Level[] = [LEVEL_1, LEVEL_2];
