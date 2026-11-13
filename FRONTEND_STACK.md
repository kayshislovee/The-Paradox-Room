# Frontend — The Paradox Room (Escape Room), Deep-dive

Dokumen ini membahas **hanya frontend** (`escape-room/`) sedalam mungkin: teknologi, struktur, state management, komponen, data layer, realtime client, build, dan gotcha.

---

## Daftar isi
1. Stack & tooling
2. Struktur folder lengkap
3. State management — Zustand (`gameStore.ts`)
4. Alur aplikasi — App.tsx & state `screen`
5. Komponen — peta lengkap
6. Data layer — local data, API, mapping
7. Realtime client — Echo, multiplayer, voice chat, chat
8. Hooks — daftar & fungsi
9. Types — kontrak data
10. Styling — CSS Modules & tema
11. Assets di `public/`
12. Gotcha & catatan penting
13. Build & performa

---

## 1. Stack & tooling

| Teknologi | Versi | Peran |
|---|---|---|
| React | 18.3.1 | Library UI — semua komponen |
| TypeScript | 5.5 | Tipe statis (strict-ish via `tsconfig.json`) |
| Vite | 5.4.1 | Dev server (HMR) & bundler production |
| `@vitejs/plugin-react` | 4.3 | Fast Refresh + JSX transform |
| Zustand | 4.5.2 | State store tunggal (+ middleware `persist`) |
| laravel-echo | 2.x | Klien WebSocket (channel Reverb) |
| pusher-js | 8.6 | Driver protokol Pusher (dipakai Reverb) |
| PeerJS | 1.5.5 | Voice chat WebRTC P2P |
| CSS Modules | bawaan Vite | Scoping style per komponen |

Runtime: browser modern (ES2020+). Tidak pakai router — navigasi layar dikelola oleh Zustand `screen`, bukan React Router. Tidak ada Redux/MobX. Tidak ada CSS framework (no Tailwind).

Scripts (`package.json`):
- `npm run dev` → `vite` (localhost:5173)
- `npm run build` → `vite build` → output ke `dist/` (warning chunk besar >500 kB — perlu code splitting bila mau optimal)
- `npm run preview` → serve hasil build lokal

Environment (`.env` frontend, dibaca lewat `import.meta.env`):

