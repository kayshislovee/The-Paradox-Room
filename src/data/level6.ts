import type { Level } from '../types/game.types';



export const LEVEL_6: Level = {
  id: 'level_6',
  title: 'Comeback',
  description: 'Terjebak di taman lab misterius! Selesaikan 3 puzzle untuk membuka pintu keluar.',
  thumbnail: '',
  timeLimit: 720,
  characterAvatar: '/avatars/zkayshi2.png',
characterName: 'Ethan',
  comicSrc: '/comic/lv6.png', 
  exitDoorPoints: '0,40.7 9.4,40.5 9.5,67 -0.1,67.2',
  sceneTransitionPoints: {
    scene_garden_1: '61.6,37.4 61.6,50.4 63.5,54.6 72.4,54.8 74.4,50.6 74.5,37.4 72.1,32.2 64.5,32.4',
    scene_garden_2: '82.2,28.1 82.2,71.4 84.1,75.3 94.1,78.1 90.9,73 91.2,27.1 95.5,24.4 94.7,23.1 84.2,24.4',
  },
  dialogMusic: '/audio/dialog_music.mp3',
  starThresholds: [480, 300, 60],
  music: '/audio/lv6_music.mp3',
  hints: [],
  sceneHints: {
    scene_garden_1: {
      char1: [
        { text: 'Samakan pola urutan bunga dan masukkan ke panel input pattern.', cost: 1 },
        { text: 'Jawaban: merah-orange-kuning-hijau-putih-hijau-hijau-pink-biru', cost: 2 },
      ],
      char2: [
        { text: 'Samakan pola urutan bunga dan masukkan ke panel input pattern.', cost: 1 },
        { text: 'Jawaban: merah-orange-kuning-hijau-putih-hijau-hijau-pink-biru', cost: 2 },
      ],
      char3: [
        { text: 'Samakan pola urutan bunga dan masukkan ke panel input pattern.', cost: 1 },
        { text: 'Jawaban: merah-orange-kuning-hijau-putih-hijau-hijau-pink-biru', cost: 2 },
      ],
    },
    scene_garden_2: {
      char1: [
        { text: 'Baca descriptions monster di poster, dan notes yang ada di kanan.', cost: 1 },
        { text: 'Sesuaikan berdasarkan jumlah kaki, tangan monster, serta temperature dan oksigen yang cocok.', cost: 1 },
        { text: 'Jawaban: 2, 3, 75 F, 27% oxygen', cost: 2 },
      ],
      char2: [
        { text: 'Baca descriptions monster di poster, dan notes yang ada di kanan.', cost: 1 },
        { text: 'Sesuaikan berdasarkan jumlah kaki, tangan monster, serta temperature dan oksigen yang cocok.', cost: 1 },
        { text: 'Jawaban: 2, 3, 75 F, 27% oxygen', cost: 2 },
      ],
      char3: [
        { text: 'Baca descriptions monster di poster, dan notes yang ada di kanan.', cost: 1 },
        { text: 'Sesuaikan berdasarkan jumlah kaki, tangan monster, serta temperature dan oksigen yang cocok.', cost: 1 },
        { text: 'Jawaban: 2, 3, 75 F, 27% oxygen', cost: 2 },
      ],
    },
    scene_garden_3: {
      char1: [
        { text: 'Baca semua notes yang berhubungan dengan table periodic. Isi notes tsb sesuaikan dengan angka dan warna yang ada di table.', cost: 1 },
        { text: 'Setelah mendapatkan angka melalui notes, lihat di table dan lihat warna dari angka yang didapat (misal angka 35 berwarna biru, berarti bottle pertama berwarna biru).', cost: 1 },
        { text: 'Jawaban: biru-kuning-biru-pink', cost: 2 },
      ],
      char2: [
        { text: 'Baca semua notes yang berhubungan dengan table periodic. Isi notes tsb sesuaikan dengan angka dan warna yang ada di table.', cost: 1 },
        { text: 'Setelah mendapatkan angka melalui notes, lihat di table dan lihat warna dari angka yang didapat (misal angka 35 berwarna biru, berarti bottle pertama berwarna biru).', cost: 1 },
        { text: 'Jawaban: biru-kuning-biru-pink', cost: 2 },
      ],
      char3: [
        { text: 'Baca semua notes yang berhubungan dengan table periodic. Isi notes tsb sesuaikan dengan angka dan warna yang ada di table.', cost: 1 },
        { text: 'Setelah mendapatkan angka melalui notes, lihat di table dan lihat warna dari angka yang didapat (misal angka 35 berwarna biru, berarti bottle pertama berwarna biru).', cost: 1 },
        { text: 'Jawaban: biru-kuning-biru-pink', cost: 2 },
      ],
    },
  },

  scenes: [
    // ── SCENE 1 — Panel Warna ────────────────────────────────────────────────
    {
      id: 'scene_garden_1',
      label: 'OutDoor Garden',
      backgroundImage: '/backgrounds/garden.png',
      hotspots: [
        {
          id: 'hs_color_panel',
          x: 76, 
          y: 38, 
          width: 4, 
          height: 9,
          cursor: 'pointer',
          image: '/objects/codegarden.png',
          action: { type: 'open_puzzle', puzzleId: 'puzzle_color_pattern' },
        },
        // Notes 1
        {
          id: 'hs_note_g1',
          x: 41, y: 36, width: 2, height: 6,
          cursor: 'zoom-in',
          image: '/objects/notenone2.png',
          action: { type: 'open_note', image: '/notes/digit1.png' },
        },
        // Notes 2
        {
          id: 'hs_note_g2',
          x: 11, y: 31.6, width: 5, height: 9,
          cursor: 'zoom-in',
          image: '/objects/note2.png',
          action: { type: 'open_note', image: '/notes/digit3.png' },
        },
      ],
    },
    // Scene 1 OPEN
    {
      id: 'scene_garden_1_open',
      label: 'OutDoor Garden Open',
      backgroundImage: '/backgrounds/garden2.png',
      hotspots: [],
      hidden: true,
    },

    // ── SCENE 2 — Panel Parameter ────────────────────────────────────────────
    {
      id: 'scene_garden_2',
      label: 'Experiment Room',
      backgroundImage: '/backgrounds/alien.png',
      hotspots: [
        {
          id: 'hs_param_panel',
          x: -2, y: 55, width: 29, height: 38,
          cursor: 'pointer',
          image: '/objects/placeholder.png',
          action: { type: 'open_puzzle', puzzleId: 'puzzle_arrow_input' },
        },
        // Notes 3
        {
          id: 'hs_note_a1',
          x: 62, y: 36, width: 10, height: 14,
          cursor: 'zoom-in',
          image: '/objects/notenone2.png',
          action: { type: 'open_note', image: '/notes/alien.png' },
        },
        // Notes 4
        {
          id: 'hs_note_a2',
          x: 31, y: 12, width: 18, height: 28,
          cursor: 'zoom-in',
          image: '/objects/poster.png',
          action: { type: 'open_note', image: '/objects/poster2.png' },
        },
        {
          id: 'hs_note_a3',
          x: 59, y: 84, width: 12, height: 11,
          cursor: 'zoom-in',
          image: '/objects/notenone1.png',
          action: { type: 'open_note', image: '/notes/digit4.png' },
        },
      ],
    },
    // Scene 2 OPEN
    {
      id: 'scene_garden_2_open',
      label: 'Experiment Room Open',
      backgroundImage: '/backgrounds/alien2.png',
      hotspots: [],
      hidden: true,
    },

    // ── SCENE 3 — Botol Kimia ─────────────────────────────────────────────────
    {
      id: 'scene_garden_3',
      label: 'Lab Class',
      backgroundImage: '/backgrounds/elements.png',
      hotspots: [
        {
          id: 'hs_chemical_bottles',
          x: 30, y: 44, width: 26, height: 36,
          cursor: 'pointer',
          image: '/objects/bottle.png',
          action: { type: 'open_puzzle', puzzleId: 'puzzle_chemical_bottles' },
        },
        // Notes 5 — bisa zoom in/out (zoomable)
        {
          id: 'hs_note_e1_zoomable',
          x: 43, y: 11, width: 36, height: 46,
          cursor: 'zoom-in',
          image: '/objects/table.png',
          action: { type: 'open_zoom', zoomImage: '/objects/table2.png', label: 'ZOOMABLE' },
        },
        // Notes 6
        {
          id: 'hs_object_katak',
          x: 13, y: 55.7, width: 15, height: 18,
          cursor: 'zoom-in',
          image: '/objects/katak.png',
          action: { type: 'open_zoom', zoomImage: '/objects/katak.png', label: 'ZOOMABLE' },
        },
        // Notes 7
        {
          id: 'hs_note_e3',
          x: 27, y: 74, width: 5, height: 8,
          cursor: 'zoom-in',
          image: '/objects/noteslv6.png',
          action: { type: 'open_note', image: '/notes/clueutama.png' },
        },
        {
          id: 'hs_note_e4',
          x: 15, y: 22, width: 10, height: 14,
          cursor: 'zoom-in',
          image: '/objects/noteslv6.png',
          action: { type: 'open_note', image: '/notes/digit2.png' },
        },
        {
          id: 'hs_note_e5',
          x: 82, y: 75, width: 5, height: 8,
          cursor: 'zoom-in',
          image: '/objects/noteslv6.png',
          action: { type: 'open_note', image: '/notes/clue1.png' },
        },

        {
          id: 'hs_door_garden',
          x: 40, y: 10, width: 20, height: 72,
          cursor: 'pointer',
          action: { type: 'message', text: ' Pintu terbuka! Kamu berhasil kabur dari The Infinity Paradox!' },
          visible: { requiresSolved: 'puzzle_chemical_bottles' },
        },
      ],
      
    },
    
    // Scene 3 OPEN
    {
      id: 'scene_garden_3_open',
      label: 'Lab Class Open',
      backgroundImage: '/backgrounds/elements2.png',
      hotspots: [],
      hidden: true,
    },
  ],

  items: [],
  clues: [],

  puzzles: [
    {
      id: 'puzzle_color_pattern',
      type: 'pattern',
      title: 'Panel Warna Bunga',
      answer: 'merah-orange-kuning-hijau-putih-hijau-hijau-pink-biru',
      patternSize: 9,
      clueIds: [],
    },
    {
      id: 'puzzle_arrow_input',
      type: 'combination',
      title: 'Panel Parameter Lab',
      answer: '2-3-75-27',
      clueIds: [],
    },
    {
      id: 'puzzle_chemical_bottles',
      type: 'combination',
      title: 'Botol Kimia',
      answer: 'biru-kuning-biru-pink',
      clueIds: [],
    },
  ],

  treasures: [
    
    {
      id: 'treasure_garden_2',
      sceneId:'scene_garden_1',
      x: 68, y: 5, width: 6, height: 8,
      image: '/treasures/meteor.png',
      achievementId: 'ach_garden_explorer',
    },
    {
      id: 'treasure_garden_3',
      sceneId: 'scene_garden_3',
      x: 90, y: 10, width: 6, height: 8,
      image: '/treasures/web.png',
      achievementId: 'ach_garden_explorer',
    },
  ],

  achievements: [
    {
      id: 'ach_garden_explorer',
      title: 'Garden Explorer',
      description: 'Temukan semua treasure di The Infinity Paradox!',
      icon: '/achievements/lab.png',
      type: 'treasure',
      levelId: 'level_6',
    },
    {
      id: 'ach_garden_golden',
      title: 'Golden Brain (Garden)',
      description: 'Selesaikan The Infinity Paradox dalam waktu kurang dari 5 menit!',
      icon: '/achievements/lv6.png',
      type: 'time',
      levelId: 'level_6',
      isGolden: true,
    },
    {
      id: 'ach_garden_complete',
      title: 'Paradox Solver',
      description: 'Berhasil kabur dari The Infinity Paradox!',
      icon: '/achievements/lv6kayu.png',
      type: 'time',
      levelId: 'level_6',
    },
    {
      id: 'ach_garden_nohint',
      title: 'Garden Explorer',
      description: 'Temukan semua treasure di The Infinity Paradox!',
      icon: '/achievements/hint.png',
      type: 'time',
      levelId: 'level_6',
    },
     {
    id: 'ach_scene1_complete',
    title: 'Pemecah Paradoks I',
    description: 'Selesaikan Scene 1 di The Infinity Paradox!',
    icon: '/achievements/garden.png',
    type: 'time',
    levelId: 'level_6',
  },
  {
    id: 'ach_scene2_complete',
    title: 'Pemecah Paradoks II',
    description: 'Selesaikan Scene 2 di The Infinity Paradox!',
    icon: '/achievements/alien.png',
    type: 'time',
    levelId: 'level_6',
  },
  {
    id: 'ach_scene3_complete',
    title: 'Pemecah Paradoks III',
    description: 'Selesaikan Scene 3 di The Infinity Paradox!',
    icon: '/achievements/bottle.png',
    type: 'time',
    levelId: 'level_6',
  },
  ],
  // Di dalam LEVEL_6, tambah field sceneDialogs:
sceneDialogs: {
  scene_garden_2: [
    {
      character: 'Ethan',
      text: 'Puzzle pertama selesaii....',
      side: 'left' as const,
      avatarLeft: '/avatars/zkayshi2.png',
      isSystem: false,
    },
     {
      character: 'Ethan',
      text: 'Mari kita lihat apa selanjutnya',
      side: 'left' as const,
      avatarLeft: '/avatars/zkayshi4.png',
      isSystem: false,
    },
    {
      character: 'Code Master',
      text: 'Hehehehe...aku tidak yakin kamu bisa menyelesaikan puzzle ini',
      side: 'right' as const,
      avatarRight: '/avatars/villain2.png',
      isSystem: false,
    },
    {
      character: 'Code Master',
      text: 'Aku harap kamu suka membaca HAHAHAHA..',
      side: 'right' as const,
      avatarRight: '/avatars/villain1.png',
      isSystem: false,
    },
  ],
  scene_garden_3: [
    {
      character: 'Code Master',
      text: 'WOW..Aku melihat ada yang berhasil memecahkan puzzleku, tapi itu tidak cukup untuk menghentikanku HAHAHAH',
      side: 'right' as const,
      avatarRight: '/avatars/villain2.png',
      isSystem: false,
    },
     {
      character: 'Code Master',
      text: 'Selamat Datang di puzzle terakhir,puzzle yang menentukan hidup dan matimu ',
      side: 'right' as const,
      avatarRight: '/avatars/villain2.png',
      isSystem: false,
    },
     {
      character: 'Code Master',
      text: 'HAHAHAHAHA..',
      side: 'right' as const,
      avatarRight: '/avatars/villain1.png',
      isSystem: false,
    },
    {
      character: 'Ethan',
      text: 'Ohh...Kimia? Menantangku dibidang yang aku kuasai? Tchh...',
      side: 'left' as const,
      avatarLeft: '/avatars/zkayshi5.png',
      isSystem: false,
    },
    {
      character: 'Ethan',
      text: 'Ini akan berakhir cepat',
      side: 'left' as const,
      avatarLeft: '/avatars/zkayshi4.png',
      isSystem: false,
    },
  ],
},
comicPages: [
  {
    src: '/comic/comic1.png',  // background halaman 1
    panels: [
      { x: 0.5,  y: 1,  width: 57.4, height: 35.8, enterFrom: 'fade', sfx: '/audio/sfx/nulis.mp3' as const },
      { x: 58,  y: 1, width: 41.3,  height: 35.8, enterFrom: 'slide-left', sfx:'/audio/sfx/angry.mp3' as const },
      { x: 0.5, y: 37, width: 99,  height: 31, enterFrom: 'slide-right' as const, effect: 'flash' ,sfx: '/audio/sfx/evilaugh.mp3' as const },
      { x: 0.5,  y: 68, width: 39.7,  height: 31, enterFrom: 'fade',   sfx: '/audio/sfx/angry.mp3'     as const },
      { x: 40.4, y: 68.2, width: 59,  height: 31, enterFrom: 'slide-right' as const, effect: 'shake' as const },
    ],
  },
  {
    src: '/comic/comic2.png',  // background halaman 2
    panels: [
      { x: 0.5,  y: 1, width: 44, height: 33.5, enterFrom: 'slide-up', sfx: '/audio/sfx/finger.mp3'  as const },
      { x: 44.72,  y: 1, width: 54.8,  height: 33.5, enterFrom: 'slide-left' as const },
      { x: 0.5, y: 34.8, width: 45.2,  height: 27.3, enterFrom: 'fade'       as const },
      { x: 45.9, y: 34.8, width: 53.66,  height: 27.3, enterFrom: 'scale'  , sfx: '/audio/sfx/pain.mp3'   as const },
      { x: 0.5, y: 62.4, width: 99,  height: 33, enterFrom: 'fade'  ,sfx: '/audio/sfx/angry.mp3'     as const, effect: 'flash' as const },
    ],
  },
],

  

  introDialog: [],
  exitPuzzleId: 'puzzle_chemical_bottles',
};