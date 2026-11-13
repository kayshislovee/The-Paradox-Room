import type { Level } from '../types/game.types';
import { LEVEL_6 } from './level6';
import { LEVEL_7 } from './level7';

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
  dialogMusic: '/audio/dialog_music.mp3',
  timeLimit: 480,
  starThresholds: [360, 200, 100],
  exitLightPos: { x: 30, y: 38 },
  //exitDoorShape: { width: 5, height: 5 },
  //exitDoorPoints: '49.3,27.4 49.6,57 51.3,60.7 59.9,61 59.7,27.2 61.7,22.4 61.1,21.7 53.8,21.9',
  exitDoorPoints: '61.7,22.6 60,27.7 59.9,61 51.4,60.8 50,57.9 50,27.2 53.6,22.2',
  characterAvatar: '/avatars/lab3.png',
  characterName: 'Ethan',
  hints: [
    '💡 Coba periksa layar komputer terlebih dahulu.',
    '💡 Perhatikan kode error dan clue yang tertera di komputer',
    '💡 Pola tuas: 1=ON (atas), 0=OFF (bawah). Ikuti urutan dari layar!',
  ],

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

          x: 66,
          y: 32,
          width: 15,
          height: 10,
          cursor: 'pointer',
          image: '/objects/panellever.png',
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
    {
      id: 'scene_lab_open',         // ← scene baru: pintu terbuka
      label: 'Pintu Lab Terbuka',
      backgroundImage: '/backgrounds/lab2.png',  // ← gambar baru
      hidden: true,
      hotspots: [],                     // kosong — tidak ada interaksi di sini
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

  introDialog: [
    {
      character: 'Ethan',
      avatar: '/avatars/lab2.png', // opsional
      text: 'huffttt...,magang disini benar benar melelahkann',
      side: 'left',
    },
    {
      character: 'Ethan',
      avatar: '/avatars/lab1.png', // opsional
      text: 'ehh,kenapa pintu labnya terkunci,padahal sudah jam pulang.pasti seseorang menguncinya',
      side: 'left',
    },

    {
      character: 'Code Master',
      text: 'Eh,apa tadi ada yang bilang "terkunci"?',
      side: 'right',
      isSystem: true,
      avatar: '/avatars/villain1.png',
    },
    {
      character: 'Code Master',
      text: 'Kamu harus menemukan pola tuas untuk keluar dari sini,namun itu mustahil dilakukan oleh anak magang sepertimu',
      side: 'right',
      isSystem: true,
      avatar: '/avatars/villain2.png',
    },
    {
      character: 'Code Master',
      text: 'HAHAHAHAHAHA',
      side: 'right',
      isSystem: true,
      avatar: '/avatars/villain1.png',
    },
    {
      character: 'Ethan',
      avatar: '/avatars/lab3.png',
      text: 'cuih,belum tau aja skill ku',
      side: 'left',
    },
    {
      character: 'Ethan',
      avatar: '/avatars/lab3.png',
      text: 'ayo kita mulai',
      side: 'left',
    },
  ],
  treasures: [
    {
      id: 'treasure_lab_1',
      x: 18.5, y: 24.6,
      width: 6, height: 8,
      image: '/treasures/atom.png',
      achievementId: 'ach_lab_explorer',
    },
    {
      id: 'treasure_lab_2',
      x: 85, y: 86,
      width: 2, height: 4,
      image: '/treasures/ben10.png',
      achievementId: 'ach_lab_explorer',
    },

  ],
  achievements: [
    {
      id: 'ach_lab_explorer',
      title: 'Lab Explorer',
      description: 'Temukan semua treasure di Lab Misterius!',
      icon: '/achievements/treasurehunt.png',
      type: 'treasure',
      levelId: 'level_1',
    },
    {
      id: 'ach_lab_golden',
      title: 'Golden Brain(Lab)',
      description: 'Selesaikan Lab Misterius dalam waktu kurang dari 5 menit!',
      icon: '/achievements/goldenlab.png',
      type: 'time',
      levelId: 'level_1',
      isGolden: true,
    },
    {
      id: 'ach_lab_complete',
      title: 'Lab Escapist',
      description: 'Berhasil kabur dari Lab Misterius!',
      icon: '/achievements/lab.png',
      type: 'time',
      levelId: 'level_1',
    },
    {
      id: 'ach_lab_nohint',
      title: 'Brainy Detective',
      description: 'Selesaikan Puzzle Lab Misterius tanpa menggunakan hint!',
      icon: '/achievements/hint.png',
      type: 'time',
      levelId: 'level_1',
    },],

  exitPuzzleId: 'puzzle_lever_pattern',
};