```
VITE_API_URL=http://localhost:8000/api
VITE_REVERB_APP_KEY=ilhamkayshi
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

---

## 2. Struktur folder lengkap

```
src/
├─ main.tsx                 # Entry React: render <App/> ke #root
├─ index.css                # Reset & theme global (background #0d0015, warna teks, scrollbar)
├─ echo.ts                  # Inisialisasi laravel-echo → Reverb (singleton)
├─ App.tsx                  # Root component: screen switcher + prolog (loading/comic/dialog) + dev previews
├─ vite-env.d.ts            # Tipe env untuk import.meta.env
│
├─ types/
│  └─ game.types.ts         # Kontrak TS: Level, Scene, Hotspot, Puzzle, DialogLine, Achievement, dll.
│
├─ data/                    # Level hardcoded (fallback + sumber utama L6/L7)
│  ├─ levels.ts             # LEVEL_1..LEVEL_5 (+ export LEVELS gabungan)
│  ├─ level6.ts             # LEVEL_6 (Comeback / taman lab)
│  ├─ level7.ts             # LEVEL_7 (Broken Paradox, multiplayer)
│  ├─ desktopData.ts        # Desktop OS Level 7 (file desktop, XP, tema)
│  ├─ tapedata.ts           # Level 7 — data tape-reader (teks tape A..E)
│  └─ level6.ts / level7.ts # …
│
├─ store/
│  └─ gameStore.ts          # Zustand — SATU-SATUNYA state global (screen, level, inventory, dll.)
│
├─ hooks/
│  ├─ useapi.ts             # Fetch helper ke Laravel API (+ types ApiLevel dsb.)
│  ├─ useLevel.ts           # (legacy hook) fetch levels sederhana
│  ├─ useTimer.ts           # Timer mundur (setInterval 1s), pause/resume
│  ├─ useMusic.ts           # playMusic()/pauseMusic()/resumeMusic() — single <audio> bg music
│  ├─ useSFX.ts             # playSFX helpers (click, sukses, error, hint, win, lose, …)
│  ├─ useHintRefill.ts      # Refill hint tokens berkala berdasar config server
│  ├─ useHotspotAction.ts   # Dispatch aksi hotspot (give_item, open_puzzle, collect_treasure, …)
│  ├─ Usepuzzlesync.ts      # Sync puzzle ke lobby (multiplayer) — nama file capital U
│  ├─ useLobby.ts           # Polling lobby (3s) + transisi waiting→playing
│  ├─ useChat.ts            # Chat teks via Reverb (.chat.message.sent)
│  ├─ useVoiceChat.ts       # Voice chat PeerJS (mic, analyser, mute, stop)
│  └─ useTimer.ts …
│
├─ lib/
│  ├─ assetPath.ts          # resolveAssetPath() — path relatif → /storage/… (upload admin)
│  ├─ apiMap.ts             # Map respons API → tipe game (dialog/achievement/treasure/scene dialogs)
│  ├─ multiplayer.ts        # Channel Reverb tunggal + revisi state + applySharedGameState
│  ├─ characterFlow.ts      # Aturan alur karakter Level 7 (urutan karakter aktif, unlock)
│  └─ treasureImage.ts      # resolveTreasureImagePath() — resolver gambar treasure
│
└─ components/
   ├─ Splash/Splash.tsx                 # Main menu + entry "Press any button"
   ├─ Auth/AuthScreen.tsx               # Login / register / guest
   ├─ MainMenu/MainMenu.tsx             # (LEGACY, tidak dipakai — Splash yang menu utama)
   ├─ LevelSelect/LevelSelect.tsx       # Grid level + bintang + lock
   ├─ LoadingScreen/LoadingScreen.tsx   # Preloader gambar+audio sebelum prolog
   ├─ Dialog/
   │  ├─ DialogScreen.tsx               # Dialog prolog (typewriter, klik=teks penuh, LANJUT/SKIP)
   │  └─ SceneDialogOverlay.tsx         # Dialog overlay in-game (scene dialogs, karakter kiri/kanan)
   ├─ Comic/ComicScene.tsx              # Komik cutscene (panel reveal + sfx + shake)
   ├─ GameScene/GameScene.tsx           # Gameplay utama: scene, hotspot render, preloader, zoom modal
   │  ├─ ComputerZoom.tsx               # Zoom layar komputer (level 2/4)
   │  ├─ DoorEscapeAnimation.tsx        # Animasi pintu keluar menang (SVG clip-path)
   │  ├─ SceneTransitionAnimation.tsx   # Transisi glow antar scene (SVG clip-path)
   │  ├─ Notification.tsx               # Toast "hotspot used"/"puzzle solved" dsb.
   │  ├─ ZoomableNote.tsx               # Catatan yang bisa di-zoom & di-drag (pinch)
   │  ├─ NoteZoom.tsx                   # Catatan sederhana (zoom modal)
   │  ├─ ZoomModal.tsx                  # Modal zoom generik (object/zoomImage)
   │  └─ TreasureLayer.tsx              # Render treasure di atas scene (klik untuk koleksi)
   ├─ Level7/                            # Level 7 — subsistem terpisah
   │  ├─ Level7scene.tsx                # Scene utama multiplayer + character layers (char1/2/3)
   │  ├─ Level7SidePanel.tsx            # Panel kanan (inventory karakter + skills)
   │  ├─ Level7SidePanel.tsx            # …
   │  ├─ DesktopOS.tsx                  # "Desktop OS" fiktif (file manager, XP, repair progress)
   │  ├─ TapeReaderModal.tsx            # Tape reader (teks tape A/B/C/D/E/comic)
   │  ├─ CraftingModal.tsx              # Kombinasi item (circuit, tape, …)
   │  ├─ CharacterSelectModal.tsx       # Pilih karakter awal L7
   │  ├─ ChestModal.tsx                 # Peti (pilih item acak/pick)
   │  ├─ HandInspect.tsx                # Inspect tangan (mini-puzzle jari)
   │  ├─ MonitorOverlay.tsx             # Overlay monitor PC (hacking / cctv / brainmaze)
   │  ├─ LoginControl.tsx               # Login screen bertema "pod control"
   │  ├─ GlitchOverlay.tsx              # Overlay glitch VHS saat transisi scene
   │  ├─ Scene5GlitchBanner.tsx         # Banner glitch scene 5
   │  ├─ Level7notemodal.tsx            # Catatan Level 7
   │  └─ Level7*Comic.tsx               # Komik final/khusus L7 ( FinalComic, AllComplete )
   ├─ PuzzleModal/
   │  ├─ PuzzleModal.tsx                # Router puzzle berdasar puzzle.type
   │  ├─ KeypadPuzzle.tsx / keypadkoridor.tsx / keypadperpus.tsx   # Keypad numerik
   │  ├─ PatternPuzzle.tsx              # Pola/pattern (warna bunga L6)
   │  ├─ SequencePuzzle.tsx             # Urutan (pola warna / simbol)
   │  ├─ MazePuzzle.tsx                 # Labirin (Level 7 scene 3)
   │  ├─ BrainMazePuzzle.tsx            # "Brain maze" final L7
   │  ├─ ChemicalBottlePuzzle.tsx       # Urutkan botol kimia (L6)
   │  ├─ ColorPatternPuzzle.tsx         # Pola warna
   │  ├─ ComputerPuzzle.tsx             # Terminal komputer dengan sandi
   │  ├─ SafePuzzle.tsx                 # Brankas kombinasi
   │  ├─ LeverPuzzle.tsx                # Pola tuas (L1)
   │  ├─ SymbolPuzzle.tsx               # Pilihan simbol
   │  ├─ ArrowInputPuzzle.tsx           # Input arah (arrow keys)
   │  ├─ PatternPuzzle.tsx, DualPuzzle.tsx, ExitLockScreen.tsx, ReactorLever.tsx,
   │  ├─ HackingMinigame.tsx            # Hacking minigame (L7)
   │  ├─ PodControlPuzzle.tsx           # Kontrol pod (L7)
   │  ├─ HologramView.tsx               # Tampilan hologram (L7)
   │  ├─ ReactorSecurityModal.tsx       # Modal keamanan reaktor (L7)
   │  └─ SpotDiffrent.tsx               # Spot-the-difference (L7)
   ├─ Achievement/
   │  ├─ AchievementScreen.tsx          # Grid semua achievement (filter per level + status)
   │  └─ AchievementPopup.tsx           # Toast saat unlock (muncul di atas gameplay)
   ├─ Treasure/TreasureScreen.tsx       # Galeri treasure (filter level + zoom gambar)
   ├─ Inventory/
   │  ├─ Inventory.tsx                  # Panel "item dibawa" + alat + slot aktif
   │  └─ ToolsPanel.tsx                 # Panel khusus alat (X-Vision, translation, hacking device)
   ├─ HintSystem/HintSystem.tsx         # Panel hint (token cost, refill)
   ├─ HintToken/HintToken.tsx           # Tampilan hint token compact (top-right HUD)
   ├─ HUD/HUD.tsx                       # Timer, scene navigator, clue counter, quit, pause, hint
   ├─ Lobby/LobbyScreen.tsx             # Multiplayer lobby (host/member, kode, ready, start, chat, voice)
   ├─ Chat/ChatBox.tsx                  # Chat teks dalam lobby game
   ├─ PauseMenu/PauseMenu.tsx           # Resume / quit / settings dari dalam game
   ├─ Settings/Settings.tsx             # Volume musik+SFX, bahasa, reset progress
   ├─ Profile/                          # ProfileIcon (tombol akun) + ProfileModal (email, avatar, bio)
   ├─ Level7/CharacterSelectModal.tsx   # Pilih karakter L7 sebelum mulai
   ├─ WinScreen/WinScreen.tsx           # Layar menang (bintang, achievement baru, tombol replay)
   ├─ WinScreen/LoseScreen.tsx          # Layar kalah (retry / menu)
   └─ UI/                               # Primitif UI bersama
       ├─ SecondButton.tsx + .css       # Tombol sekunder (cokelat/metal)
       ├─ MetalButton.tsx               # Tombol metal utama (game vibe)
       ├─ BlackHoleTransition.tsx       # Transisi "black hole" antar screen
       └─ SplashTransition.tsx          # Transisi splash (background fade)
