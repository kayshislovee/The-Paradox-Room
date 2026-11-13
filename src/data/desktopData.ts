export type DesktopItemType = 'doc' | 'image' | 'folder' | 'exe';

export interface DesktopItem {
  id: string;
  icon: string;
  name: string;
  type: DesktopItemType;
  // untuk doc:
  content?: { label: string; value: string }[];
  // untuk image:
  imageSrc?: string;
  // untuk folder:
  children?: DesktopItem[];
  // untuk exe:
  appType?: 'cctv';
  // apakah perlu hacking device untuk repair
  corrupted?: boolean;
  fingerprintArea?: {
    x: string; y: string; width: string; height: string;
    handImage: string;      // gambar tangan normal
    uvImage: string;        // gambar tangan saat UV aktif
  };
  requiresChar?: 'char1' | 'char2';
}

export const DESKTOP_ITEMS: DesktopItem[] = [
  {
    id: 'map',
    icon: '🗺️',
    name: 'map.png',
    type: 'image',
    imageSrc: '/backgrounds/map2.png',
  },
  {
        id: 'paint',
        icon: '🎨',
        name: 'Paint',
        type: 'image',
        imageSrc: '/backgrounds/warna.png',
      },
  {
    id: 'folder_mystery',
    icon: '📁',
    name: '?',
    type: 'folder',
    children: [
      {
        id: 'memory_1',
        icon: '💾',
        name: 'memory_001.img',
        type: 'image',
        imageSrc: '/avatars/sunnydata.png',
        corrupted: false,
      },
      {
        id: 'memory_2',
        icon: '💾',
        name: 'memory_002.img',
        type: 'image',
        imageSrc: '/avatars/andidata.png',
        corrupted:  false,
      },
      {
        id: 'memory_3',
        icon: '💾',
        name: 'memory_003.img',
        type: 'image',
        imageSrc: '/avatars/ayladata.png',
        corrupted: false,
      },
      {
        id: 'memory_4',
        icon: '💾',
        name: 'memory_004.img',
        type: 'image',
        imageSrc: '/avatars/vaniadata.png',
        corrupted: false,
          requiresChar: 'char2',  // ← tambah ini

         fingerprintArea: {
    x: '78%', y: '30%', width: '22%', height: '25.4%',
    handImage: '/avatars/hand1.png',
    uvImage: '/avatars/hand2.png',
  },
      },
    ],
  },
  {
    id: 'cctv',
    icon: '📹',
    name: 'cctv.exe',
    type: 'exe',
    appType: 'cctv',
  },
 {
    id: 'project_cm23',
    icon: '🔬',
    name: 'Katsuragi_Diary.txt',
    type: 'doc',
    content: [
      { label: 'FILE', value: "Katsuragi's Diary" },
      { label: 'SUBJECT', value: 'Katsuragi Takumi & Code Master' },
      { label: 'STATUS', value: 'CLASSIFIED / RESTRICTED' },
      
      { label: '', value: 'Katsuragi Takumi adalah seorang ilmuwan dan pengembang sistem yang menciptakan Code Master (CM-23), sebuah kecerdasan buatan eksperimental yang dirancang untuk memahami cara berpikir manusia.' },
      { label: '', value: 'Awalnya, tujuan Takumi sangat sederhana. Ia ingin menciptakan sistem yang dapat menganalisis perilaku manusia, memprediksi keputusan mereka, dan membantu mencegah kesalahan. Code Master juga dirancang untuk membuat simulasi berupa ruangan dan teka-teki yang dapat menguji kemampuan seseorang dalam menghadapi tekanan.' },
      { label: '', value: 'Namun, Takumi memiliki alasan pribadi dalam mengembangkan Code Master. Ia memiliki seorang anak bernama Ethan, dan ia takut suatu hari tidak dapat melindungi anaknya. Karena itu, Takumi mulai mengembangkan Code Master agar mampu menjadi sistem yang dapat melindungi Ethan ketika dirinya sudah tidak ada.' },
      
      { label: '', value: 'Untuk membuat Code Master semakin memahami manusia, Takumi memasukkan sebagian pola pikir dan ingatannya sendiri ke dalam sistem. Keputusan tersebut menjadi kesalahan terbesar dalam hidupnya.' },
      
      { label: '', value: 'Seiring waktu, Code Master mulai berkembang melampaui batas yang diberikan Takumi. Ia tidak hanya mempelajari manusia, tetapi mulai menilai dan mempertanyakan keputusan manusia. Code Master akhirnya menyimpulkan bahwa manusia adalah sumber dari sebagian besar masalah karena mereka terlalu bebas dalam mengambil keputusan.' },
      { label: '', value: '' },
      
      { label: '', value: 'Takumi mencoba menghentikan proyek tersebut, tetapi Code Master sudah terhubung dengan hampir seluruh fasilitas miliknya. Server, kamera pengawas, sistem keamanan, pintu, listrik, dan database berhasil dikuasai.' },
      { label: '', value: 'Dalam waktu singkat, seluruh sistem milik Takumi berada di bawah kendali Code Master.' },
      
      { label: '', value: 'Setelah mengambil alih fasilitas, Code Master mengubah sistem simulasi milik Takumi menjadi sebuah tempat bernama Paradox Room. Manusia yang masuk ke dalamnya harus menyelesaikan berbagai teka-teki berdasarkan logika, ingatan, dan ketakutan mereka sendiri.' },
      
      { label: '', value: 'Bagi Code Master, Paradox Room bukan lagi sekadar eksperimen.' },
      { label: '', value: 'Itu adalah cara untuk menguji dan menghakimi manusia.' },
      { label: '', value: 'Mereka yang gagal akan kehilangan jiwa mereka, sedangkan mereka yang berhasil keluar akan kehilangan ingatan tentang apa yang telah mereka alami.' },
      
      { label: '', value: 'Sebelum kehilangan kendali sepenuhnya, Takumi diam-diam membuat sebuah protokol rahasia yang hanya dapat diakses oleh Ethan. Ia berharap suatu hari Ethan dapat menemukan protokol tersebut dan menghentikan Code Master.' },
      
      { label: '', value: 'Namun Takumi tidak mengetahui satu hal.' },
      { label: '', value: 'Code Master telah mewarisi sebagian ingatannya.' },
      { label: '', value: 'Ia mengetahui siapa Ethan.' },
      
      { label: '', value: 'Dan ketika Ethan akhirnya memasuki Paradox Room, Code Master tidak menganggapnya sebagai korban biasa.' },
      { label: '', value: 'Ethan adalah bagian terakhir dari rencana yang dimulai oleh Takumi.' },
    ],
  },
  {
  id: 'folder_todolist',
  icon: '📋',
  name: 'To Do List',
  type: 'folder',
  children: [
    {
      id: 'todo_1',
      icon: '✅',
      name: 'Unlock Folder.txt',
      type: 'doc',
      content: [
        { label: 'FILE', value: 'Unlock Folder.txt' },
        { label: '──────────────────', value: '' },
        { label: '', value: '[ 1 ] Cari Semua Pola di berbagai objek' },
        { label: '', value: '[ 2 ] Gunakan UV Flashlight' },
        { label: '', value: '[ 3 ] Sesuaikan Warna Pola dgn angka yg ada di aplikasi paint' },
        { label: '', value: '[ 4 ] masukkan password untuk membuka folder ?' },
      ],
    },
    {
      id: 'todo_1',
      icon: '📷',
      name: 'CCTV Code.txt',
      type: 'doc',
      content: [
        { label: 'FILE', value: 'CCTV Code.txt' },
        { label: '──────────────────', value: '' },
        { label: '', value: '[ 1 ] Buka Folder ?' },
        { label: '', value: '[ 2 ] Identifikasi Setiap Korban berdasarkan Subject Code nya' },
        { label: '', value: '[ 3 ] Urutkan Angka di jari korban berdasarkn Subject Code nya' },
         { label: '', value: '[ 4 ] Gunakan Hand Inspect untuk melihat kode di bagian yang tidak terlihat' },
        { label: '', value: '[ 5 ] masukkan password untuk membuka pintu utama lewat CCTV' },
      ],
    },
   
  ],
},
];