import type { Level, Character } from '../types/game.types';

const SCENE7_4_RELEASE_PANELS = [
  { x: 0.3, y: 0, width: 24.9, height: 41.4 },
  { x: 25.5, y: 0, width: 27.6, height: 41.4 },
  { x: 53.3, y: 0, width: 25.2, height: 41.4 },
  { x: 78.9, y: 0, width: 20.8, height: 41.4 },
  { x: 0.3, y: 42.1, width: 24.9, height: 57.5 },
  { x: 25.5, y: 42.1, width: 14.2, height: 57.5 },
  { x: 40.0, y: 42.1, width: 16.9, height: 57.5 },
  { x: 57.1, y: 42.1, width: 24.7, height: 57.5 },
  { x: 82.0, y: 42.1, width: 17.7, height: 57.5 },
];

const CHARACTERS: Character[] = [
  {
    id: 'char1',
    name: 'Ethan',
    avatar: '/avatars/zkayshi6.png',
    skill: {
      id: 'multi_language_reader',
      name: 'TRANSLATE',
      description: 'Menerjemahkan teks asing menjadi bahasa Inggris',
      icon: '🌐',
    },
  },
  {
    id: 'char2',
    name: 'Vania',
    avatar: '/avatars/perpus4.png',
    skill: {
      id: 'multi_language_reader',
      name: 'TRANSLATE',
      description: 'Menerjemahkan teks asing menjadi bahasa Inggris',
      icon: '🌐',
    },
  },
  {
    id: 'char3',
    name: 'Katsuragi',
    avatar: '/avatars/katsuragi2.png',
    skill: {
      id: '',
      name: '',
      description: '',
      icon: '',
    },
  },
];