```

---

## 3. State management — Zustand (`gameStore.ts`)

### 3.1 Kenapa Zustand?

- Tidak perlu Context Provider & reducer boilerplate.
- Satu store bisa diakses dari mana saja: komponen (`useGameStore(selector)`) dan juga non-React (`useGameStore.getState()` — dipakai `multiplayer.ts`, util, dan action functions di dalam store sendiri).
- Middleware `persist` menyimpan sebagian state ke `localStorage` (mis. `foundTreasures`, `levelProgress`, `viewedSceneComics`, dan lainnya — lihat `partialize` bila mengaktifkan `persist`).

### 3.2 Kategori isi store

**Navigasi & layar**
- `screen`: `'splash' | 'main_menu' | 'level_select' | 'gameplay' | 'win' | 'lose' | 'settings' | 'achievements' | 'treasures' | 'lobby'`
- `currentLevelId`, `currentSceneId`, `visitedScenes`
- `goTo(screen)` — navigasi; efek samping: reset modal/overlay tertentu.

**Level & scene runtime**
- `levels: Level[]` — daftar level yang di-load (campuran data lokal + API; lihat §6)
- `timeElapsed`, `timerActive` — hitungan mundur; `useTimer` menaikkannya tiap detik
- `solvedPuzzles: string[]`, `usedHotspots: string[]`
- `sceneComic`, `viewedSceneComics` — cutscene comic per scene (sekali tampil)

**Inventory & item**
- `inventory: Item[]` — item yang dibawa
- `addToInventory`, `removeFromInventory`, `hasItem(id)`
- Level 7: `char1Inventory`, `char2Inventory`, `char3Inventory` + action per karakter

**Clues & hints**
- `discoveredClues: Clue[]`
- `hintsUsed`, `hintsRemaining` (default 5) — diisi ulang dari server (`loadHintConfig`)
- `sceneHints` (optional) — hint per scene & karakter (khusus L6/L7)

**Overlay & modal**
- `zoomModal { image, label }`, `noteModal { image }`, `activePuzzleId`, `activePuzzle`, `sceneDialogOverlay`, `notification`, `newAchievement`, `isPaused`

**Akun & progress**
- `player: { id, username, email } | null`, `token: string | null`, `isGuest: boolean`
- `levelProgress: Record<levelId, { completed, bestTime, stars }>` — dicapai dari server (login) atau lokal (guest)
- `unlockedAchievements: string[] | { achievement_key }[]`

**Multiplayer (L7)**
- `lobbyCode`, `playerCharacter: 'char1' | 'char2' | 'char3'`
- `char1Inventory` … `char3Inventory`
- `releasedCharacter`, `scene5Character`
- `applySharedGameState(state, action, triggeredBy)` — menerapkan state dari Reverb ke store lokal

**Aksi-aksi store yang sering dipakai**
- `startLevel(levelId)` — async; fetch detail level dari API (fallback ke data lokal), set state awal, timer aktif
- `goToScene(sceneId)` — pindah scene (dengan gating Level 6/7)
- `solvePuzzle(puzzleId)` — catat solved + cek `exitPuzzleId` → door animation + `completeLevel`
- `completeLevel()` — hitung bintang, simpan progress, submit leaderboard, cek achievement time-based, `screen='win'`
- `unlockAchievement(id)`, `hasClue`, `markHotspotUsed`, `isHotspotUsed`

### 3.3 Pola akses dari komponen

```tsx
// Seleksi minimal (re-render hanya bila field berubah)
const currentLevelId = useGameStore((s) => s.currentLevelId);
const startLevel = useGameStore((s) => s.startLevel);

