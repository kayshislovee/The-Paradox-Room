# 🔐 Escape Room — React + TypeScript + Vite

Webgame teka-teki escape room 2D berbasis point-and-click.

## 🚀 Setup

```bash
npm install
npm run dev
```

---

## 📁 Struktur Project

```
src/
├── types/
│   └── game.types.ts        # Semua tipe data (Level, Hotspot, Puzzle, dll)
├── store/
│   └── gameStore.ts         # Zustand store (game state + settings)
├── data/
│   └── levels.ts            # Definisi semua level dan kontennya
├── hooks/
│   ├── useTimer.ts          # Countdown timer
│   └── useHotspotAction.ts  # Handler klik hotspot
└── components/
    ├── MainMenu/            # Layar menu utama
    ├── LevelSelect/         # Pilih level (dengan lock & bintang)
    ├── GameScene/           # Scene gameplay + hotspot
    ├── HUD/                 # Timer, navigasi scene, tombol keluar
    ├── Inventory/           # Panel item & clue
    ├── PuzzleModal/         # Modal puzzle (keypad/sequence/pattern)
    ├── WinScreen/           # Layar menang/kalah
    └── Settings/            # Volume, bahasa, reset progress
```

---

## 🎮 Cara Menambah Level

Edit `src/data/levels.ts` dan tambahkan objek Level baru ke array `LEVELS`.

### Struktur Level Singkat

```ts
{
  id: 'level_2',
  title: 'Gudang Gelap',
  scenes: [
    {
      id: 'scene_gudang',
      backgroundImage: '/backgrounds/gudang.jpg',  // taruh di /public/backgrounds/
      hotspots: [
        {
          id: 'hs_kotak',
          label: '📦 Kotak',
          x: 30, y: 50, width: 15, height: 20,      // posisi % di layar
          action: { type: 'give_item', itemId: 'item_tang' },
          visible: { hideAfterUsed: true },
        }
      ]
    }
  ],
  items: [{ id: 'item_tang', name: 'Tang', description: '...', icon: '🔧' }],
  clues: [...],
  puzzles: [...],
  exitPuzzleId: 'puzzle_pintu_gudang',
}
```

### Tipe Aksi Hotspot

| type | Deskripsi |
|------|-----------|
| `give_item` | Tambahkan item ke inventory |
| `give_clue` | Catat clue ke panel Clue |
| `open_puzzle` | Buka modal puzzle |
| `open_zoom` | Buka gambar zoom |
| `use_item` | Gunakan item dari inventory ke objek ini |
| `message` | Tampilkan notifikasi teks |

### Tipe Puzzle

| type | Deskripsi | `answer` |
|------|-----------|----------|
| `keypad` | Input kode angka | `"3971"` |
| `sequence` | Tekan tombol urutan | `["MERAH","BIRU","HIJAU"]` |
| `pattern` | Klik sel grid | `"0,2,4,6,8"` (index sel) |

---

## 🖼️ Background Image

Taruh gambar di `/public/backgrounds/` lalu referensikan di level:
```ts
backgroundImage: '/backgrounds/nama_gambar.jpg'
```

Jika belum ada gambar, scene akan menampilkan placeholder gelap.

---

## 💾 Progress

Progress disimpan otomatis di `localStorage` via Zustand persist.
Reset bisa dilakukan dari menu Settings.