export const LEVEL_7: Level = {
  id: 'level_7',
  title: 'Broken Paradox',
  description: 'Kunci Paradoks yang Terpecah',
  thumbnail: '',
  characterAvatar: '/avatars/katsuragi1.png',
  characterName: 'Katsuragi',
  timeLimit: 3600,
  starThresholds: [2100, 1200, 0],
  music: '/audio/lv7music.mp3',
  dialogMusic: '/audio/level7_dialog.mp3',
  exitPuzzleId: 'puzzle_exit_scene4',
  isLevel7: true as any, // as any jika isLevel7 tidak ada di interface standard Level
  characters: CHARACTERS,

  items: [
    {
      id: 'hacking_device',
      name: 'Hacking Device',
      description: 'Gunakan hacking device ke panel kode',
      icon: '/object/hack.png',
      image: '/objects/hack.png'
    },
    {
      id: 'hacking_device_upgraded',
      name: 'Hacking Device+',
      description: 'Versi upgrade dari Hacking Device',
      icon: '/objects/hackingdevice2.png',
      image: '/objects/hackingdevice2.png',
    },
    {
      id: 'item_1',
      name: 'Hacking Device Part',
      description: 'Pecahan hacking device',
      icon: '/objects/hack1.png',
      image: '/objects/hack1.png'
    },
    {
      id: 'item_2',
      name: 'Hacking Device Part',
      description: 'Pecahan Hacking device ',
      icon: '/objects/hack2.png',
      image: '/objects/hack2.png'
    },
    {
      id: 'item_3',
      name: 'Hacking device Part',
      description: 'Pecahan Hacking device',
      icon: '/objects/hack3.png',
      image: '/objects/hack3.png'
    },
    {
      id: 'item_uv_flashlight',
      name: 'UV Flashlight',
      description: 'Senter UV untuk melihat hal tersembunyi',
      icon: '🔦',
      image: '/objects/flashlight.png',
    },
    { id: 'item_tape_a', name: 'Tape A', description: 'Kaset data A', icon: '📼', image: '/objects/tape1.png' },
    { id: 'item_tape_d', name: 'Tape D', description: 'Kaset data D', icon: '📼', image: '/objects/tape2.png' },
    { id: 'item_tape_e', name: 'Tape E', description: 'Kaset data E', icon: '📼', image: '/objects/tape3.png' },
    // DITAMBAHKAN: Kunci yang dibutuhkan di scene7_6
    { id: 'item_tape_comic', name: 'Tape Comic', description: 'Kaset data dengan comic', icon: '📼', image: '/comic/lv7tape.png' },
  ],

  // DITAMBAHKAN: Clue yang dipanggil di scene7_6 dan scene7_7
  clues: [

  ],

  puzzles: [
    {
      id: 'puzzle_dual_lock',
      type: 'dual' as any,
      title: 'Dual Lock System',
      answer: '8777',
      maxDigits: 4,
      clueIds: [],
      symbolAnswer: ['bintang', 'bulat', 'segitiga'] as any,
    },
    {
      id: 'puzzle_scene2',
      type: 'keypad',
      title: 'Panel Pintu Tengah',
      answer: '52462',
      maxDigits: 5,
      clueIds: [],
    },
    {
      id: 'puzzle_scene3',
      type: 'keypad',
      title: '',
      answer: '',
      maxDigits: 4,
      clueIds: [],
    },
    {
      id: 'puzzle_exit_scene4',
      type: 'keypad',
      title: '',
      answer: '',
      maxDigits: 4,
      clueIds: [],
    },
    {
      id: 'puzzle_chest_s4',
      type: 'computer' as any,
      title: 'STORAGE LOCK',
      answer: '146',
      maxDigits: 3,
      clueIds: [],
    },
    {
      id: 'puzzle_storage',
      type: 'keypad' as any,
      title: 'Storage Puzzle',
      answer: '',
      maxDigits: 4,
      clueIds: [],
    },
    {
      id: 'puzzle_core_unlock',
      type: 'keypad' as any,
      title: 'Core Room Lock',
      answer: '',
      maxDigits: 4,
      clueIds: [],
    },
  ],

  hints: [],
  treasures: [
    { id: 'treasure_lv7_medal', x: 60, y: 15, width: 4, height: 5, image: '/treasures/medal.png', achievementId: 'ach_level7_complete', sceneId: 'scene7_3' },
    { id: 'treasure_lv7_crayon', x: 90, y: 88, width: 5, height: 6, image: '/treasures/crayon.png', achievementId: 'ach_level7_complete', sceneId: 'scene7_1' },
    { id: 'treasure_lv7_racun', x: 3, y: 85, width: 5, height: 6, image: '/treasures/racun.png', achievementId: 'ach_level7_complete', sceneId: 'scene7_4' },
    { id: 'treasure_lv7_umbrella', x: 49, y: 87, width: 4, height: 5, image: '/treasures/umbrella.png', achievementId: 'ach_level7_complete', sceneId: 'scene7_5' },
    { id: 'treasure_lv7_teddy', x: 45, y: 82, width: 6, height: 8, image: '/treasures/teddy.png', achievementId: 'ach_level7_complete', sceneId: 'scene7_2' },
  ],

  sceneHints: {
    scene7_1: {
      char1: [
        { text: 'Rakit semua komponen hacking device untuk mengakses panel code di depan pintu penjara.', cost: 1 },
        { text: 'Gunakan skill Translate saat membuka notes untuk mengetahui urutan pola code.', cost: 1 },
        { text: 'Jawaban: bintang - bulat - segitiga', cost: 2 },
      ],
      char2: [
        { text: 'Ambil flashlight lalu scan sekitar dan selesaikan soal matematika sesuai urutan.', cost: 1 },
        { text: 'Beritahu temanmu hasil semua soal matematika secara berurutan untuk dimasukkan ke panel input.', cost: 2 },
        { text: 'Jawaban: 8777', cost: 2 },
      ],
    },
    scene7_2: {
      char1: [
        { text: 'Ambil semua tape lalu masukkan ke tape reader dan analisa notes, khususnya bagian positions, shift, dan id.', cost: 1 },
        { text: 'Urutkan hasil id yang sudah didapat berdasarkan alfabet (misal A=5, B=?, C=?).', cost: 1 },
        { text: 'Jawaban: 5 _ _ 6 2', cost: 1 },
      ],
      char2: [
        { text: 'Gunakan UV flashlight untuk scan sekitar; ada beberapa kotak dengan ID untuk melengkapi kode temanmu.', cost: 1 },
        { text: 'Jawaban: _ 2 4 _ _', cost: 1 },
      ],
    },
    scene7_3: {
      char1: [
        { text: 'Buka to do list yang ada di computer.', cost: 1 },
        { text: 'Jawaban folder: 6417', cost: 2 },
        { text: 'Masukkan kode dari sidik jari ke dalam cctv.exe; digit terakhir didapat dari inspect sidik jari Vania di file memory 4.', cost: 1 },
      ],
      char2: [
        { text: 'Buka folder to do list.', cost: 1 },
        { text: 'Jawaban folder: 6417', cost: 2 },
        { text: 'Masukkan kode dari sidik jari ke dalam cctv.exe; digit terakhir didapat dari inspect sidik jari Vania di file memory 4.', cost: 1 },
      ],
    },
    scene7_4: {
      char3: [
        { text: 'Buka brankas dengan memasukkan code 146, lalu ambil semua alat untuk mengakses perangkat.', cost: 1 },
        { text: 'Username: Ren_Sinclair, Password: 1574', cost: 2 },
        { text: 'Samakan frekuensi.', cost: 1 },
      ],
    },
    scene7_5: {
      char1: [
        { text: 'Selesaikan semua gangguan jika ada; sering-sering gunakan hacking device+.', cost: 1 },
        { text: 'Mesin Kiri: 341732, Mesin Tengah: 8248, Mesin Kanan: 69412', cost: 5 },
      ],
      char2: [
        { text: 'Selesaikan semua gangguan jika ada; sering-sering gunakan hacking device+.', cost: 1 },
        { text: 'Mesin Kiri: 341732, Mesin Tengah: 8248, Mesin Kanan: 69412', cost: 5 },
      ],
      char3: [
        { text: 'Selesaikan semua gangguan jika ada; sering-sering gunakan hacking device+.', cost: 1 },
        { text: 'Mesin Kiri: 341732, Mesin Tengah: 8248, Mesin Kanan: 69412', cost: 5 },
      ],
    },
  },
  

  achievements: [
    {
      id: 'ach_level7_complete',
      title: 'Pemecah Paradoks Akhir',
      description: 'Selesaikan The Broken Paradox!',
      icon: '/achievements/lv7complete.png',
      type: 'time',
      levelId: 'level_7',
    },
    {
      id: 'ach_level7_golden',
      title: 'Golden Brain (Paradox)',
      description: 'Selesaikan The Broken Paradox dengan 3 bintang!',
      icon: '/achievements/lv7completegold.png',
      type: 'time',
      levelId: 'level_7',
      isGolden: true,
    },
    {
      id: 'ach_lv7_scene1_complete',
      title: 'Pemecah Paradoks IV - Scene 1',
      description: 'Selesaikan Scene 1 di The Broken Paradox!',
      icon: '/achievements/lv7scene1.png',
      type: 'time',
      levelId: 'level_7',
    },
    {
      id: 'ach_lv7_scene2_complete',
      title: 'Pemecah Paradoks IV - Scene 2',
      description: 'Selesaikan Scene 2 di The Broken Paradox!',
      icon: '/achievements/lv7scene2.png',
      type: 'time',
      levelId: 'level_7',
    },
    {
      id: 'ach_lv7_scene3_complete',
      title: 'Pemecah Paradoks IV - Scene 3',
      description: 'Selesaikan Scene 3 di The Broken Paradox!',
      icon: '/achievements/lv7scene3.png',
      type: 'time',
      levelId: 'level_7',
    },
    {
      id: 'ach_lv7_scene4_complete',
      title: 'Pemecah Paradoks IV - Scene 4',
      description: 'Selesaikan Scene 4 di The Broken Paradox!',
      icon: '/achievements/lv7scene4.png',
      type: 'time',
      levelId: 'level_7',
    },
    {
      id: 'ach_lv7_scene5_complete',
      title: 'Pemecah Paradoks IV - Scene 5',
      description: 'Selesaikan Scene 5 di The Broken Paradox!',
      icon: '/achievements/lv7scene5.png',
      type: 'time',
      levelId: 'level_7',
    },
  ],

  scenes: [
    // ── SCENE 1 ────────────────────────────────────────────────────────
    {
      id: 'scene7_1',
      label: 'Sel Penjara',
      backgroundImage: '/backgrounds/lv7a.png',
      hotspots: [],
      sceneComic: {
        src: '/comic/scene1.png',
        panels: [
          { x: 0.2, y: 1, width: 27.4, height: 35.6, enterFrom: 'fade' },
          { x: 27.8, y: 1, width: 14.3, height: 35.6, enterFrom: 'slide-right' },
          { x: 42.2, y: 1, width: 24.2, height: 35.6, enterFrom: 'slide-right' },
          { x: 67.2, y: 1, width: 32.2, height: 35.6, enterFrom: 'slide-right' },
          { x: 0.2, y: 37.2, width: 26, height: 31.9, enterFrom: 'slide-left' },
          { x: 26.3, y: 37.2, width: 42.6, height: 31.9, enterFrom: 'scale', effect: 'flash' },
          { x: 69.4, y: 37.2, width: 30.4, height: 31.9, enterFrom: 'slide-right' },
          { x: 0.2, y: 69.8, width: 23.8, height: 32, enterFrom: 'slide-up' },
          { x: 24.3, y: 69.8, width: 41.6, height: 32, enterFrom: 'slide-up' },
          { x: 66.2, y: 69.8, width: 33.6, height: 32, enterFrom: 'fade' },
        ],
      },
      introDialog: [
        
    {
      character: 'Ethan',
      text: 'ARRHHH... KEPALAKU SAKIT',
      side: 'left' as const,
      avatarLeftStyle: { left: -10, bottom: -80, height: 700 },
      avatarLeft: '/avatars/kayshifinal1.png',
    },
    {
      character: 'Ethan',
      text: 'Apapun itu aku harus keluar dari sini, pasti ada petunjuk disini',
      side: 'left' as const,
      avatarLeftStyle: { left: -10, bottom: -120, height: 700 },
      avatarLeft: '/avatars/zkayshi2.png',
    },
    {
      character: 'Vania',
      text: 'Kita bisa keluar dari sini dengan menginput kode angka dan pola di panel sebelah sana',
      side: 'right' as const,
      avatarRightStyle: { right: -10, bottom: -120, height: 800 },
      avatarRight: '/avatars/vania1.png',
    },
    {
      character: 'Vania',
      text: 'Coba periksa sekitarmu juga,dan jangan lupa untuk berpindah karakter',
      side: 'right' as const,
            avatarRightStyle: { right: -10, bottom: -120, height: 800 },

      avatarRight: '/avatars/vania3.png',
    },
   
  ],
      highlightHotspots: ['hs_dual_lock'],

      char1Layer: {
        backgroundImage: '/backgrounds/lv7a.png',
        hotspots: [
          {
            id: 'hs_note_asing',
            x: 84, y: 60, width: 8, height: 13,
            cursor: 'pointer',
            image: '/objects/notenone2.png',
            action: {
              type: 'open_note',
              image: '/notes/noteasing1.png',
              translatedImage: '/notes/noteindo1.png',
            },
          },
          {
            id: 'hs_note_asing2',
            x: 5, y: 42.6, width: 8, height: 13,
            cursor: 'pointer',
            image: '/objects/note2.png',
            action: {
              type: 'open_note',
              image: '/notes/noteasing2.png',
              translatedImage: '/notes/noteindo2.png',
            },
          },
          {
            id: 'hs_item_1',
            x: 1.6, y: 29, width: 3, height: 10,
            cursor: 'pointer',
            image: '/objects/hack1.png',
            action: { type: 'give_item_and_dialog', itemId: 'item_1', dialogId: 'scene7_1_item' },
            visible: { hideAfterUsed: true },
          },
          {
            id: 'hs_item_2',
            x: 15, y: 70, width: 3, height: 10,
            cursor: 'pointer',
            image: '/objects/hack2.png',
            action: { type: 'give_item_and_dialog', itemId: 'item_2', dialogId: 'scene7_1_item' },
            visible: { hideAfterUsed: true },
          },
          {
            id: 'hs_item_3',
            x: 73, y: 81, width: 3, height: 10,
            cursor: 'pointer',
            image: '/objects/hack3.png',
            action: { type: 'give_item_and_dialog', itemId: 'item_3', dialogId: 'scene7_1_item' },
            visible: { hideAfterUsed: true },
          },
          {
            id: 'hs_dual_lock',
            x: 61.4, y: 40, width: 7, height: 12,
            cursor: 'pointer',
            image: '/objects/dualpuzzle1.png',
            action: { type: 'open_puzzle', puzzleId: 'puzzle_dual_lock' },
          },
        ],
      },

      char2Layer: {
        backgroundImage: '/backgrounds/lv7b.png',
        backgroundImageXVision: '/backgrounds/lv7b1.png',
        hotspots: [
          {
            id: 'hs_item_uv_flashlight',
            x: 17, y: 87, width: 7, height: 8,
            cursor: 'pointer',
            image: '/objects/flashlight.png',
            action: {
              type: 'give_item',
              itemId: 'item_uv_flashlight',
            },
            visible: { hideAfterUsed: true },
          },
          {
            id: 'hs_treasure_crayon',
            x: 90, y: 88, width: 5, height: 6,
            cursor: 'pointer',
            image: '/treasures/crayon.png',
            action: { type: 'collect_treasure', treasureId: 'treasure_lv7_crayon' } as any,
            visible: { hideAfterUsed: true },
          },
        ],
      },
    },

    // ── SCENE 2 — Lorong + Control Room + Storage (1 scene, sub-view per char) ─
    {
      id: 'scene7_2',
      label: 'Lorong Penghubung',
      backgroundImage: '/backgrounds/lorong.jpg',
      hotspots: [],
      sceneComic: {
        src: '/comic/scene2.png',
        panels: [
          // Baris 1
          { x: 0.2, y: 1, width: 63.7, height: 36.3, enterFrom: 'fade' },
          { x: 64.3, y: 1, width: 35.3, height: 36.3, enterFrom: 'slide-right' },

          // Baris 2
          { x: 0.2, y: 37.6, width: 12.6, height: 32, enterFrom: 'slide-left' },
          { x: 13.3, y: 37.6, width: 28.5, height: 32, enterFrom: 'scale', effect: 'flash' },
          { x: 41.8, y: 37.6, width: 15.8, height: 32, enterFrom: 'slide-right' },
          { x: 57.8, y: 37.6, width: 15.3, height: 32, enterFrom: 'slide-left' },
          { x: 73, y: 37.6, width: 26.8, height: 32, enterFrom: 'slide-left' },
          // Baris 3
          { x: 0.2, y: 69.8, width: 34.8, height: 32, enterFrom: 'slide-up' },
          { x: 35.3, y: 69.8, width: 64.6, height: 32, enterFrom: 'slide-up' },
        ],
      },
      highlightHotspots: ['hs_keypad_door_c1', 'hs_keypad_door_c2'],

      char1Layer: {
        backgroundImage: '/backgrounds/lorong.jpg',
        hotspots: [
          {
            id: 'hs_door_control_c1',
            x: 2.3, y: 28, width: 26, height: 55,
            cursor: 'pointer',
            image: '/objects/kiri.png',
            action: { type: 'enter_subview', subView: 'control_room' } as any,
          },
          {
            id: 'hs_door_core_locked_c1',
            x: 39, y: 32.4, width: 20, height: 40,
            cursor: 'not-allowed',
            image: '/objects/tengah.png',
            action: { type: 'message', text: '🔒 Pintu terkunci. Selesaikan puzzle di Control Room dan Storage.' },
            // visible: { requiresSolved: undefined } dihapus agar tidak error type
          },
          {
            id: 'hs_door_core_open_c1',
            x: 39, y: 22, width: 20, height: 60,
            cursor: 'pointer',
            image: '/objects/tengah.png',
            action: { type: 'go_to_scene', sceneId: 'scene7_5' },
            visible: { requiresSolved: 'puzzle_core_unlock' },
          },
          {
            id: 'hs_door_storage_c1',
            x: 72, y: 30, width: 26, height: 55,
            cursor: 'not-allowed',
            image: '/objects/kanan.png',
            action: { type: 'message', text: '🚫 Hanya Vania yang bisa masuk ke Storage Room.' },
          },
          {
            id: 'hs_keypad_door_c1',
            x: 57, y: 45, width: 5, height: 10,
            cursor: 'pointer',
            image: '/objects/codekoridor.png',
            action: { type: 'open_puzzle', puzzleId: 'puzzle_scene2' },
          },
        ],
      },

      char1SubViews: {
        control_room: {
          backgroundImage: '/backgrounds/control2.png',
          hotspots: [
            // Monitor besar — hacking device
            // Display object layar — tanpa action
            {
              id: 'hs_layar_object',
              x: 41, y: 19, width: 27, height: 30,
              cursor: 'pointer',
              image: '/objects/layar.png',
              // tanpa action, cuma display
              action: { type: 'message', text: '' },  // ← dummy action agar tidak error

            },

            // Monitor — belum ada hacking device
            /*{
              id: 'hs_monitor_locked',
              x: 41, y: 19, width: 27, height: 30,
              cursor: 'not-allowed',
              image: '/objects/layar.png',
              action: { type: 'message', text: '🔒 Sistem terkunci. Gunakan Hacking Device untuk mengakses.' },
              // tanpa image
            },
            
            // Monitor — punya hacking device
            {
              id: 'hs_monitor_hack',
              x: 41, y: 19, width: 27, height: 30,
              cursor: 'pointer',
              image: '/objects/layar.png',
              action: { type: 'open_hacking_minigame' } as any,
              visible: { requiresItem: 'hacking_device' },
              // tanpa image
            },*/


            // Monitor — sudah di-hack
            {
              id: 'hs_monitor_tape_input',
              x: 41, y: 19, width: 27, height: 30,
              cursor: 'pointer',
              action: { type: 'open_tape_reader' } as any,
              //visible: { requiresSolved: 'puzzle_control_hacked' },
              // tanpa image
            },

            // Tape A — ambil
            {
              id: 'hs_tape_a',
              x: 13.5, y: 76.5, width: 6, height: 8,
              cursor: 'pointer',
              image: '/objects/tape1.png',
              action: { type: 'give_item', itemId: 'item_tape_a' },
              visible: { hideAfterUsed: true },
            },
            // Tape d
            {
              id: 'hs_tape_d',
              x: 15, y: 53, width: 6.8, height: 7,
              cursor: 'pointer',
              image: '/objects/tape2.png',
              action: { type: 'give_item', itemId: 'item_tape_d' },
              visible: { hideAfterUsed: true },
            },
            // Tape E
            {
              id: 'hs_tape_e',
              x: 75, y: 77, width: 8, height: 10,
              cursor: 'pointer',
              image: '/objects/tape3.png',
              action: { type: 'give_item', itemId: 'item_tape_e' },
              visible: { hideAfterUsed: true },
            },
            {
              id: 'hs_note_tabel',
              x: 58.3, y: 66, width: 8, height: 13,
              cursor: 'pointer',
              image: '/notes/info2.png',
              action: {
                type: 'open_note',
                image: '/notes/info2.png',
                translatedImage: '/notes/info1.png',
              },
            },
            {
              id: 'hs_note_daftar',
              x: 15.7, y: 57.5, width: 6, height: 7.5,
              cursor: 'zoom-in',
              image: '/notes/daftarnotes.png',
              action: {
                type: 'open_note',
                image: '/notes/daftarnotes.png',
              },
            },

            {
              id: 'hs_tape_comic',
              x: 16, y: 24.7, width: 6, height: 8,
              cursor: 'pointer',
              image: '/objects/tape1.png',
              action: { type: 'give_item', itemId: 'item_tape_comic' },
              visible: { hideAfterUsed: true },
            },
          ],
        },
      } as any,

      char2Layer: {
        backgroundImage: '/backgrounds/lorong.jpg',
        backgroundImageXVision: '/backgrounds/lorong.jpg',
        hotspots: [
          {
            id: 'hs_door_control_c2',
            x: 2.3, y: 28, width: 26, height: 55,
            cursor: 'pointer',
            image: '/objects/kiri.png',
            action: { type: 'enter_subview', subView: 'control_room' } as any,
          },
          {
            id: 'hs_door_core_locked_c2',
            x: 39, y: 32.4, width: 20, height: 40,
            cursor: 'not-allowed',
            image: '/objects/tengah.png',
            action: { type: 'message', text: '🔒 Pintu terkunci. Selesaikan puzzle di Control Room dan Storage.' },
          },
          {
            id: 'hs_door_core_open_c2',
            x: 39, y: 22, width: 20, height: 60,
            image: '/objects/tengah.png',
            cursor: 'pointer',
            action: { type: 'go_to_scene', sceneId: 'scene7_5' },
            visible: { requiresSolved: 'puzzle_core_unlock' },
          },
          {
            id: 'hs_door_storage_c2',
            x: 72, y: 30, width: 26, height: 55,
            cursor: 'pointer',
            image: '/objects/kanan.png',
            action: { type: 'enter_subview', subView: 'storage_room' } as any,
          },
          // Tambah di hotspots char2Layer scene7_2 (sama):
          {
            id: 'hs_keypad_door_c2',
            x: 57, y: 45, width: 5, height: 10,
            cursor: 'pointer',
            image: '/objects/codekoridor.png',
            action: { type: 'open_puzzle', puzzleId: 'puzzle_scene2' },
          },
        ],
      },

      char2SubViews: {
        storage_room: {
          backgroundImage: '/backgrounds/storage.jpg',
          backgroundImageXVision: '/backgrounds/storage2.png',
          hotspots: [
            {
              id: 'hs_box_c2',
              x: 55, y: 22, width: 14, height: 18,
              cursor: 'zoom-in',
              image: '/objects/notenone1.png',
              action: {
                type: 'open_note',
                image: '/notes/box_c2_xvision.png',
              },
              visible: { requiresXVision: true },
            },
            {
              id: 'hs_box_b2',
              x: 52, y: 48, width: 16, height: 20,
              cursor: 'zoom-in',
              image: '/objects/notemeja.png',
              action: {
                type: 'open_note',
                image: '/objects/kiri.png',
              },
              visible: { requiresXVision: true },
            },
            /* {
    id: 'hs_xvision_box_storage',
    x: 30, y: 55, width: 14, height: 18,
    cursor: 'zoom-in',
    uvImage: '/objects/b2.png',   // ← pakai uvImage, bukan image
    action: { type: 'open_zoom', zoomImage: '/objects/monitor.png', label: 'Monitor' },
  },*/
            {
              id: 'hs_treasure_teddy',
              x: 45, y: 82,
              width: 10, height: 14,
              cursor: 'pointer',
              image: '/treasures/teddy.png',
              action: { type: 'collect_treasure', treasureId: 'treasure_lv7_teddy' } as any,
              visible: { hideAfterUsed: true },
            },
          ],
        },
      } as any, // DITAMBAHKAN: as any agar TypeScript tidak error karena interface belum terupdate
    },

    // ── SCENE 3 — Core Room ──────────────────────────────────────────────────────
    {
      id: 'scene7_3',
      label: 'Pusat Kendali',
      backgroundImage: '',
      hotspots: [],
      highlightHotspots: ['hs_computer_s3'],

      char1Layer: {
        backgroundImage: '/backgrounds/kantor.jpg',
        hotspots: [
          /*{
            id: 'hs_core_exit',
            x: 40, y: 10, width: 20, height: 30,
            cursor: 'pointer',
            image: '/objects/core_exit.png',
            action: { type: 'open_puzzle', puzzleId: 'puzzle_exit_scene4' },
          },
          // Di char1Layer atau char2Layer scene7_3:*/
          {
            id: 'hs_calender',
            x: 32, y: 15, width: 15, height: 28,
            cursor: 'zoom-in',
            image: '/objects/kalender.png',
            action: {
              type: 'open_zoom_and_dialog',
              zoomImage: '/objects/kalender.png',
              label: 'Kalender',
              dialogId: 'scene7_3_mark',
            },
          },
          {
            id: 'hs_computer_s3',
            x: 40, y: 31.6, width: 15, height: 20,
            cursor: 'pointer',
            image: '/objects/komputer.png',
            action: { type: 'open_desktop_and_dialog', dialogId: 'scene7_3_pc' },
            zIndex: 999,
          },


          {
            id: 'hs_newspaper',
            x: 74, y: 79, width: 20, height: 22,
            cursor: 'zoom-in',
            image: '/objects/koran.png',
            action: {
              type: 'open_zoom_and_dialog',
              zoomImage: '/objects/koran2.png',
              label: 'Newspaper',
              dialogId: 'scene7_3_mark',
            },
          },
          {
            id: 'hs_photo',
            x: 1.4, y: 44, width: 13, height: 18,
            cursor: 'zoom-in',
            image: '/objects/foto.png',
            action: {
              type: 'open_zoom_and_dialog',
              zoomImage: '/objects/foto.png',
              label: 'Katsuragi Takumi',
              dialogId: 'scene7_3_mark',
            },
          },

          {
            id: 'hs_treasure_medal',
            x: 5, y: 15, width: 4, height: 5,
            cursor: 'pointer',
            image: '/treasures/medal.png',
            action: { type: 'collect_treasure', treasureId: 'treasure_lv7_medal' } as any,
            visible: { hideAfterUsed: true },
          },
        ],
      },

      char2Layer: {
        backgroundImage: '/backgrounds/kantor.jpg',
        backgroundImageXVision: '/backgrounds/kantor2.jpg',

        hotspots: [
          {
            id: 'hs_calender2',
            x: 32, y: 15, width: 15, height: 28,
            cursor: 'zoom-in',
            image: '/objects/kalender.png',
            action: {
              type: 'open_zoom_and_dialog',
              zoomImage: '/objects/kalender.png',
              label: 'Kalender',
              dialogId: 'scene7_3_mark',
            },
          },
          {
            id: 'hs_computer_s3',
            x: 40, y: 31.6, width: 15, height: 20,
            cursor: 'pointer',
            image: '/objects/komputer.png',
            action: { type: 'open_desktop_and_dialog', dialogId: 'scene7_3_pc' },
            zIndex: 999,
          },


          {
            id: 'hs_newspaper',
            x: 74, y: 79, width: 20, height: 22,
            cursor: 'zoom-in',
            image: '/objects/koran.png',
            action: {
              type: 'open_zoom_and_dialog',
              zoomImage: '/objects/koran2.png',
              label: 'Newspaper',
              dialogId: 'scene7_3_mark',
            },
          },
          {
            id: 'hs_photo',
            x: 1.4, y: 44, width: 13, height: 18,
            cursor: 'zoom-in',
            image: '/objects/foto.png',
            action: {
              type: 'open_zoom_and_dialog',
              zoomImage: '/objects/foto.png',
              label: 'Katsuragi Takumi',
              dialogId: 'scene7_3_mark',
            },
          },

        ],
      },
      
    },


    // ── SCENE 4 ──────────────────────────────────────────────────────
    {
      id: 'scene7_4',
      label: 'Lab Code Master',
      backgroundImage: '/backgrounds/tabung4.png',
      hotspots: [],
      
      comicPages: [
         {
           src: '/comic/scene4.png',  // background halaman 1
           panels: [
             { x: 0.5,  y: 1,  width: 46.7, height: 46.5, enterFrom: 'fade' },
             { x: 47.3,  y: 1, width: 52.3,  height: 46.5, enterFrom: 'slide-left' },
             { x: 0.5, y: 47.7, width: 23,  height: 52, enterFrom: 'slide-right' as const, effect: 'flash' },
             { x: 23.7,  y: 47.7, width: 35.2,  height: 52, enterFrom: 'fade' },
             { x: 59.0, y: 47.7, width: 40.6,  height: 19.8, enterFrom: 'slide-right' as const, effect: 'shake' as const },
            { x: 59.0, y: 67.8, width: 40.6,  height: 32, enterFrom: 'slide-right' as const, effect: 'shake' as const },

           ],
         },
        {
          src: '/comic/scene42.png',  // background halaman 2
          panels: [
            { x: 0.5, y: 0, width: 49.4, height: 36.2 },
  { x: 50, y: 0,   width: 49.9, height: 36.1 },

  // Baris 2 (3 Panel)
  { x: 0.5, y: 36.4, width: 21.9, height: 29.5 },
  { x: 22.8, y: 36.4, width: 37.2, height: 29.4 },
  { x: 60.4, y: 36.4, width: 39.9, height: 29.5 },

  // Baris 3 (3 Panel)
  { x: 0.1, y: 65.9, width: 29.8, height: 33.7 },
  { x: 30.4, y: 66.4, width: 32.4, height: 33.3 },
  { x: 63.1, y: 66.4, width: 36.6, height: 33.3 }
          ],
        },
      ],

      highlightHotspots: ['hs_pod_control'],
      autoSwitchChar: 'char3',  // ← otomatis switch saat masuk scene ini
      char3Layer: {
        backgroundImage: '/backgrounds/tabung4.png',
        backgroundImageXVision: '/backgrounds/tabung3a.png',
        hotspots: [


          {
            id: 'hs_pod_control',
            x: 15, y: 53, width: 70, height: 50,
            cursor: 'pointer',
            image: '/objects/mesin.png',
            action: { type: 'open_pod_control' } as any,
            zIndex: 999,

          },
          {
            id: 'hs_chest_s4',
            x: 86.3, y: 31.8, width: 7, height: 9.5,
            cursor: 'pointer',
            image: '/objects/chest.png',
            action: { type: 'open_puzzle', puzzleId: 'puzzle_chest_s4' } as any,
          },
          {
            id: 'hs_treasure_racun',
            x: 3, y: 85, width: 5, height: 6,
            cursor: 'pointer',
            image: '/treasures/racun.png',
            action: { type: 'collect_treasure', treasureId: 'treasure_lv7_racun' } as any,
            visible: { hideAfterUsed: true },
          },
        ],
      },

    },

    // ── SCENE 5 ──────────────────────────────────────────────────────
    {
      id: 'scene7_5',
      label: 'Code Master Core',
      backgroundImage: '/backgrounds/scene5.png',
      hotspots: [],
      char1Layer: {
        backgroundImage: '/backgrounds/scene5.png',
        hotspots: [

          {
            id: 'hs_panel_reactor',
            x: 67, y: 64, width: 20, height: 30, // sesuaikan koordinat agar pas
            cursor: 'pointer',
            image: '/objects/reactor3.png',
            glitchImage: '/objects/reactorkanan.png',
            action: { type: 'open_power' },

          },
          {
            id: 'hs_panel_cooling',
            x: 41, y: 69, width: 20, height: 30, // sesuaikan koordinat agar pas
            cursor: 'pointer',
            image: '/objects/reactor2.png',
            glitchImage: '/objects/reactortengah.png',
            action: { type: 'open_cooling' },

          },
          {
            id: 'hs_panel_power',
            x: 16, y: 64, width: 20, height: 30, // sesuaikan koordinat agar pas
            cursor: 'pointer',
            image: '/objects/reactor1.png',
            glitchImage: '/objects/reactorkiri.png',
            action: { type: 'open_reactor' },

          }
        ],
      },


      char2Layer: {
        backgroundImage: '/backgrounds/scene5.png',
        backgroundImageXVision: '/backgrounds/scene5.png',
        
        hotspots: [

          {
            id: 'hs_panel_reactor',
            x: 67, y: 64, width: 20, height: 30, // sesuaikan koordinat agar pas
            cursor: 'pointer',
            image: '/objects/reactor3.png',
            glitchImage: '/objects/reactorkanan.png',
            action: { type: 'open_power' },

          },
          {
            id: 'hs_panel_cooling',
            x: 41, y: 69, width: 20, height: 30, // sesuaikan koordinat agar pas
            cursor: 'pointer',
            image: '/objects/reactor2.png',
            glitchImage: '/objects/reactortengah.png',
            action: { type: 'open_cooling' },

          },
          {
            id: 'hs_panel_power',
            x: 16, y: 64, width: 20, height: 30, // sesuaikan koordinat agar pas
            cursor: 'pointer',
            image: '/objects/reactor1.png',
            glitchImage: '/objects/reactorkiri.png',
            action: { type: 'open_reactor' },

          },
          {
            id: 'hs_treasure_umbrella',
            x: 10, y: 60, width: 5, height: 6,
            cursor: 'pointer',
            image: '/treasures/umbrella.png',
            action: { type: 'collect_treasure', treasureId: 'treasure_lv7_umbrella' } as any,
            visible: { hideAfterUsed: true },
          },
        ],
      },
      char3Layer: {
        backgroundImage: '/backgrounds/scene5.png',
        hotspots: [

          {
            id: 'hs_panel_reactor',
            x: 67, y: 64, width: 20, height: 30, // sesuaikan koordinat agar pas
            cursor: 'pointer',
            image: '/objects/reactor3.png',
            glitchImage: '/objects/reactorkanan.png',
            action: { type: 'open_power' },

          },
          {
            id: 'hs_panel_cooling',
            x: 41, y: 69, width: 20, height: 30, // sesuaikan koordinat agar pas
            cursor: 'pointer',
            image: '/objects/reactor2.png',
            glitchImage: '/objects/reactortengah.png',
            action: { type: 'open_cooling' },

          },
          {
            id: 'hs_panel_power',
            x: 16, y: 64, width: 20, height: 30, // sesuaikan koordinat agar pas
            cursor: 'pointer',
            image: '/objects/reactor1.png',
            glitchImage: '/objects/reactorkiri.png',
            action: { type: 'open_reactor' },

          }
        ],
      },
    },
  ],
  sceneComics: {
    scene7_5: {
      trigger: 'on_enter',
      src: '/comic/scene5awalkayshi.png',
      srcByReleasedCharacter: {
        char1: {
          src: '/comic/scene5awalkayshi.png',
          panels: [
            { x: 0.5, y: 0, width: 27.5, height: 38.5 },
            { x: 28, y: 0, width: 17, height: 38.5 },
            { x: 45.2, y: 0, width: 16, height: 38.5 },
            { x: 61.5, y: 0, width: 21.4, height: 38.5 },
            { x: 83, y: 0, width: 100, height: 38.5 },
            { x: 0, y: 38.9, width: 60.2, height: 61.1 },
            { x: 60.2, y: 38.9, width: 39.6, height: 29.9 },
            { x: 60.2, y: 68.8, width: 39.6, height: 30 },
          ],
        },
        char2: {
          src: '/comic/scene5awalvania.png',
          panels: [
            { x: 0.5, y: 0, width: 27.5, height: 38.5 },
            { x: 28, y: 0, width: 17, height: 38.5 },
            { x: 45.2, y: 0, width: 16, height: 38.5 },
            { x: 61.5, y: 0, width: 21.4, height: 38.5 },
            { x: 83, y: 0, width: 100, height: 38.5 },
            { x: 0, y: 38.9, width: 60.2, height: 61.1 },
            { x: 60.2, y: 38.9, width: 39.6, height: 29.9 },
            { x: 60.2, y: 68.8, width: 39.6, height: 30 },
          ],
        },
      },
      panels: [
        { x: 0.5, y: 0, width: 27.5, height: 38.5 },
        {x: 28, y: 0, width: 17, height: 38.5},
        {x: 45.2, y: 0, width: 16,  height: 38.5 ,},
        {x: 61.5, y: 0, width: 21.4, height: 38.5},
        {x: 83, y: 0, width: 100, height: 38.5},
        {x: 0, y: 38.9, width: 60.2, height: 61.1},
        {x: 60.2, y: 38.9, width: 39.6, height: 29.9},
        {x: 60.2, y: 68.8, width: 39.6, height: 30},
        

      ],
      
    },
    scene7_5_reactor_complete: {
      trigger: 'on_reactor_complete',
      src: '/comic/scene5reactorvania.png',
      srcByReleasedCharacter: {
        char1: {
          src: '/comic/scene5reactorkayshi.png',
          panels: [
            { x: 0.5, y: 0, width: 35.5, height: 35 },
            { x: 36, y: 0, width: 33.4, height: 35 },
            { x: 69.5, y: 0, width: 30.2, height: 35 },
            { x: 0.5, y: 35, width: 27.8, height: 25.3 },
            { x: 28.3, y: 35, width: 27, height: 25 },
            { x: 55.2, y: 35, width: 44.5, height: 25 },
            { x: 0.5, y: 60.7, width: 37, height: 39.3 },
            { x: 37.6, y: 60.7, width: 62, height: 39.3 },
          ],
        },
        char2: {
          src: '/comic/scene5reactorvania.png',
          panels: [
            { x: 0.5, y: 0, width: 35.5, height: 35 },
            { x: 36, y: 0, width: 33.4, height: 35 },
            { x: 69.5, y: 0, width: 30.2, height: 35 },
            { x: 0.5, y: 35, width: 27.8, height: 25.3 },
            { x: 28.3, y: 35, width: 27, height: 25 },
            { x: 55.2, y: 35, width: 44.5, height: 25 },
            { x: 0.5, y: 60.7, width: 37, height: 39.3 },
            { x: 37.6, y: 60.7, width: 62, height: 39.3 },
          ],
        },
      },
      panels: [
        { x: 0.5, y: 0, width: 35.5, height: 35 },
        {x: 36, y: 0, width: 33.4, height: 35},
        {x: 69.5, y: 0, width: 30.2,  height: 35 ,},
        {x: 0.5, y: 35, width: 27.8, height: 25.3},
        {x: 28.3, y: 35, width: 27, height: 25},
        {x: 55.2, y: 35, width: 44.5, height: 25},
        {x: 0.5, y: 60.7, width: 37, height: 39.3},
        {x: 37.6, y: 60.7, width: 62, height: 39.3},
        

      ],
      
    },
    scene7_5_all_complete: {
      trigger: 'on_all_complete',
      src: '/comic/scene5_all_complete.png',
      srcByReleasedCharacter: {
        char1: {
          src: '/comic/scene5reactorkayshi.png',
          panels: [{ x: 0, y: 0, width: 100, height: 100 }],
        },
        char2: {
          src: '/comic/scene5reactorvania.png',
          panels: [{ x: 0, y: 0, width: 100, height: 100 }],
        },
      },
      panels: [{ x: 0, y: 0, width: 100, height: 100 }],
    },
    scene7_3_cctv_complete: {
      trigger: 'on_cctv_complete',
      src: '/comic/scene3akhir.png',
      panels: [
        // Baris 1
        { x: 0.2, y: 1, width: 30.9, height: 31.8, enterFrom: 'fade' },
        { x: 31.2, y: 1, width: 35, height: 31.7, enterFrom: 'slide-right' },
        { x: 66.2, y: 1, width: 33.6, height: 31.7, enterFrom: 'slide-left' },
        // Baris 2
        { x: 0.2, y: 33.4, width: 36.2, height: 28.9, enterFrom: 'slide-left' },
        { x: 36.6, y: 33.4, width: 19.99, height: 28.9, enterFrom: 'scale', effect: 'flash' },
        { x: 56.8, y: 33.4, width: 43.1, height: 28.9, enterFrom: 'slide-right' },

        // Baris 3
        { x: 0.2, y: 62.7, width: 22.9, height: 37, enterFrom: 'slide-up' },
        { x: 23.3, y: 62.7, width: 11.7, height: 37, enterFrom: 'slide-up' },
        { x: 35, y: 62.7, width: 21.9, height: 37, enterFrom: 'scale', effect: 'flash' },
        { x: 57, y: 62.7, width: 42.9, height: 37, enterFrom: 'scale', effect: 'flash' },
      ],
    },
    scene7_4_release: {
      trigger: 'on_pod_release',
      src: '/comic/scene4kayshi.png',
      panels: SCENE7_4_RELEASE_PANELS,
      srcByReleasedCharacter: {
        char1: {
          src: '/comic/scene4kayshi.png',
          panels: SCENE7_4_RELEASE_PANELS,
        },
        char2: {
          src: '/comic/scene4vania.png',
          panels: SCENE7_4_RELEASE_PANELS,
            },
      },
    },
    scene7_5_final_button: {
      trigger: 'on_final_button',
      src: '/comic/scene5awalkayshi.png', // placeholder - replace with actual final button comic
      srcByReleasedCharacter: {
        char1: {
          src: '/comic/buttonkayshi.png',
          panels: [
    { x: 0.5, y: 0, width: 30.2, height: 49.9 },
    { x: 30.8, y: 0, width: 38.7, height: 49.9 },
    { x: 69.8, y: 0, width: 15.2, height: 49.9 },
    { x: 85.2, y: 0, width: 14.5, height: 49.9 },
    { x: 0.5, y: 49.9, width: 56.4, height: 51.1 },
    { x: 56.8, y: 49.9, width: 15.6, height: 51.1 },
    { x: 72.4, y: 49.9, width: 27.3, height: 51.1 }
  ]
        },
        char2: {
          src: '/comic/buttonvania.png',
          panels: [
     { x: 0.5, y: 0, width: 30.2, height: 49.9 },
    { x: 30.8, y: 0, width: 38.7, height: 49.9 },
    { x: 69.8, y: 0, width: 15.2, height: 49.9 },
    { x: 85.2, y: 0, width: 14.5, height: 49.9 },
    { x: 0.5, y: 49.9, width: 56.4, height: 51.1 },
    { x: 56.8, y: 49.9, width: 15.6, height: 51.1 },
    { x: 72.4, y: 49.9, width: 27.3, height: 51.1 }
  ]
        },
      },
      panels: [{ x: 0.5, y: 0, width: 30.2, height: 49.9 },
    { x: 30.8, y: 0, width: 38.7, height: 49.9 },
    { x: 69.8, y: 0, width: 15.2, height: 49.9 },
    { x: 85.2, y: 0, width: 14.5, height: 49.9 },
    { x: 0.5, y: 49.9, width: 56.4, height: 51.1 },
    { x: 56.8, y: 49.9, width: 15.6, height: 51.1 },
    { x: 72.4, y: 49.9, width: 27.3, height: 51.1 }],
    },
    scene7_5_post_brainmaze: {
      trigger: 'on_post_brainmaze',
      src: '/comic/scene5awalkayshi.png', // placeholder - replace with actual post brainmaze comic
      srcByReleasedCharacter: {
        char1: {
          src: '/comic/escapekayshi.png',
          panels: [
    { x: 0.3, y: 0, width: 49.3, height: 48.5 },
    { x: 49.9, y: 0, width: 49.8, height: 48.5 },
    { x: 0.3, y: 48.9, width: 99.4, height: 51.1 }
  ]
        },
        char2: {
          src: '/comic/escapevania.png',
          panels: [
    { x: 0.3, y: 0, width: 49.3, height: 48.5 },
    { x: 49.9, y: 0, width: 49.8, height: 48.5 },
    { x: 0.3, y: 48.9, width: 99.4, height: 51.1 }
  ]
        },
      },
      panels: [{ x: 0.3, y: 0, width: 49.3, height: 48.5 },
    { x: 49.9, y: 0, width: 49.8, height: 48.5 },
    { x: 0.3, y: 48.9, width: 99.4, height: 51.1 }],
    },
  },

  sceneDialogs: {
    scene7_1_item: [
      {
        character: 'Ethan',
        text: 'apa ini? sepertinya ini bagian dari suatu alat yang mungkin berguna,aku akan mencari bagian yang lainnya ',
        side: 'left' as const,
        avatarLeft: '/avatars/kayshihack2.png',
      },
      {
        character: 'Ethan',
        text: 'Hacking Device,aku akan menggunakannya untuk mengakses panel code disana',
        side: 'left' as const,
        avatarLeft: '/avatars/kayshihack.png',
      },
    ],
    scene7_1_flashlight: [
      {
        character: 'Vania',
        text: 'Senter UV? Mungkin ada sesuatu yang tersembunyi disini.',
        side: 'right' as const,
        avatarRight: '/avatars/vania4.png',
      },
    ],
   
    scene7_2_enter: [
      {
        character: 'Ethan',
        text: 'Lorong dan Pintu ya. Haduhh masih ada yang harus diinput sepertinya untuk bisa membuka pintu yg di ujung sana',
        side: 'left' as const,
        avatarLeft: '/avatars/zkayshi1.png',
      },
      {
        character: 'Ethan',
        text: 'Pasti petunjuknya ada di salah satu dari kedua pintu ini',
        side: 'left' as const,
        avatarLeft: '/avatars/zkayshi1.png',
      },
      {
        character: 'Ethan',
        text: 'Bagaimana kalau kita membagi tugas saja,aku ke pintu kiri kamu ke pintu kanan',
        side: 'left' as const,
        avatarLeft: '/avatars/zkayshi3.png',
      },
      {
        character: 'Vania',
        text: 'Hmm, ide bagus. Baiklah,aku akan memeriksa pintu kanan untuk mencari petunjuknya',
        side: 'right' as const,
        avatarRight: '/avatars/vania1.png',
      },
    ],
    scene7_2_code_found: [
      {
        character: 'Vania',
        text: 'Ini dia... potongan kode yang kita cari!',
        side: 'right' as const,
        avatarRight: '/avatars/perpus4.png',
      },
      {
        character: 'Ethan',
        text: 'Bagus! Tapi masih ada yang kurang.',
        side: 'left' as const,
        avatarLeft: '/avatars/zkayshi4.png',
      },
    ],
    scene7_3_pc: [
      {
        character: 'Ethan',
        text: 'PC ini. membutuhkan akses login,Sepertinya ada kaitannya dengan foto yang ada di meja',
        side: 'left' as const,
        avatarLeft: '/avatars/kayshimikir.png',
      },
      {
        character: 'Vania',
        text: 'PC ini. membutuhkan akses login,Sepertinya ada kaitannya dengan foto yang ada di meja',
        side: 'right' as const,
        avatarRight: '/avatars/vania1.png',
      },
      
    ],
    scene7_3_mark: [
      {
        character: 'Vania',
        text: 'Tanda ini... ini pasti petunjuk, mungkin ada tanda lainnya,dan sepertinya berhubungan dengan warna yang ada di PC',
        side: 'right' as const,
        avatarRight: '/avatars/vania3.png',
      },
      {
        character: 'Ethan',
        text: 'Tanda ini... ini pasti petunjuk, mungkin ada tanda lainnya,dan sepertinya berhubungan dengan warna yang ada di PC',
        side: 'left' as const,
        avatarLeft: '/avatars/kayshimikir.png',
      },
      
      
    ],
    scene7_3_folder: [
      {
        character: 'Ethan',
        text: 'Folder rahasia terbuka. Ini yang kita butuhkan.',
        side: 'left' as const,
        avatarLeft: '/avatars/zkayshi4.png',
      },
      
    ],
    scene7_3_enter: [
      {
        character: 'Ethan',
        text: 'Kita sudah sampai di ruang kerja. Coba periksa komputer dan petunjuk di sekitarnya.',
        side: 'left' as const,
        avatarLeft: '/avatars/zkayshi1.png',
      },
       {
        character: 'Ethan',
        text: 'Koran,Foto,Kalender. Pasti ada hubungannya ',
        side: 'left' as const,
        avatarLeft: '/avatars/zkayshi2.png',
      },
      {
        character: 'Vania',
        text: 'Aku akan menggunakan kemampuan penglihatan dan terjemahanku untuk mencari tahu petunjuk menyelesaikan mesin ini',
        side: 'right' as const,
        avatarRight: '/avatars/vania3.png',
      },
    ],
    scene7_4_enter: [
      {
        character: 'Katsuragi',
        text: 'Aku harus membebaskan mereka tapi sayangnya hanya bisa 1 orang saja, namun sebelum itu aku harus menyelaraskan frekuensinya',
        side: 'left' as const,
        avatarLeft: '/avatars/katsuragi1.png',
      },
    ],
    scene7_5_enter: [
      {
        character: 'Katsuragi',
        text: 'Ini ruang reaktor. Kita harus menonaktifkan reactornya secepat mungkin,tapi sepertinya mesin ini adalah securitynya,aku harus menyelesaikannya',
        side: 'left' as const,
        avatarLeft: '/avatars/katsuragi1.png',
      },
      {
        character: 'Vania',
        text: 'Aku akan menggunakan kemampuan penglihatan dan terjemahanku untuk mencari tahu petunjuk menyelesaikan mesin ini',
        side: 'right' as const,
        avatarRight: '/avatars/vania3.png',
      },
       {
        character: 'Ethan',
        text: 'Aku akan menggunakan kemampuan penglihatan dan terjemahanku untuk mencari tahu petunjuk menyelesaikan mesin ini',
        side: 'left' as const,
        avatarLeft: '/avatars/kayshiup1.png',
      },
    ],
    scene7_4_machine: [
      {
        character: 'Katsuragi',
        text: 'Mesin ini... Aku harus menyamakan frekuensinya',
        side: 'left' as const,
        avatarLeft: '/avatars/katsuragi1.png',
      },
      
    ],
    scene7_4_chest: [
      {
        character: 'Katsuragi',
        text: 'Ini dia yang aku butuhkan, Chip hacking device upgrade, dan barang lainnya untuk bisa meng akses mesin ini',
        side: 'left' as const,
        avatarLeft: '/avatars/katsuragi2.png',
      },
    ],
    scene7_5_reactor_done: [
      {
        character: 'Ethan',
        text: 'Satu reaktor selesai! Dua lagi...',
        side: 'left' as const,
        avatarLeft: '/avatars/zkayshi3.png',
      },
      {
        character: 'Code Master',
        text: 'Boleh jugaa... lihat apa yang akan terjadi selanjutnya',
        side: 'right' as const,
        avatarRight: '/avatars/villain1.png',
      },
      {
        character: 'Code Master',
        text: 'Clickk....',
        side: 'right' as const,
        avatarRight: '/avatars/villain1.png',
      },
    ],
    scene7_5_outro: [
      {
        character: 'Ethan',
        text: 'Akhirnya shield di reactor sudah hilang aku hanya tingal menekan tombol yang ada disana dan Code master akan berakhir',
        side: 'left' as const,
        avatarLeft: '/avatars/zkayshi6.png',
      },
      {
        character: 'Vania',
        text: 'Tarik tuas itu. Sekarang!',
        side: 'right' as const,
        avatarRight: '/avatars/perpus4.png',
      },
    ],
  },
};