// Dari fungsi biasa / util (bukan hook)
const s = useGameStore.getState();
if (s.lobbyCode) multiplayer.syncAction('item_collected', …);
```

### 3.4 Cara kerja `startLevel` (penting)

1. Pastikan treasure sudah di-load dari server (`loadMyProgress`) untuk akun login.
2. Ambil `levelId`; bila `level_7` → pakai LOCAL data (`USE_LOCAL_LEVELS`), termasuk override dari API untuk achievements/treasures/introDialog/sceneDialogs bila tersedia.
3. Selain itu → `fetchLevel(levelId)` dari API; mapping ke `Level` runtime (scenes, puzzles, hints, introDialog, achievements, treasures, sceneDialogs, backgroundImage/hotspots via `resolveAssetPath`).
4. Bila gagal → fallback ke `FALLBACK_LEVELS` (`data/levels.ts`).
5. Set state awal (timer, inventory kosong, scene pertama, dll.) → `screen='gameplay'`.

---

## 4. Alur aplikasi — `App.tsx`

`App` adalah **switch** besar berdasar `screen` (tanpa React Router):

```tsx
{screen === 'gameplay' || screen === 'win' || screen === 'lose' ? (
  <>
    <div style={{ display: screen === 'gameplay' ? 'block' : 'none' }}>
      <GameScene voiceChat={…} />
    </div>
    {screen === 'win' && <WinScreen onStartLevel={handleStartLevel} />}
    {screen === 'lose' && <LoseScreen onStartLevel={handleStartLevel} />}
  </>
) : screen === 'level_select' ? <LevelSelect onStartLevel={handleStartLevel} /> : … }
```

Prolog dikelola terpisah (bukan lewat `screen`):

```tsx
const [showLoading, setShowLoading] = useState(false);
const [showDialog, setShowDialog]   = useState(false);
const [showComic, setShowComic]     = useState(false);
const [pendingLevelId, setPendingLevelId] = useState<string | null>(null);

