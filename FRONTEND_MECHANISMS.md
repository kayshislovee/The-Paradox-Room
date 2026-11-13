# Mekanisme Frontend — The Paradox Room

Dokumen ini menjelaskan **bagaimana frontend project ini bekerja**: struktur tata letak, sistem animasi, sistem tools/interaksi, pengelolaan state, sampai alat bantu developer.

> Stack: **React 18 + TypeScript + Vite**, state management **Zustand** (+ `persist`), styling **CSS Modules** untuk komponen reusable dan **inline style** untuk komponen satu-pakai, data dari **Laravel API**, realtime **Reverb + PeerJS**.

---

## Daftar isi

1. [Arsitektur aplikasi](#1-arsitektur-aplikasi)
2. [Tata letak (layout)](#2-tata-letak-layout)
3. [Sistem animasi](#3-sistem-animasi)
4. [Sistem tools & interaksi](#4-sistem-tools--interaksi)
5. [Manajemen state](#5-manajemen-state)
6. [Alur data](#6-alur-data)
7. [Alat bantu developer](#7-alat-bantu-developer)
8. [Gotcha & best practice](#8-gotcha--best-practice)

---

## 1. Arsitektur aplikasi

### 1.1 Satu entry, banyak "screen"

`src/App.tsx` adalah **root tunggal**. Semua halaman adalah *state* `screen` di Zustand, bukan router:

```tsx
const screen = useGameStore((s) => s.screen);

switch (screen) {
  case 'splash':      return <Splash />;
  case 'level_select': return <LevelSelect ... />;
  case 'lobby':       return <LobbyScreen ... />;
  case 'gameplay':    return <GameScene />;
  case 'win':         return <WinScreen ... />;
  case 'lose':        return <LoseScreen ... />;
  case 'achievements':return <AchievementScreen />;
  case 'treasures':   return <TreasureScreen />;
}
```

**Nilai `screen`**: `splash`, `main_menu`, `level_select`, `lobby`, `gameplay`, `win`, `lose`, `achievements`, `treasures`, `profile`, `settings`.

Kenapa bukan React Router? Karena game ini **bukan situs** — transisinya berupa transisi sinematik (loading, comic, dialog), bukan perpindahan URL. Menu tetap "mengapung" di atas `gameplay` (HUD tetap tampil saat inventory/pause dibuka).

### 1.2 Layer di dalam gameplay

Gameplay dibangun sebagai **layer bertumpuk** (semua `position: fixed`, `z-index` naik):

```
z 9998   HologramView, modal level 7 (crafting, chest, monitor, tape)
z 999    SceneTransitionAnimation / puzzle overlay
z 1      HUD + Level7SidePanel + Inventory + Chat
z 0      GameScene (background scene + hotspot + treasure)
```

---

## 2. Tata letak (layout)

### 2.1 Struktur `GameScene`

```
.root            flex column, 100vh, overflow hidden, bg #0d0015
 <HUD />                         (bar atas: timer, level, clue, hint)
 .main          flex row, margin-top 56px
     <Level7SidePanel />        (khusus level 7: craft, X-Vision, translate)
     .sceneWrapper   flex 1, relatif, overflow hidden
         .background  aspect-ratio 1536/1024, background-size cover
             <TreasureLayer />   (treasure yang bisa diklik)
             hotspot (absolut, %)
             polygon overlay (SVG)
```

**Proporsi background dikunci** dengan `aspect-ratio: 1536 / 1024`  semua koordinat hotspot (persentase) selalu cocok dengan gambar, whatever ukuran layar.

### 2.2 Hotspot: absolut dalam persen

```css
.hotspot {
  position: absolute;
  background: transparent;
  border: 2px solid transparent;
  transition: border-color .2s, background .2s, box-shadow .2s;
}
```

- Posisi `x/y/width/height` dalam **%**  responsif tanpa hitung ulang.
- `.hotspot.used`  `opacity .25; pointer-events: none` (sudah dipakai).
- `.hotspotImage`  `object-fit: contain` + glow saat hover.
- Hotspot dengan bentuk polygons memakai **SVG overlay** (`.polygonOverlay`) dengan animasi *marching ants* (`@keyframes march`  `stroke-dashoffset`).

### 2.3 Styling: dua pendekatan (sengaja)

| Pendekatan | Kapan | Contoh |
|---|---|---|
| **CSS Modules** (`*.module.css`) | Komponen yang punya banyak state visual & dipakai ulang | `GameScene`, `HUD`, `Inventory`, `PuzzleModal`, `LevelSelect`, `WinScreen` |
| **Inline style** | Komponen satu-pakai / tema dinamis | Semua modal level 7, `HologramView`, `CraftingModal` |

Semua modul memakai `styles.xxx` (nama class ter-scope, tidak bentrok global).

### 2.4 Level 7: layout berbeda

Level 7 memakai **side panel** (bukan inventory bawah) karena ada 3 karakter + crafting:

```
+-----------+--------------------------------------+
|    HUD    |                                      |
+-----------+--------------------------------------+
| SIDE      |  scene + char layer                   |
| PANEL     |  (POV per karakter:                  |
|  CRAFT    |   char1 / char2 / char3Layer)         |
|  X-VISION |                                      |
|  TRANSLATE|                                      |
+-----------+--------------------------------------+
```

**Char layer**: tiap scene punya `char1Layer`, `char2Layer`, `char3Layer` — masing-masing berisi `backgroundImage` + `hotspots` sendiri. `Level7scene` memilih layer sesuai `activeCharacter`, jadi tiap pemain melihat dunia dengan objek & tombol yang berbeda (X-Vision hanya untuk karakter 2, dst).

---

## 3. Sistem animasi

Ada **empat teknik** yang dipakai, dipilih sesuai kebutuhan:

### 3.1 CSS keyframes (statis & berulang)

| Keyframe | File | Dipakai untuk |
|---|---|---|
| `introGlow` / `introGlowImage` | `GameScene.module.css` | Hotspot "menyala" sekali saat scene dibuka (2s, `forwards`) |
| `march` | `GameScene.module.css` | Garis hotspot polygon bergeser (idle effect) |
| `pulse` | `HUD.module.css` | Ikon hint berdenyut |
| `slideUp` | `Notification.module.css` | Notifikasi masuk dari bawah |
| `fadeIn` | `Inventory.module.css` | Panel inventory |
| `blink-dot` | `PuzzleModal.module.css` | Titik "mengetik" pada dialog puzzle |
| `craftReady` | inline (Level7SidePanel) | Tombol CRAFT berdenyut kalau bahan siap |

### 3.2 Transisi adegan (fase berurutan)

`SceneTransitionAnimation` memindahkan pemain ke scene lain dengan 4 fase:

```
idle  glow (600ms)  burst (1100ms)  white  pindah scene (saat putih penuh)
```

- Bentuk cahaya = **clip-path polygon** yang titik-titiknya diambil dari data level (`sceneTransitionPoints`), jadi tiap pintu punya bentuk cahaya berbeda.
- Fase `white` = layar putih penuh  baru scene diganti (mencegah "kedip").

### 3.3 Animasi berbasis `requestAnimationFrame`

`BlackHoleTransition` (portal) memakai **RAF + easing** untuk dua tahap:

```ts
const ease = 1 - Math.pow(1 - t, 3);   // easeOutCubic
setRippleSize(ease * 30);              // gelombang menyebar
// fase 2: seluruh konten tersedot ke titik portal (suckProgress)
```

Canvas-based (`BrainMazePuzzle`) juga memakai `requestAnimationFrame` — bukan CSS — karena rendering-nya per-frame (fisika pemain, animasi spike).

### 3.4 Animasi berbasis state (React)

`ComicScene` — panel comic bermunculan bertahap:

```ts
// ComicPanel: { x, y, width, height, enterFrom?, effect?, sfx? }
enterFrom: 'fade' | 'scale' | 'slide-left' | 'slide-right' | 'slide-up'
effect:   'flash' | 'shake' | 'none'
```

- Panel muncul **satu per satu** (click/tap untuk lanjut), dengan durasi & easing per `enterFrom`.
- `effect: 'shake'`  getar 480ms + efek suara (`new Audio(panel.sfx)`).

### 3.5 Efek teks: dialog mengetik

`DialogScreen`:

```ts
const interval = setInterval(() => {           // 1 huruf per tick
  setVisibleChars((c) => c + 1);
}, SPEED);
```

- Klik di mana saja (kecuali tombol **SKIP**/**LANJUT**)  **teks langsung lengkap** (tidak perlu menunggu).
- Tombol **LANJUT**  pindah baris; tombol **SKIP**  lompat ke akhir prolog.
- Musik dialog (level-specific `dialogMusic`) diputar selama dialog.

---

## 4. Sistem tools & interaksi

### 4.1 Hotspot action: 1 dispatcher, 25+ aksi

Semua interaksi objek di scene melewati `useHotspotAction()` — satu `switch` yang memetakan `action.type`:

| Aksi | Contoh |
|---|---|
| `give_item`, `give_item_and_dialog` | ambil item  dapat dialog |
| `give_clue` | dapat clue |
| `open_zoom`, `open_zoom_and_dialog` | buka gambar besar (note/foto) |
| `open_note` | buka catatan (bisa diterjemahkan/X-Vision) |
| `open_puzzle`, `open_puzzle_and_dialog` | buka puzzle |
| `use_item` | pakai item (mis. photocard) |
| `message` | pesan singkat |
| `go_to_scene`, `go_to_scene_and_dialog` | pindah scene |
| `enter_subview`, `exit_subview` | masuk/keluar sub-view (level 7) |
| `open_hacking_minigame` | minigame hacking (level 7) |
| `open_desktop` | desktop dalam scene (level 7) |
| `open_pod_control` | kontrol pod (level 7) |
| `open_chest` | buka peti (level 7) |
| `open_reactor` / `open_cooling` / `open_power` | panel keamanan reaktor (level 7) |
| `open_maze` | maze sederhana |
| `trigger_scene_dialog` | dialog khusus per scene |

**Pola yang dipakai:** aksi selalu triggering **satu efek** (buka modal / beri item / pindah scene) dan effect-nya (dialog, notifikasi) ditangani di tempat yang sama.

### 4.2 Puzzle: satu shell, banyak isi

`PuzzleModal.tsx` adalah **pembungkus seragam** untuk semua puzzle (15+ jenis):

```
PuzzleModal (shell: judul, gaya, tombol close, SFX)
 KeypadPuzzle        (kode angka)
 SymbolPuzzle        (simbol)
 PatternPuzzle       (pola minerba)
 SequencePuzzle      (urutan/hafalan)
 ColorPatternPuzzle  (pola warna)
 ArrowInputPuzzle    (arah/joystick)
 ChemicalBottlePuzzle (sorting)
 LeverPuzzle / SafePuzzle / ComputerPuzzle
 DualPuzzle, PodControlPuzzle, ReactorSecurityModal
 MazePuzzle, BrainMazePuzzle
 SpotDiffrent, HologramView, ExitLockScreen
 HackingMinigame
```

Semua memakai kontrak yang sama: `onSolve()` (dipanggil sekali saat berhasil) dan `onClose()`. Karena itu satu handler di `GameScene` bisa menangani "puzzle selesai" untuk semua jenis:

```tsx
onSolve={() => {
  useGameStore.getState().solvePuzzle(puzzleId);
  useGameStore.getState().triggerSceneDialog('scene7_5_reactor_done');
}}
```

### 4.3 Tools pemain

**Inventory (level 1–6)** — panel bawah dengan 3 tab:

| Tab | Isi |
|---|---|
| **Tools** | `ToolsPanel`: Notes (catatan bebas, auto-save ke `localStorage`) + kalkulator mini |
| **Hint** | tombol pakai hint (mengurangi `hintsRemaining`), menampilkan clue dari server |
| **Chat** | chat multiplayer (Reverb), dengan badge unread kalau tab tidak aktif |

**Hint system**: token hint punya *cooldown* refill (`hintRefillSeconds` dari API, default 5 menit) — diatur di `useHintRefill`.

**Side panel level 7** (ganti inventory, tema hitam-emas):

| Tool | Fungsi |
|---|---|
| **CRAFT** | buka `CraftingModal` — menggabungkan 3 bagian hacking device  *Hacking Device+* (aktif berdenyut kalau bahan siap) |
| **X-VISION** | toggle skill karakter 2 (melihat hotspot khusus X-Vision) |
| **TRANSLATE** | toggle skill karakter 1 (menerjemahkan note) |
| **Karakter** | ganti karakter aktif (Kayshi/Vania/Katsuragi) |

**Item & inventory per karakter (level 7):** `char1Inventory`, `char2Inventory`, `char3Inventory` — item crafting, photocard, tape, dsb. Di multiplayer, inventory milik **pasangan** berasal dari server (`character_inventories`), yang bisa spent/di-transfer antar karakter (pod, transfer reaktor).

### 4.4 Modal & overlay

Semua modal mengikuti pola yang sama:

```tsx
{zoomModal && <ZoomModal ... />}          // gambar besar + caption
{noteModal && <NoteZoom ... />}            // catatan + tombol translate
{activePuzzleId && <PuzzleModal ... />}   // puzzle
{hologramOpen && <HologramView ... />}     // level 7
{spotDiffOpen && <SpotDiffrent ... />}     // level 7
```

Modal **menghentikan timer** (pause) saat terbuka, kecuali di multiplayer (timer harus sinkron antar pemain).

---

## 5. Manajemen state

### 5.1 Zustand + persist

```ts
export const useGameStore = create<GameStore>()(
  persist((set, get) => ({ ... }), {
    name: 'escape-room-game',
    partialize: (state) => ({
      levelProgress, hintTokens, lastHintRefill, unlockedAchievements,
      foundTreasures, token, player, isGuest, sceneBackgroundOverrides,
    }),
    merge: (persisted, current) => { /* hitung ulang refill hint */ },
  })
);
```

- **Hanya data yang perlu bertahan** (login, progress, hint token) yang di-persist.
- `merge` khusus untuk mengisi ulang token hint sesuai waktu sejak `lastHintRefill` — jadi hint token tidak "berhenti mengisi" setelah reload.
- Second store terpisah: `escape-room-settings` (volume musik, mute).

### 5.2 Milik lokal vs milik bersama

| Milik lokal | Milik bersama (multiplayer) |
|---|---|
| scene aktif, modal yang terbuka, key yang ditekan | puzzle yang terpecahkan, hotspot terpakai, treasure ditemukan |
| inventory karakter sendiri (sementara) | inventory karakter pasangan (server berwenang) |
| timer, pause overlay | pause/resume, hint token terpakai |

### 5.3 Akses state di komponen

```ts
// SELEKTOR TUNGGAL (re-render hanya kalau nilainya berubah)
const timeElapsed = useGameStore((s) => s.timeElapsed);

// AKSI (stabil, tidak memicu re-render)
const solvePuzzle = useGameStore((s) => s.solvePuzzle);

// DALAM LOOP / RAF (jangan pakai hook di sini)
const pos = useGameStore.getState().playerCharacter;
```

> Aturan penting: di dalam `requestAnimationFrame` / `setInterval` **tidak boleh** memakai hook — harus `useGameStore.getState()`. Ini juga alasan rendering game tidak ikut re-render tiap frame.

---

## 6. Alur data

```
Admin (Filament) --> MySQL --> API Laravel --> frontend (map di src/lib/apiMap.ts)
                                               Zustand store  komponen
```

`apiMap.ts` adalah **satu-satunya jembatan** DB  game:

| Fungsi | Isi |
|---|---|
| `mapApiLevel` / `buildLevelFromApi` | level dari DB |
| `mergeApiIntoLevel` | level = data lokal + override DB (hotspot, puzzle, dialog, treasure, achievement, profil karakter) |
| `mapApiScene`, `mapHotspot` | scene & hotspot |
| `mapAchievement`, `mapTreasure`, `mapDialogLine`, `mapSceneDialogs` | konten & dialog |
| `resolveAssetPath` | path aset --> URL siap pakai (`/storage/...`, `/objects/...`, URL penuh) |

**Prinsip:** komponen **tidak boleh** membaca data mentah dari API; semuanya lewat mapping ini.

---

## 7. Alat bantu developer

| Tool | Cara pakai | Fungsi |
|---|---|---|
| **Preview scene** | `?preview=level_7:scene7_2` (+ `:char2`) | Buka scene tertentu tanpa main, untuk iterasi cepat |
| **Preview puzzle** | `?puzzle=brainmaze`, `?puzzle=safe`, `?puzzle=computer`, `?puzzle=exitlock`, `?puzzle=chemicalbottles`… | Uji satu puzzle terpisah |
| **Preview comic** | `?comic=level_7&scene=scene7_4&page=2` | Cek halaman comic |
| **Reset cepat** | `Ctrl + Shift + R` (dev) | Hapus `localStorage` & reload |
| **Store di console** | `__gameStore.getState()` | Inspect/ubah state tanpa reload (dev only, `src/main.tsx`) |
| **Panel admin** | `/admin` | Edit konten (level, scene, hotspot, puzzle, dialog, achievement, treasure) |

Semua preview_scene_ adalah *early return* di `App.tsx` sebelum render normal, jadi tidak memengaruhi alur game.

---

## 8. Gotcha & best practice

| Gotcha | Aturan | Contoh |
|---|---|---|
| **"Rendered more hooks than during the previous render"** | Jangan `return null` di tengah component | `GameScene` menaruh guard `if (!level \|\| !scene) return null;` **setelah semua hook** |
| **"Maximum update depth exceeded"** | Jangan buat objek baru di dependency array | `const level = useMemo(() => ..., [storeLevel, staticLevel])` |
| **Efek yang looping** | Effect harus idempoten | `resumeTimer()` tidak menambah counter tiap dipanggil |
| **Object identity** | Level di-cache dengan `useMemo` | Kalau tidak, tiap render objek baru  effect berulan |
| **Data lokal vs API** | Jangan hardcode konten di komponen | Semua lewat `apiMap.ts` |
| **Hook di dalam loop** | Tidak boleh | Pakai `getState()` di dalam RAF/interval |
| **Z-index** | Ikuti layer yang sudah dipakai | Modal  999, HUD = 1, scene = 0 |
| **Timer & modal** | Modal pause timer (kecuali multiplayer) | Supaya waktuLevel tidak berkurang saat baca dialog |

---

*Dokumen ini dibuat dari kode aktual frontend: `src/App.tsx`, `src/components/**` (GameScene, Comic, Dialog, Inventory, Level7, PuzzleModal, UI), `src/hooks/**`, `src/store/gameStore.ts`, `src/lib/apiMap.ts`, dan seluruh `*.module.css`.*