const LEVEL_2: Level = {
  id: 'level_2',
  music: '/audio/level2_music.mp3',
  title: 'Koridor Sekolah',
  description: 'Terjebak di koridor sekolah! Baca semua notes untuk menemukan kode 3 digit lalu buka pintu EXIT.',
  thumbnail: '',
  dialogMusic: '/audio/dialog_music.mp3',
  timeLimit: 480,
  starThresholds: [360, 240, 120],

  exitDoorPoints: '45.6,24.2 45.6,63.1 58.2,62.9 58.2,24',
  characterAvatar: '/avatars/school4.png',
  characterName: 'Ayla',
  hints: [
    '💡 Baca Semua notes dan panel kode ',
    '💡 Cari tahu notes yg memiliki hubungan.lihatlah dari sobekan notesnya,lalu gabungkan sehingga membentuk kalimat',
    '💡 lalu cocokkan object yg ada di ruangan,setelah itu hasilnya masukkan ke panel kode',
  ],

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
          x: 59,
          y: 30,
          width: 10,
          height: 15,
          cursor: 'pointer',
          image: '/objects/keypad2.png',
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
    {
      id: 'scene_hallway_open',         // ← scene baru: pintu terbuka
      label: 'Koridor Sekolah — Pintu Terbuka',
      backgroundImage: '/backgrounds/school2.png',  // ← gambar baru
      hidden: true,
      hotspots: [],                     // kosong — tidak ada interaksi di sini
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

  introDialog: [
    {
      character: 'Ayla',
      avatar: '/avatars/school3.png', // opsional
      text: 'Piket sudah selesai,saatnya aku pulang, lagi lagi ditingal sama yg lain...',
      side: 'left',
    },
    {
      character: 'Ayla',
      avatar: '/avatars/school1.png', // opsional
      text: 'PINTUNYA KEKUNCI...!! ',
      side: 'left',
    },
    {
      character: 'Ayla',
      avatar: '/avatars/school2.png', // opsional
      text: 'Duhh.. SIAPA SIH YG KUNCI! pasti kerjaan si Arga nih, awas aja kalo sampe ketemu',
      side: 'left',
    },
    {
      character: 'Code Master',
      text: 'SURPRISEEE, Itu aku HAHAHAHA',
      side: 'right',
      isSystem: true,
      avatar: '/avatars/villain1.png',
    },
    {
      character: 'Code Master',
      text: 'Untuk keluar dari sini kamu harus menyelesaikan teka teki yang ada,kalo tidak bisa artinya kamu skill issue',
      side: 'right',
      isSystem: true,
      avatar: '/avatars/villain2.png',
    },
    {
      character: 'Code Master',
      text: 'HAHA-HAHAHA-HAHA',
      side: 'right',
      isSystem: true,
      avatar: '/avatars/villain1.png',
    },
    {
      character: 'Ayla',
      avatar: '/avatars/school4.png',
      text: 'Apasihh!!,yailah paling teka teki biasa, gausah bawel dehh....',
      side: 'left',
    },
  ],
  treasures: [
    {
      id: 'treasure_school_1',
      x: 13.4, y: 21,
      width: 4, height: 6,
      image: '/treasures/sapi.png',
      achievementId: 'ach_school_explorer',
    },
    {
      id: 'treasure_school_2',
      x: 48, y: 38.5,
      width: 6, height: 8,
      image: '/treasures/luffy.png',
      achievementId: 'ach_school_explorer',
    },

  ],
  achievements: [
    {
      id: 'ach_school_explorer',
      title: 'School Explorer',
      description: 'Temukan semua treasure di Koridor Sekolah!',
      icon: '/achievements/treasurehunt.png',
      type: 'treasure',
      levelId: 'level_2',
    },
    {
      id: 'ach_school_golden',
      title: 'Golden Brain(School)',
      description: 'Selesaikan Koridor Sekolah dalam waktu kurang dari 5 menit!',
      icon: '/achievements/goldenschool.png',
      type: 'time',
      levelId: 'level_2',
      isGolden: true,
    },
    {
      id: 'ach_school_complete',
      title: 'School Escapist',
      description: 'Berhasil kabur dari Koridor Sekolah!',
      icon: '/achievements/school.png',
      type: 'time',
      levelId: 'level_2',
    },
    {
      id: 'ach_school_nohint',
      title: 'Brainy Detective',
      description: 'Selesaikan Puzzle Koridor Sekolah tanpa menggunakan hint!',
      icon: '/achievements/hint.png',
      type: 'time',
      levelId: 'level_2',
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
  dialogMusic: '/audio/dialog_music.mp3',
  starThresholds: [360, 240, 120],
  exitLightPos: { x: 50, y: 42 },
  exitDoorShape: { width: 14, height: 38 },
  exitDoorPoints: '85.5,7.2 84.8,8.7 84.8,91 99.8,90.8 99.8,7.2',
  characterAvatar: '/avatars/perpus3.png',
  characterName: 'Vania',
  music: '/audio/level3_music.mp3',
  hints: [
    '💡 Baca Semua Note Yang Ada',
    '💡 Hitung semua buku kuning di rak,buku merah paling bawah saja,dan buku hijau di atas saja  ',
    '💡 Setelah semua buku tau totalnya,jika jumlah buku ganjil maka ditambah 2 dan jika buku genap akan dikurang 1',
  ],

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
    {
      id: 'scene_library_open',         // ← scene baru: pintu terbuka
      label: 'Perpustakaan Pintu Terbuka',
      backgroundImage: '/backgrounds/library2.png',  // ← gambar baru
      hidden: true,
      hotspots: [],                     // kosong — tidak ada interaksi di sini
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

  introDialog: [
    {
      character: 'Vania',
      avatarLeft: '/avatars/perpus3.png', // opsional
      text: 'Aku harus mengungkap misteri penyebab orang yang tiba tiba menghilang dan lupa ingatan belakangan ini',
      side: 'left',
    },
    {
      character: 'Vania',
      avatar: '/avatars/perpus2.png', // opsional
      text: 'Ciri-ciri penculiknya yang aku lihat di cctv sebelum korban menghilang adalah mengenakan topi dan berjas panjang',
      side: 'left',
    },
    {
      character: 'Vania',
      avatar: '/avatars/perpus2.png', // opsional
      text: 'NAHH,ciri cirnya mirip dengan ini,apakah dia penyebabnya?',
      side: 'left',
    },
    {
      character: 'Vania',
      avatarLeft: '/avatars/perpus3.png', // opsional
      avatarRight: '/avatars/book.png', // opsional
      avatarLeftStyle: {
        bottom: -55,  // ← posisi vertical
        left: -40,    // ← posisi horizontal
        height: 750,  // ← ukuran
      },
      avatarRightStyle: {
        bottom: 200, // ← berbeda dari kiri
        right: 350,
        height: 390,  // ← lebih kecil
      },
      text: 'Dia bertopi dan berjas panjang, persis seperti yang terlihat di cctv',

      side: 'left',
    },
    {
      character: 'Vania',
      avatarLeft: '/avatars/perpus2.png', // opsional
      avatarRight: '/avatars/book.png', // opsional
      avatarLeftStyle: {
        bottom: -55,  // ← posisi vertical
        left: -40,    // ← posisi horizontal
        height: 750,  // ← ukuran
      },
      avatarRightStyle: {
        bottom: 200, // ← berbeda dari kiri
        right: 350,
        height: 390,  // ← lebih kecil
      },
      text: 'Disini juga banyak informasi mengenai dia,mungkin aku bisa memecahkan misteri ini',

      side: 'left',
    },
    {
      character: 'Code Master',
      text: 'SURPRISEEE HAHAHAHA,SELAMAT DATANG DI PARADOX ROOM',
      side: 'right',
      isSystem: true,
      avatar: '/avatars/villain1.png',
    },
    {
      character: 'Code Master',
      text: 'Kamu ternyata orang yang kepo yaa,aku suka itu HAHAHAHA',
      side: 'right',
      isSystem: true,
      avatar: '/avatars/villain2.png',
    },
    {
      character: 'Vania',
      avatarLeft: '/avatars/perpus1.png', // opsional
      text: 'KAMU PASTII....',
      side: 'left',
    },
    {
      character: 'Code Master',
      text: 'BHAPPP... udah tau kan bakal ngapain?yaps benar sekali, jiwamu akan aku lahap HAHAHAHA',
      side: 'right',
      isSystem: true,
      avatar: '/avatars/villain1.png',
    },
    {
      character: 'Vania',
      avatarLeft: '/avatars/perpus1.png', // opsional
      text: 'Tidak semudah itu CODE MASTER,AKU PASTI AKAN MENYELESAIKAN PUZZLE INI',
      side: 'left',
    },
  ],
  treasures: [
    {
      id: 'treasure_library_1',
      x: 1, y: 50.2,
      width: 6, height: 8,
      image: '/treasures/doggy.png',
      achievementId: 'ach_library_explorer',
    },
    {
      id: 'treasure_library_2',
      x: 1, y: 7,
      width: 6, height: 8,
      image: '/treasures/bird.png',
      achievementId: 'ach_library_explorer',
    },

  ],
  achievements: [
    {
      id: 'ach_library_explorer',
      title: 'Library Explorer',
      description: 'Temukan semua treasure di Lab Misterius!',
      icon: '/achievements/treasurehunt.png',
      type: 'treasure',
      levelId: 'level_3',
    },
    {
      id: 'ach_library_golden',
      title: 'Golden Brain(Library)',
      description: 'Selesaikan Perpustakaan dalam waktu kurang dari 5 menit!',
      icon: '/achievements/goldenlibrary.png',
      type: 'time',
      levelId: 'level_3',
      isGolden: true,
    },
    {
      id: 'ach_library_complete',
      title: 'Library Escapist',
      description: 'Berhasil kabur dari Perpustakaan!',
      icon: '/achievements/library.png',
      type: 'time',
      levelId: 'level_3',
    },
    {
      id: 'ach_library_nohint',
      title: 'Brainy Detective',
      description: 'Selesaikan Puzzle Perpustakaan tanpa menggunakan hint!',
      icon: '/achievements/library.png',
      type: 'time',
      levelId: 'level_3',
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
  dialogMusic: '/audio/dialog_music.mp3',
  starThresholds: [360, 240, 120],
  exitLightPos: { x: 50, y: 42 },
 exitDoorPoints: '39.4,16.5 42.1,18.7 42.2,58.2 38.4,61.2 60.2,61 56.8,58.4 56.9,18.7 59.5,16.3',
   characterAvatar: '/avatars/market1.png',
  characterName: 'Sunny',
  music: '/audio/level4_music.mp3',
  hints: [
    '💡 Coba periksa Komputer dan catatan di meja',
    '💡 Perhatikan barang barang yg ada di meja dan rak barang',
    '💡 Coba hitung total harga barang yang ada di meja kasir dan masukkan kodenya untuk membuka pintu',
  ],

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
    {
      id: 'scene_store_open',         // ← scene baru: pintu terbuka
      label: 'Pintu Minimarket Terbuka',
      backgroundImage: '/backgrounds/minimarket2.png',  // ← gambar baru
      hidden: true,
      hotspots: [],                     // kosong — tidak ada interaksi di sini
    },
  ],

  items: [],
  clues: [],

  puzzles: [
    {
      id: 'puzzle_store_computer',
      type: 'computer',
      title: 'Komputer Kasir',

      answer: '755',
      maxDigits: 3,
      clueIds: [],
    },

  ],

  introDialog: [
    {
      character: 'Sunny',
      avatar: '/avatars/market1.png', // opsional
      text: 'Hah? Kenapa pintunya terkunci?!',
      side: 'left',
    },
    {
      character: 'Sunny',
      avatar: '/avatars/market2.png', // opsional
      text: 'Pasti seseorang mengunci pintu ini',
      side: 'left',
    },
    {
      character: 'Code Master',
      avatar: '/avatars/villain1.png',
      text: 'HAHAHA!! Benar,dan itu adalah aku.Code Master yang hebat',
      side: 'right',
      isSystem: true,
    },
    {
      character: 'Code Master',
      avatar: '/avatars/villain2.png',
      text: 'Jika kamu ingin keluar dari sini,kamu harus membuktikan kecerdasanmu dengan memecahkan teka-teki yang ada di dalam sini',
      side: 'right',
      isSystem: true,
    },
    {
      character: 'Sunny',
      avatar: '/avatars/market1.png',
      text: 'Teka Teki?? ', side: 'left',
    },
    {
      character: 'Code Master',
      avatar: '/avatars/villain1.png',
      text: 'Ya,kamu harus menemukan kode untuk membuka pintunya,lihatlah harga barang pada rak dan meja kasir',
      side: 'right',
      isSystem: true,
    },
    {
      character: 'Sunny',
      avatar: '/avatars/market2.png',
      text: 'Baiklah aku akan menyelesaikan Teka teki ini lalu kabur dari sini!', side: 'left',
    },
    {
      character: 'Code Master',
      avatar: '/avatars/villain1.png',
      text: 'Permainan dimulai....',
      side: 'right',
      isSystem: true,
    },
  ],
  treasures: [
    {
      id: 'treasure_minimarket_1',
      x: -1.5, y: 5,
      width: 6, height: 8,
      image: '/treasures/key.png',
      achievementId: 'ach_minimarket_explorer',
    },
    {
      id: 'treasure_minimarket_2',
      x: 95, y: 0,
      width: 6, height: 8,
      image: '/treasures/spiderman.png',
      achievementId: 'ach_minimarket_explorer',
    }
  ],
  achievements: [
    {
      id: 'ach_minimarket_explorer',
      title: 'Minimarket Explorer',
      description: 'Temukan semua treasure di Minimarket!',
      icon: '/achievements/treasurehunt.png',
      type: 'treasure',
      levelId: 'level_4',
    },
    {
      id: 'ach_minimarket_golden',
      title: 'Golden Brain(Minimarket)',
      description: 'Selesaikan Minimarket dalam waktu kurang dari 5 menit!',
      icon: '/achievements/goldenmarket.png',
      type: 'time',
      levelId: 'level_4',
      isGolden: true,
    },
    {
      id: 'ach_minimarket_complete',
      title: 'Minimarket Escapist',
      description: 'Berhasil kabur dari Minimarket!',
      icon: '/achievements/market.png',
      type: 'time',
      levelId: 'level_4',
    },
    {
      id: 'ach_minimarket_nohint',
      title: 'Brainy Detective',
      description: 'Selesaikan Puzzle Minimarket tanpa menggunakan hint!',
      icon: '/achievements/hint.png',
      type: 'time',
      levelId: 'level_4',
    },
  ],

  exitPuzzleId: 'puzzle_store_computer',
};

const LEVEL_5: Level = {
  id: 'level_5',
  title: 'Toko Mainan',
  description: 'Terjebak di toko mainan! Baca catatan yang ada dan masukkan kode 4 digit untuk membuka pintu EXIT.',
  thumbnail: '',
  dialogMusic: '/audio/dialog_music.mp3',
  timeLimit: 480,
  exitLightPos: { x: 50, y: 42 },
  exitDoorShape: { width: 14, height: 38 },
  exitDoorPoints: '41,19.7 41,57.8 39.9,59.2 59,59 58.2,57.6 58.2,19.9',
  starThresholds: [360, 240, 120],
  characterAvatar: '/avatars/anak2.png',
  characterName: 'Andi',
  music: '/audio/level5_music.mp3',
  hints: [
    '💡 Baca semua catatan dan lihat digit kode di komputer',
    '💡 Urutkan mainan berdasarkan angka misal "duck=1" artinya mainan no 1 adalah duck dan seterusnya.',
    '💡 Ingat urutan mainan berdasarkan angka dari note dan masukkan kode di komputer,masukkan angka depannya saja',
  ],

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
    {
      id: 'scene_toystore_open',         // ← scene baru: pintu terbuka
      label: 'Pintu Toko Mainan Terbuka',
      backgroundImage: '/backgrounds/toy2.png',  // ← gambar baru
      hidden: true,
      hotspots: [],                     // kosong — tidak ada interaksi di sini
    },
  ],

  items: [],
  clues: [],

  puzzles: [
    {
      id: 'puzzle_toystore_door',
      type: 'computer',
      title: ' Komputer Kasir',
      answer: '5797',
      maxDigits: 4,
      clueIds: [],
    },
  ],
  introDialog: [
    {
      character: 'Andi',
      avatar: '/avatars/anak1.png', // opsional
      text: 'Akhirnya mainan impianku bisa kubeli juga dari hasil menabung dari 3 bulan yang lalu',
      side: 'left',
    },
    {
      character: 'Andi',
      avatar: '/avatars/anak1.png', // opsional
      text: 'Saatnya pulang dan tunjukkan kepada teman teman.EH KOK-',
      side: 'left',
    },
    {
      character: 'Andi',
      avatar: '/avatars/anak2.png', // opsional
      text: 'Pintunya terkunci??pasti seseorang iseng melakukannya',
      side: 'left',
    },
    {
      character: 'Code Master',
      text: 'Tentu saja, ini adalah ulahku, kamu harus menemukan kode untuk membuka pintu ini,jika tidak, maka menangislah yang kencang dan pangil ibumu nak ',
      side: 'right',
      isSystem: true,
      avatar: '/avatars/villain1.png',
    },
    {
      character: 'Code Master',
      text: 'HAHAHA-HAHA-HAHA ',
      side: 'right',
      isSystem: true,
      avatar: '/avatars/villain1.png',
    },
    {
      character: 'Anak',
      avatar: '/avatars/anak2.png',
      text: 'Aku tidak akan menyerah!,aku akan mencoba ',
      side: 'left',
    },
    {
      character: 'Code Master',
      text: 'Perhatikan notes dan mainan yang ada,ini mustahil untuk dipecahkan anak sekecil kamu',
      side: 'right',
      isSystem: true,
      avatar: '/avatars/villain2.png',
    },
    {
      character: 'Code Master',
      text: 'HAHAHA-HAHA-HAHA ',
      side: 'right',
      isSystem: true,
      avatar: '/avatars/villain1.png',
    },
    {
      character: 'Anak',
      avatar: '/avatars/anak2.png',
      text: 'Tenang,aku pasti bisa menyelesaikan teka-teki ini dan keluar dari sini!!',
      side: 'left',
    },
  ],
  treasures: [
    {
      id: 'treasure_toystore_1',
      x: 39.3, y: 50.1,
      width: 6, height: 8,
      image: '/treasures/minion.png',
      achievementId: 'ach_toystore_explorer',
    },
    {
      id: 'treasure_toystore_2',
      x: 96, y: 33,
      width: 4, height: 6,
      image: '/treasures/simpsons.png',
      achievementId: 'ach_toystore_explorer',
    },

  ],
  achievements: [
    {
      id: 'ach_toystore_explorer',
      title: 'Toystore Explorer',
      description: 'Temukan semua treasure di Toko Mainan!',
      icon: '/achievements/treasurehunt.png',
      type: 'treasure',
      levelId: 'level_5',
    },
    {
      id: 'ach_toystore_golden',
      title: 'Golden Brain(Toystore)',
      description: 'Selesaikan Toko Mainan dalam waktu kurang dari 5 menit!',
      icon: '/achievements/goldentoy.png',
      type: 'time',
      levelId: 'level_5',
      isGolden: true,
    },
    {
      id: 'ach_toystore_complete',
      title: 'Toystore Escapist',
      description: 'Berhasil kabur dari Toko Mainan!',
      icon: '/achievements/toystore.png',
      type: 'time',
      levelId: 'level_5',
    },
    {
      id: 'ach_toystore_nohint',
      title: 'Brainy Detective',
      description: 'Selesaikan Puzzle Toko Mainan tanpa menggunakan hint!',
      icon: '/achievements/hint.png',
      type: 'time',
      levelId: 'level_5',
    },
  ],

  exitPuzzleId: 'puzzle_toystore_door',
};

export const LEVELS: Level[] = [LEVEL_4, LEVEL_1, LEVEL_5, LEVEL_2, LEVEL_3, LEVEL_6, LEVEL_7];

if (import.meta.hot) {
  import.meta.hot.accept('./level7', (updatedModule) => {
    const updatedLevel = updatedModule?.LEVEL_7;
    if (!updatedLevel) return;

    const levelIndex = LEVELS.findIndex((level) => level.id === updatedLevel.id);
    if (levelIndex !== -1) {
      LEVELS[levelIndex] = updatedLevel;
      window.dispatchEvent(new Event('level-data-updated'));
    }
  });
}