const handleStartLevel = (levelId) => { setPendingLevelId(levelId); setShowLoading(true); };
const handleLoadingDone = async () => { /* cek comicSrc → showComic; else introDialog→showDialog; else startLevel() */ };
const handleDialogDone  = async () => { await startLevel(pendingLevelId!); setShowDialog(false); setPendingLevelId(null); };
```

Alur: **LoadingScreen → (Comic bila `level.comicSrc`) → DialogScreen (bila `introDialog` ada) → `startLevel()` → GameScene**.

Selain itu `App.tsx` juga memuat blok **dev preview** (`?preview=computer|maze|chemical|…`) untuk membuka komponen puzzle secara terisolasi saat development — bisa diabaikan pemain.

Guard: bila `!player && !isGuest` → `<AuthScreen/>`.
Profile popup ditampilkan hanya di `splash`/`main_menu`.

---

## 5. Komponen — per kategori

### 5.1 Navigasi & layar root

- **`Splash.tsx`** — "The Paradox Room"; tombol START / MULTIPLAYER / ACHIEVEMENTS / TREASURES / SETTINGS / QUIT; memanggil `loadLevels()` + `loadMyProgress()` saat mount; klik mana pun → masuk menu.
- **`AuthScreen.tsx`** — LOGIN (email+password), DAFTAR, atau **LANJUT SEBAGAI GUEST** (tanpa akun).
- **`LevelSelect.tsx`** — grid 7 level (urutan dari DB `order`), bintang terbaik, lock, tooltip deskripsi; `SELECT` → `handleStartLevel(levelId)`.
- **`LoadingScreen.tsx`** — preload semua gambar+audio level; progress bar; tombol "MASUK LEVEL".
- **`Splash.tsx`** (menu) → **`GameScene.tsx`** alur utama setelah start.

### 5.2 Dialog & comic

- **`DialogScreen.tsx`** (prolog) — typewriter 30 ms/karakter; klik mana pun → teks penuh; LANJUT → baris berikut/end; SKIP → lewati seluruh prolog; style beda untuk baris `isSystem` (hijau monospace).
- **`SceneDialogOverlay.tsx`** (in-game) — dialog kecil di tengah/bawah layar saat puzzle/item tertentu di-trigger; posisi `bottom | left | right`; klik menyelesaikan ketikan; tombol LANJUT melompat langsung.
- **`ComicScene.tsx`** — komik cutscene: panel reveal satu-per-satu (sfx per panel: `enterFrom: fade/slide-left/…`, `effect: flash|shake`); `sceneComics` dapat dipicu dari gameplay (mis. reactor selesai, scene 5).

### 5.3 Gameplay inti (`GameScene.tsx`)

Tanggung jawab: render background scene, render semua hotspot (button transparan atau dengan `image`), preload aset, `ZoomableNote`/`NoteZoom`/`ZoomModal` untuk zoom, HUD (timer/navigasi), daftar puzzle aktif, dan `TreasureLayer` (klik untuk koleksi).

Detail penting:
- Hotspot dirender sebagai `<button>` dengan posisi `left/top/width/height` dalam **persen** (bukan px).
- `cursor` per hotspot (`pointer`, `zoom-in`, `not-allowed`) — dari DB (editable via admin).
- `visible.requiresItem` / `visible.requiresSolved` — sembunyikan/kunci hotspot sebelum syarat terpenuhi.
- `zIndex` menentukan urutan tampil.
- Background scene = `backgroundImage` dari API (bisa upload dari admin) atau data lokal.

### 5.4 Scene transisi & door escape

- **`DoorEscapeAnimation.tsx`** — animasi kemenangan: SVG clip-path polygon glow → burst → putih layar → `completeLevel()`. Points dibaca dari `exitDoorPoints` (file lokal, semua level).
- **`SceneTransitionAnimation.tsx`** — transisi antar scene (klik pintu → glow burst); points dari `sceneTransitionPoints` (file lokal).

### 5.5 Level 7 subsistem

- **`Level7scene.tsx`** — scene utama level 7: character layers (char1/2/3) — tiap karakter punya background & hotspot sendiri; X-Vision untuk char2; sub-views (Control Room, Storage Room); scene 5 glitch; multiplayer sync awareness.
- **`Level7SidePanel.tsx`** — panel kanan: inventori karakter aktif + skills.
- **`DesktopOS.tsx`** — "Desktop OS" fiktif di dalam game: file explorer, aplikasi, XP; dipakai untuk puzzle PC.
- **`HandInspect.tsx`** — inspect tangan (mini puzzle jari).
- **`TapeReaderModal.tsx`** — baca tape rusak (teks tape A/B/C/D/E/comic).
- **`CraftingModal.tsx`** — kombinasi item: rangkaian (circuit+wire+tape), tape-comic, dll.
- **`CharacterSelectModal.tsx`** — awal game: pilih karakter (Ethan / Vania / Katsuragi).
- **`ChestModal.tsx`** — peti (item acak/pick, buka dengan kunci).
- **`MonitorOverlay.tsx`**, **`LoginControl.tsx`**, **`PodControlPuzzle.tsx`** — kontrol "pod" final.
- **`Level7notemodal.tsx`**, **`Level7scene.tsx`**, **`Level7SidePanel.tsx`**, **`Scene5GlitchBanner.tsx`**, **`GlitchOverlay.tsx`** — UI pendukung level 7.
- **`Level7FinalComic.tsx`**, **`Level7AllCompleteComic.tsx`** — komik penutup level 7.

### 5.6 PuzzleModal (semua puzzle game)

`PuzzleModal.tsx` memilih komponen berdasarkan `puzzle.type`:

| type | Komponen | Level |
|---|---|---|
| `pattern` | PatternPuzzle (pola warna 9 slot) | L6 |
| `combination` | ArrowInputPuzzle / ColorPatternPuzzle / ChemicalBottlePuzzle | L1, L4, L5, L6 |
| `keypad` | KeypadPuzzle + varian koridor/perpus | L2, L3, L7 |
| `sequence` | SequencePuzzle | L1, L4 |
| `maze` | MazePuzzle (dinding grid) | L7 |
| `brain_maze` | BrainMazePuzzle | L7 (final) |
| `computer` | ComputerPuzzle (terminal) | L1, L4, L5 |
| `safe` | SafePuzzle | L2, L4 |
| `lever` | LeverPuzzle / ReactorLever | L1, L7 |
| `symbol` | SymbolPuzzle | L7 |
| `hacking` | HackingMinigame | L7 |
| `dual` | DualPuzzle | L7 |
| `spot_diff` | SpotDiffrent | L7 |
| `hologram` | HologramView | L7 |
| `reactor` | ReactorSecurityModal | L7 |
| `pod_control` | PodControlPuzzle | L7 |

### 5.7 HUD & navigasi dalam game

- **`HUD.tsx`** — kiri-atas: timer; tengah: tombol scene (hanya scene yang valid, `_open` disembunyikan); kanan: clue counter, hint token, tombol quit (ke menu).
- **`PauseMenu.tsx`** — Resume, Quit ke level select / menu utama, restart level.
- **`Inventory.tsx`** — item yang dibawa; hint tokens; klik item untuk pakai (mis. tape, hacking device).
- **`HintToken.tsx` / `HintSystem.tsx`** — indikator token hint + panel hint (beli dengan token, isi ulang dari server).

### 5.8 Menang / Kalah / Endings

- **`WinScreen.tsx`** — bintang (1–3) dari sisa waktu vs `starThresholds`, list achievement baru yang terbuka, tombol replay / level select / menu.
- **`LoseScreen.tsx`** — retry / level select / menu.
- **`AchievementPopup.tsx`** — toast kecil saat unlock achievement.
- **`AchievementScreen.tsx`** — galeri achievement: semua punya tiap level (filter dropdown per level), status locked/unlocked, golden.
- **`TreasureScreen.tsx`** — galeri treasure yang ditemukan; zoom gambar.

---

## 6. Data layer

### 6.1 Sumber data runtime

| Level | Mode | Asal data |
|---|---|---|
| `level_1`–`level_5` | **API** (`USE_LOCAL_LEVELS` tidak termasuk) | `GET /api/levels/{key}` → `fetchLevel()` → mapping → store `levels[]` |
| `level_6` | **API** (sejak perbaikan terbaru) | sama, tapi fallback juga ke `data/level6.ts` |
| `level_7` | **LOCAL** | `data/level7.ts` (fallback final), override API untuk achievements/treasures/introDialog/sceneDialogs |

Data murni lokal (tidak pernah dari API):
- **`data/levels.ts`** — LEVEL_1..LEVEL_5 (dipakai sebagai fallback kalau fetch gagal)
- **`data/level6.ts`**, **`data/level7.ts`** — level 6 & 7 penuh (dialog, puzzles, achievements, treasures, sceneTransitionPoints, exitDoorPoints, sceneHints, comicPages, sceneComics)
- **Prolog comic & dialog** semua level — `App.tsx` membaca dari `LEVELS` (lokal), bukan dari API

### 6.2 Mapping API → Level (`gameStore.startLevel`)

```
fetchLevel(key)
  → scenes[]      : { id: scene_key, label, backgroundImage: resolveAssetPath(), hotspots[] }
  → hotspots[]    : { id: hotspot_key, x, y, width, height, cursor, image, zIndex, action, visible }
  → puzzles[]     : { id: puzzle_key, type, answer, maxDigits, patternSize, clueIds }
  → hints[]       : string[] (hanya .text)
  → introDialog[] : DialogLine[] (type === 'intro') via mapDialogLine()
  → sceneDialogs  : Record<string, DialogLine[]> (levels.scene_dialogs) via mapSceneDialogs()
  → achievements  : Achievement[] via mapAchievement()
  → treasures     : Treasure[] via mapTreasure()
```

**`resolveAssetPath()`** (`lib/assetPath.ts`) — path absolut (`/avatars/x.png`) tetap apa adanya; path relatif (`achievements/x.png`) → `/storage/achievements/x.png`.

**`mapDialogLine()`** (`lib/apiMap.ts`) — `avatar/avatarLeft/avatarRight` di-resolve; `avatarLeftStyle/avatarRightStyle` dikonversi ke angka (`bottom/left/right/height/top/width`); `side` default `left`; `isSystem` boolean.

### 6.3 Fallback

Kalau API tidak bisa diakses (server mati / error):
- `startLevel` **fall back** ke `FALLBACK_LEVELS` (lokal `data/levels.ts`) — game tetap bisa dimainkan.
- `loadLevels` (index) — kalau kosong/error, `store.levels` kosong → beberapa layar menampilkan level lokal saja (achievements screen fallback ke `HARDCODED_LEVELS`).

### 6.4 Achievements time-based

`achievements` dengan `type='time'` & ada `is_golden` → dicek di `completeLevel()`:
- `timeLeft >= starThresholds[0]` → ★★★
- `timeLeft >= starThresholds[1]` → ★★
- selesai → ★; jika masih `isGolden` dan selesai cepat → versi golden diunlock.

Achievements `type='treasure'` → dicek di `collectTreasure()` — saat semua treasure level itu terkumpul.

---

## 7. Realtime client — Echo, multiplayer, voice chat, chat

### 7.1 `echo.ts` — singleton Echo

```ts
export const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST ?? 'localhost',
  wsPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
  wssPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
  forceTLS: VITE_REVERB_SCHEME === 'https',
  enabledTransports: ['ws', 'wss'],
  disableStats: true,
});
```

`window.Pusher = Pusher` — Echo butuh Pusher global. Koneksi dipantau (`state_change`, `error`) untuk debug.

### 7.2 `lib/multiplayer.ts` — pemilik tunggal channel

Kenapa modul, bukan hook? `useLobby` pernah dipanggil 4× (App, GameScene, Level7scene, Inventory) → setiap instance membuat state machine sendiri & subscribe channel yang sama → event bisa dikirim bolak-balik / tidak sampai ke peer. Solusi:

- Satu module-level `channel` + `subscribedCode` (hanya satu channel aktif).
- `echo.channel('lobby.{code}').listen('.game.state.updated', …)`
- `emit()` — buang event dengan `revision` lebih kecil dari yang sudah diterima (mencegah echo menimpa state lebih baru) → panggil `applySharedGameState` → notify semua listener.
- `publishIfNewer()` — dipakai saat polling ambil revisi yang belum pernah diterima.

API publik: `subscribe(code)`, `unsubscribe()`, `isSubscribed()`, `onStateEvent(fn)`, `publishState()`, `fetchLobby()`, `syncAction()`, `fetchHintConfig()`, dll. (h lihat file untuk daftar lengkap).

### 7.3 `useLobby` — transisi waiting → playing

- Poll `GET /api/lobby/{code}` setiap **3 detik** sebagai fallback (kalau WebSocket putus, game tetap sinkron — lambat tapi jalan).
- Deteksi transisi `waiting → playing`: saat host mulai, semua member otomatis masuk `startLevel(level_7)` (via `useGameStore`).
- Deteksi keluar pemain saat `playing`: pemain lain mendapat notifikasi, lobby dianggap disband → kembali ke menu.

### 7.4 `useVoiceChat` — voice chat PeerJS

1. `navigator.mediaDevices.getUserMedia({ audio: true })` — minta izin mic.
2. Stream mic **di-mute dulu** (`track.enabled = false`).
3. Buat `AudioContext` + `AnalyserNode` (`fftSize=256`) — untuk deteksi "sedang bicara" (rata-rata amplitudo > 10).
4. Buat `Peer` dengan id `{lobbyCode}-{username}` (di-sanitize) + konfigurasi STUN Google.
5. Kirim sinyal `ready` ke lobby via `POST /lobby/{code}/signal`.
6. Pemain lain yang mendengar `.webrtc.signal{ type: 'ready' }` → `peer.call(peerId, stream)` — panggil peer yang baru siap.
7. `call.on('stream')` → diputar di `<audio>` sementara.
8. `toggleMute` → toggle `track.enabled`. `stopVoice` → destroy peer + hentikan analyser + hapus audio elements.

### 7.5 `useChat` — chat teks

- `echo.channel('lobby.{code}').listen('.chat.message.sent', …)` — terima pesan dari pemain lain di lobby.
- Kirim via `POST /api/lobby/{code}/chat` (server broadcast balik ke channel).

### 7.6 `useHotspotAction`

Dispatch aksi hotspot — salah satu switch terbesar di codebase:

| action.type | Efek |
|---|---|
| `give_item` / `give_item_and_dialog` | tambah item ke inventory + opsional trigger dialog |
| `open_puzzle` | set `activePuzzleId` → buka PuzzleModal |
| `open_note` | set `noteModal` → NoteZoom |
| `open_zoom` | set `zoomModal` → ZoomModal / ZoomableNote |
| `collect_treasure` | panggil API `reportTreasureFound` + update store |
| `message` | tampilkan notifikasi |
| `go_to_scene` | pindah scene |
| `enter_subview` | masuk sub-view (L7) |
| `give_item_and_dialog` | item + dialog overlay |
| `open_hacking_minigame`, `open_tape_reader`, `open_pod_control`, `open_power/cooling/reactor`, `open_desktop_and_dialog`, `open_zoom_and_dialog` | Level 7 specific |

Untuk item Level 7 (`char1/2/3Inventory`) — action memilih inventory karakter aktif.

---

## 8. Hooks — daftar & fungsi

| Hook | File | Fungsi |
|---|---|---|
| `useapi` | `hooks/useapi.ts` | Fetch ke Laravel API (levels, auth, progress, achievements, treasures, lobby, hint-config); `setUnauthorizedHandler` → logout paksa 401 |
| `useTimer` | `hooks/useTimer.ts` | Timer mundur (`timeElapsed++` tiap 1s); pause/resume via store |
| `useMusic` | `hooks/useMusic.ts` | `playMusic(src)`, `pauseMusic()`, `resumeMusic()` — satu `<audio>` global loop |
| `useSFX` | `hooks/useSFX.ts` | `playClick/playSuccess/playError/playHint/playNotes/playNewGame/playWin/playLose` — cache Audio elements |
| `useHintRefill` | `hooks/useHintRefill.ts` | Refill hint token tiap N detik (dari server config) |
| `useHotspotAction` | `hooks/useHotspotAction.ts` | Dispatch aksi hotspot (lihat §7.6) |
| `Usepuzzlesync` | `hooks/Usepuzzlesync.ts` | Sync input puzzle ke lobby (terhubung channel Reverb) |
| `useLobby` | `hooks/useLobby.ts` | Polling lobby 3s + transisi waiting→playing (`startLevel`) + disconnect handling |
| `useVoiceChat` | `hooks/useVoiceChat.ts` | Voice chat PeerJS (lihat §7.4) |
| `useChat` | `hooks/useChat.ts` | Chat teks Reverb (lihat §7.5) |
| `useLevel` | `hooks/useLevel.ts` | (legacy) fetch levels sederhana — dipakai sebagian kecil |
| `useSFX` | (filename case-sensitive, beda dari `Usepuzzlesync`) | … |

---

## 9. Types — kontrak data (`types/game.types.ts`)

Inti struktur (nama — makna):

- **`Level`** — `id`, `title`, `description`, `timeLimit`, `scenes[]`, `puzzles[]`, `hints[]`, `introDialog[]`, `exitPuzzleId`, `sceneDialogs?`, `sceneComics?`, `comicPages?`, `sceneTransitionPoints?`, `exitDoorPoints?`, `comicSrc?`, `isLocked?`, `sceneHints?`
- **`Scene`** — `id`, `label`, `backgroundImage`, `hotspots[]`, `hidden?`, `sceneComic?`, `comicPages?`, `introDialog?`
- **`Hotspot`** — `id`, `x`,`y`,`width`,`height` (persen), `cursor`, `image?`, `zIndex?`, `action: HotspotAction`, `visible?`
- **`HotspotAction`** — diskriminated union: `open_note | open_zoom | open_puzzle | message | give_item | give_item_and_dialog | collect_treasure | go_to_scene | enter_subview | open_hacking_minigame | open_tape_reader | open_desktop_and_dialog | open_zoom_and_dialog | open_pod_control | open_power | open_cooling | open_reactor`
- **`Puzzle`** — `id`, `type`, `title`, `answer`, `maxDigits?`, `patternSize?`, `clueIds?`
- **`PuzzleType`** — `keypad | pattern | combination | sequence | safe | computer | lever | maze | brain_maze | symbol | hacking | dual | spot_diff | hologram | reactor | pod_control …`
- **`Item`** — `id`, `name`, `description`, `icon`, `type?`
- **`DialogLine`** — `character`, `text`, `avatar?`, `avatarLeft?`, `avatarRight?`, `avatarLeftStyle?`, `avatarRightStyle?`, `side?`, `isSystem?`
- **`Achievement`** — `id` (`achievement_key`), `title`, `description`, `icon`, `type: 'time' | 'treasure'`, `isGolden?`
- **`Treasure`** — `id`, `x`,`y`,`width`,`height`, `image?`, `achievementId`, `sceneId?`, `name?`, `description?`
- **`ComicPage` / `SceneComic`** — `{ src, panels[] }`, panel: `{ x,y,width,height, enterFrom?, effect?, duration?, sfx? }`
- **`GameState`** (di store) — seluruh shape state Zustand.
- **`GameScreen`** — union screen string.

---

## 10. Styling — CSS Modules & tema

- **Tanpa framework** — murni CSS Modules (`*.module.css`) + sedikit CSS global (`index.css`).
- **Tema gelap** — background `#0d0015`, accent magenta/ungu/gold; font: serif Georgia untuk prolog/menu, sans-serif default UI; HUD pakai panel semi-transparan `rgba(10,8,20,0.9x)` + border emas/metalik.
- **Animations global** di `index.css`: `fadeIn`, `bounce`, `spin`, dll. — dipakai banyak komponen tanpa perlu di-define ulang.
- **Z-index layering** — GameScene (hotspots) < HUD < PauseMenu < DialogOverlay < LoadingScreen < Comic — supaya klik always land on the right layer.
- **Responsive** — sebagian besar layout pakai `vw/vh` + `clamp()`; tidak ada breakpoint mobile khusus (game dirancang untuk desktop).

---

## 11. Assets di `public/`

```
public/
├─ achievements/   # icon achievements (lab.png, goldenmarket.png, …)
├─ audio/          # music (menu, lv6_music, lv7music, …) + sfx/ (click, correct, wrong, win, …)
├─ avatars/        # avatar karakter (lab*, school*, perpus*, market*, anak*, kayshi*, dll.)
├─ backgrounds/    # background ruangan tiap level (minimarket.png, garden.png, alien.png, …)
├─ comic/          # panel komik (lv6.png, comic1/2.png, …)
├─ notes/          # gambar catatan (digit*.png, clue*.png, …)
├─ objects/        # gambar objek/interaktif (lever.png, bottle.png, mechanism, …)
├─ treasures/      # gambar treasure (atom.png, spiderman.png, meteor.png, …)
├─ treasures/…     # (beberapa sub-folder vary per level)
└─ ui/             # asset UI (button, frame)
```

Aturan: path absolut dari root (`/avatars/lab2.png`) = file di `public/avatars/lab2.png`. Path relatif hasil upload admin → `/storage/{path}` → dilayani Laravel dari `storage/app/public/{path}`.

---

## 12. Gotcha & catatan penting

1. **Level 6 & 7 baca dari data lokal** — `USE_LOCAL_LEVELS` di `gameStore.startLevel`. Admin edit L6/L7 (kecuali achievements/treasures/sceneDialogs/introDialog) tidak berlaku di game.
2. **App.tsx prolog baca dari `LEVELS` lokal** — comic/dialog awal semua level dari file lokal, bukan dari API/DB.
3. **HUD & `sceneTransitionPoints`/`exitDoorPoints`** — baca dari `data/levels.ts`, bukan DB.
4. **Fallback total** — kalau API down, game tetap bisa dimainkan dari data lokal (level 1–5) asalkan folder `public/` lengkap.
5. **Exit puzzle kosong di DB?** — untuk Level 6, `scene_garden_3.exit_puzzle_id` harus `puzzle_chemical_bottles` (sudah diisi di DB produksi).
6. **Icon achievement DB harus cocok nama file** — `public/achievements/` case-sensitive di sebagian OS produksi; selalu cocokkan persis dengan nama file yang di-seed.
7. **`/storage/...`** — harus bisa diakses dari origin game yang sama (lihat dokumentasi TECH_STACK.md), kalau tidak, gambar upload admin 404 (asset statis lokal aman).
8. **`Usepuzzlesync.ts`** — nama file pakai kapital U (bukan standar), jangan di-rename sembarangan tanpa update import.
9. **Chunk > 500 kB** — `vite build` memperingatkan bundle besar; belum di-code-split.
10. **Dialog avatar style** — angka di JSON (`bottom/left/right/height`); kalau dari admin sebagai string, konversi via `mapStyle()` di `apiMap.ts`.
11. **Sub-folder assets case-sensitive** di server produksi Linux — konsisten lowercase.

---

## 13. Build & performa

- **Dev**: `npm run dev` → Vite HMR, port 5173.
- **Build**: `npm run build` → output `dist/` (hash file, lazy-loaded images tidak di-pre-bundle; semua assets dari `public/` di-copy apa adanya).
- **Bundle size**: ~877 kB JS (gzip ~232 kB), ~70 kB CSS — perlu perbaikan (manualChunks / lazy-load Level 7 deps) bila performa jadi masalah.
- **Preloading**: `LoadingScreen` mem-preload semua gambar+audio level sebelum prolog — mencegah pop-in saat scene pertama muncul.
- **Decoding**: `img.decode()` dipanggil di preloader untuk mengurangi jank di mobile.

---

## Ringkas alur

```
Open game
  └─ Auth (atau lanjut sebagai guest)
       └─ Splash (menu)
            ├─ Level Select → Loading → (Comic) → (Dialog) → Gameplay → Win/Lose → Level Select
            ├─ Achievements
            ├─ Treasures
            ├─ Settings
            └─ Multiplayer → Lobby → Level 7
```
