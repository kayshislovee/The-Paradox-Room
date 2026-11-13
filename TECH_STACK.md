# Teknologi yang dipakai — The Paradox Room (Escape Room)

- **Frontend detail** → lihat [`FRONTEND_STACK.md`](./FRONTEND_STACK.md) (React, Zustand, struktur, hook, data layer, realtime client).
- **Game flow** → lihat [`GAME_FLOW.md`](./GAME_FLOW.md).

Dokumen lengkap arsitektur, teknologi, dan alur data project ini.

Dua repo yang bekerja sama:

- **`escape-room`** — frontend / game (React + Vite), dev di `http://localhost:5173`
- **`escape-room-api`** — backend + admin panel (Laravel + Filament), API di `http://localhost:8000`, WebSocket Reverb di `:8080`

---

## Daftar isi
1. Gambaran besar arsitektur
2. Frontend — React (folder, state, komponen)
3. Backend — Laravel (API, auth, admin panel)
4. Database — tabel & hubungan
5. Realtime — Reverb vs PeerJS/WebRTC (voice chat)
6. Keamanan
7. Build, deploy, dan testing
8. Glosarium singkat
9. TODO / catatan sisa

---

## 1. Gambaran besar

```mermaid
flowchart LR
    subgraph FE[escape-room — Frontend]
        R[React 18 + TypeScript<br/>Vite dev :5173]
        Z[Zustand store]
        Echo[laravel-echo + pusher-js]
        Peer[PeerJS]
    end

    subgraph BE[escape-room-api — Backend]
        API[Laravel REST API :8000]
        Fil[Filament Admin /admin]
        RV[Laravel Reverb WS :8080]
    end

    DB[(MySQL escape_room\nlocalhost:3306)]

    FE -->|fetch REST| API
    FE -->|WebSocket| RV
    FE <-->|WebRTC P2P\n(audio suara)| Peer
    API --> DB
    Fil --> DB
```

Aliran request paling umum: aplikasi dibuka → halaman game men-fetch `/api/levels` → level di-render (scene, hotspot, puzzle) → pemain main → progress/achievement disimpan ke API → dipantulkan balik ke UI.

---

## 2. Frontend (React + Vite)

### 2.1 Teknologi inti

| Teknologi | Versi | Dipakai untuk | Kode utama |
|---|---|---|---|
| React | 18.3 | Semua UI game | `src/components/*` |
| TypeScript | 5.5 | Tipe seluruh kode | `tsconfig.json`, `*.d.ts` |
| Vite | 5.4 | Dev server (`npm run dev`) + build (`npm run build` → `dist/`) | `vite.config.ts` |
| Zustand | 4.5 | State store tunggal game | `src/store/gameStore.ts` |
| laravel-echo | 2.x | Klien WebSocket Reverb | `src/echo.ts` |
| pusher-js | 8.6 | Driver protokol Pusher (dipakai Reverb) | `src/echo.ts` |
| PeerJS | 1.5 | Voice chat P2P (WebRTC) | `src/hooks/useVoiceChat.ts` |

### 2.2 Struktur folder

```
src/
├─ components/          # Komponen UI (Layar per game screen)
│  ├─ Splash/           # Main menu ("START", "MULTIPLAYER", "ACHIEVEMENTS", …)
│  ├─ Auth/             # Login / register / guest
│  ├─ LevelSelect/      # Pilih level (level grid + tooltip bintang)
│  ├─ LoadingScreen/    # Preloader aset (gambar + audio)
│  ├─ Dialog/           # DialogScreen (prolog) & SceneDialogOverlay (dalam game)
│  ├─ Comic/            # ComicScene (komik cutscene)
│  ├─ GameScene/        # Layar gameplay (scene + hotspot + tombol puzzle)
│  ├─ Level7/           # Khusus level 7 (CharacterSelect, Monitor, Desktop OS, dll.)
│  ├─ PuzzleModal/      # Semua jenis puzzle (keypad, pattern, safe, computer, …)
│  ├─ Achievement/      # AchievementScreen + AchievementPopup
│  ├─ Treasure/         # TreasureScreen (galeri treasure)
│  ├─ HUD/              # Timer, scene navigator, hint token, clue counter
│  ├─ Lobby/            # Multiplayer lobby (create/join/start/room)
│  ├─ Settings/         # Opsi game
│  └─ WinScreen/        # Win & Lose screen
├─ store/gameStore.ts   # Zustand — state tunggal game
├─ hooks/               # useapi (fetch), useLobby, useVoiceChat, useChat, useTimer, …
├─ lib/                 # assetPath, apiMap, multiplayer, treasureImage, characterFlow
├─ data/                # Level 1–7 hardcoded (fallback + L6/L7 dinamis)
└─ types/game.types.ts  # Kontrak tipe data game
```

### 2.3 State management — Zustand

Kenapa Zustand? Tidak perlu Provider boilerplate; satu store bisa diakses dari mana pun (komponen, util di luar React, bahkan `multiplayer.ts`).

Isi store (`useGameStore`):

- **`screen`** — alur layar game: `splash` → `level_select` → `gameplay` → `win` / `lose`, plus `settings`, `achievements`, `treasures`, `lobby`
- **Level runtime** — `levels[]`, `currentLevelId`, `currentSceneId`, `timeElapsed`, `solvedPuzzles`, `inventory`, `discoveredClues`, `usedHotspots`, `foundTreasures`, `newAchievement`
- **UI overlays** — `zoomModal`, `noteModal`, `activePuzzleId`, `sceneComic`, `sceneDialogOverlay`, `notification`, `isLoadingLevels`
- **Akun pemain** — `player`, `token`, `isGuest`
- **Lobby** — `lobbyCode`, `playerCharacter`, `releasedCharacter`, `scene5Character`
- **Progres** — `levelProgress` (completed, best time, bintang, per level), `unlockedAchievements`

Store juga **persist** sebagian state (mis. `foundTreasures`, `levelProgress` gamest) ke `localStorage` lewat middleware `persist`.

Pola umum: komponen panggil `useGameStore((s) => s.aksi)`; util non-React pakai `useGameStore.getState()`.

### 2.4 Alur prolog level (App.tsx)

`showLoading → (comicSrc? → ComicScene) → introDialog? → DialogScreen → startLevel(levelId) → GameScene`

`pendingLevelId` menentukan level mana yang sedang dibuka; setelah prolog selesai, `startLevel()` di store dijalankan dan berpindah ke layar `gameplay`.

### 2.5 Asset resolving (upload dari admin)

- `src/lib/assetPath.ts` — mengubah path relatif dari API (`achievements/x.png`) menjadi `/storage/achievements/x.png` supaya browser bisa memuatnya; path absolut tetap apa adanya.
- `src/lib/apiMap.ts` — mapping respons API → tipe game (dialog, scene dialogs, achievement, treasure), termasuk konversi style avatar ke angka.
- `src/lib/multiplayer.ts` — pemilik tunggal channel Reverb (semua modul lain hanya subscribe).

---

## 3. Backend — Laravel (API + Admin Panel)

### 3.1 Teknologi inti

| Teknologi | Kegunaan | File |
|---|---|---|
| PHP 8 + **Laravel 13** | Framework web (routing, Eloquent ORM, middleware, exception) | `app/`, `routes/`, `config/` |
| **Laravel Sanctum** | Auth API pakai Bearer token (personal access tokens) | `app/Http/Controllers/Api/AuthController.php`, `personal_access_tokens` table |
| **Filament 3.3** | Admin panel CRUD konten game | `app/Filament/Admin/*` |
| **Laravel Reverb** | Server WebSocket (naik ke port 8080) | `config/broadcasting.php`, `app/Events/*`, `config/reverb.php` |
| **MySQL** | Database utama production | `escape_room` di `127.0.0.1:3306` |
| **SQLite `:memory:`** | Database untuk test phpunit | `phpunit.xml` |
| PHP Unit | Test admin (smoke test) | `tests/Feature/AdminSmokeTest.php` |
| Tinker | REPL debugging | `php artisan tinker` |
| Pint | Auto-formatting PHP | `vendor/bin/pint` |

### 3.2 Struktur backend

```
escape-room-api/
├─ app/
│  ├─ Filament/Admin/Resources/      # CRUD admin (index/create/edit tiap resource)
│  ├─ Filament/Admin/Pages/          # SceneDialogs (editor dialog per-scene)
│  ├─ Filament/Forms/Components/     # ImagePathUpload (field kustom: path + upload + preview)
│  ├─ Http/Controllers/Api/          # REST API (LevelController, AuthController, LobbyController…)
│  ├─ Http/Controllers/Admin/        # UploadController (upload gambar dari admin)
│  ├─ Models/                        # Eloquent models
│  ├─ Events/                        # GameStateUpdated, ChatMessageSent, WebRTCSignal
│  └─ Providers/Filament/            # Panel admin (path /admin, guard web)
├─ routes/api.php                    # Semua route /api/*
├─ routes/web.php                    # Route web (admin uploads)
├─ database/migrations/              # Skema DB
├─ database/seeders/                 # Seed level 1–7
└─ tests/Feature/AdminSmokeTest.php  # 4 test (render semua halaman admin, upload, scene dialogs)
```

### 3.3 REST API — ringkasan endpoint

Public (tanpa login):

| Method & path | Kegunaan |
|---|---|
| `GET /api/levels` | Daftar semua level + achievements & treasures (halaman level select) |
| `GET /api/levels/{key}` | Detail penuh satu level (scenes, hotspots, puzzles, hints, dialog, achievements, treasures) |
| `GET /api/hint-config` | Konfigurasi hint token (max token & refill interval) |
| `GET /api/achievements` | Daftar semua achievements |
| `GET /api/leaderboard` | Top skor per level |
| `POST /api/register`, `POST /api/login`, `POST /api/logout` | Auth pemain |

Butuh login (`auth:sanctum`):

| Method & path | Kegunaan |
|---|---|
| `GET/POST /api/progress`, `DELETE /api/progress` | Simpan/ambil best time & bintang |
| `GET/PUT /api/profile`, `POST /api/profile/avatar` | Profil pemain + avatar |
| `POST /api/achievements/unlock`, `GET /api/achievements/my` | Unlock & ambil achievement |
| `POST /api/treasures/found`, `GET /api/treasures/my` | Treasure ditemukan / daftar milik |
| `POST /api/lobby`, `POST /api/lobby/join`, `GET /api/lobby/my`, `GET /api/lobby/{code}`, `POST /api/lobby/{code}/start`, `POST /api/lobby/{code}/leave`, `POST /api/lobby/{code}/sync`, `POST /api/lobby/{code}/reset`, `POST /api/lobby/{code}/force-end`, `POST /api/lobby/{code}/complete`, `POST /api/lobby/{code}/lose`, `POST /api/lobby/{code}/exit`, `POST /api/lobby/{code}/chat`, `POST /api/lobby/{code}/input`, `POST /api/lobby/{code}/signal`, `POST /api/lobby/{code}/hint`, `POST /api/lobby/{code}/character`, `POST /api/lobby/{code}/release`, `POST /api/lobby/{code}/select-scene5-char` | Multiplayer level 7 |

### 3.4 Admin panel (Filament)

`http://localhost:8000/admin/login` — session-based, terpisah dari pemain.

Grup navigasi **Konten Game**:

| Resource | Fungsi |
|---|---|
| **Levels** | Level dasar: title, deskripsi, thumbnail, time limit, star thresholds, musik |
| **Scenes** | Scene per level: label, background image (upload/path), exit puzzle |
| **Hotspots / Objects** | Hotspot klik: posisi, kursor, gambar, aksi saat diklik (puzzle/catatan/message/…), syarat tampil |
| **Puzzles** | Kode puzzle: tipe, jawaban, pola, clue |
| **Level Hints** | Hint teks per level + urutan |
| **Dialog Lines** | Dialog prolog/win/lose: teks, karakter, avatar (upload), style avatar |
| **Scene Dialogs** | **Editor dialog dinamis per-scene** (mis. `scene7_1_item`) — khusus Level 6/7 |
| **Achievements** | Achievement: judul, deskripsi, icon (upload), tipe (time/treasure), golden, batas waktu |
| **Treasures / Objects** | Treasure: posisi, gambar, level, achievement terkait |

Grup **Pemain & Progress**: **Players** — kelola akun pemain (progress & achievements relation manager).

Halaman khusus: **Dashboard** (Filament bawaan), **Scene Dialogs** (custom page tanpa tabel — select level → grup dialog → repeater baris dialog).

Fitur upload aset: tombol Upload di samping input path — file disimpan ke `storage/app/public/{direktori}/`, path otomatis terisi. URL game mengakses via `/storage/...` (di-symlink ke `public/storage`).

---

## 4. Database (MySQL `escape_room`)

Tabel utama dan fungsinya:

| Tabel | Fungsi |
|---|---|
| `levels` | Level game (level_key, title, time_limit, star_thresholds, music, dialog_music, is_locked, order, + JSON scene_hints/comics/dialogs) |
| `scenes` | Scene per level (scene_key, background_image, char1/2/3_layer JSON, comic_pages JSON, intro_dialog JSON, exit_puzzle_id, highlight_hotspots) |
| `hotspots` | Hotspot klik (x/y/width/height, cursor, image, action_type, action_data JSON, visible_data JSON) |
| `puzzles` | Definisi puzzle (puzzle_key, type, answer, pattern_size, symbol_answer JSON, extra_data JSON) |
| `level_hints` | Daftar hint per level (text, order) |
| `dialog_lines` | Baris dialog intro/win/lose (character, avatar, avatar_left/right + style JSON, side, is_system, order) |
| `achievements` | Achievement (achievement_key, title, icon, type enum(time,treasure), is_golden, time_threshold, order) |
| `treasures` | Treasure tersembunyi (treasure_key, x/y/width/height, image, achievement_id FK) |
| `leaderboard` | Skor (level_id FK, player_name, time_elapsed, stars) |
| `players` | Akun pemain (username, email, password hash, avatar, bio) |
| `player_progress` | Progress per level per pemain (best_time, stars, completed) |
| `player_achievements` | Achievement yang sudah dibuka oleh pemain |
| `player_treasures` | Treasure yang sudah ditemukan pemain |
| `lobbies` | Lobby multiplayer (kode 6–8 karakter, host_id, level_key, status, max_players) |
| `lobby_players` | Pemain dalam lobby (role host/member, is_ready, character) |
| `lobby_game_states` | State shared game (solved_puzzles, inventory, scene, timer, revision, released_character, …) |
| `sessions`, `cache`, `jobs`, `personal_access_tokens` | Infrastruktur Laravel |

Relasi ringkas: `levels` 1—N `scenes`, `levels` 1—N `hotspots`(lewat scene), `levels` 1—N `puzzles`, `achievements` 1—N `treasures`, `players` 1—N `player_progress`, `players` 1—N `player_achievements`, `lobbies` 1—N `lobby_players`.

---

## 5. Realtime (WebSocket) — dua teknologi, dua tugas

Permainan multiplayer Level 7 ini butuh dua jenis "komunikasi jarak jauh", dan keduanya sengaja dipisah:

### 5.1 Laravel Reverb — "radio pengumuman" untuk data game

- **Server**: Reverb port `:8080` (dev). Broadcast driver default = `reverb` (`BROADCAST_CONNECTION`).
- **Sisi server** — 3 event (`ShouldBroadcastNow` = broadcast langsung, tanpa queue):

| Event | Channel | Dikirim saat | Payload |
|---|---|---|---|
| `GameStateUpdated` (`.game.state.updated`) | `lobby.{kode}` | Ada perubahan state game (puzzle terpecahkan, item/treasure terambil, scene berpindah, timer pause/jalan, dll.) | `{ state, action, triggeredBy, revision }` |
| `ChatMessageSent` (`.chat.message.sent`) | `lobby.{kode}` | Pemain kirim chat | `{ username, message, sentAt }` |
| `WebRTCSignal` (`.webrtc.signal`) | `lobby.{kode}` | Sinyal WebRTC untuk voice chat | `{ from, to, signal }` |

- **Sisi klien** — `laravel-echo` + `pusher-js` (`src/echo.ts`); driver `reverb` dikonfigurasi via env `VITE_REVERB_*`.
- **Modul tunggal** `src/lib/multiplayer.ts` — satu-satunya yang subscribe/unsubscribe channel. Semua modul lain (`useLobby`, `useChat`, `store`) hanya memanggil API modul ini. Ini penting: sebelumnya `useLobby` pernah diinstansiasi 4 kali dan tiap instance punya state machine sendiri → sinkronisasi gagal.
- **`revision`** — setiap update state membawa nomor revisi yang naik; klien membuang event dengan revisi lebih kecil dari yang sudah diterapkan (mencegah "echo" menimpa state lebih baru).
- **Polling fallback** — `useLobby` melakukan polling `GET /lobby/{code}` tiap 3 detik; bila koneksi WebSocket putus, game tetap sinkron (lambat, tapi tidak macet).
- **Checkpointing penting**: transisi `waiting → playing` memicu `startLevel()` bagi semua anggota lobby (host dan member).

### 5.2 PeerJS (WebRTC) — "telepon langsung" untuk suara

- **Library**: PeerJS 1.5 (wrapper WebRTC sederhana).
- **Tujuan**: voice chat antar pemain tanpa melewati server.
- **Alur**:
  1. Pemain membuka voice → `navigator.mediaDevices.getUserMedia({ audio: true })` (speaker mute dulu, tracking bicara via `AudioContext` + `AnalyserNode`).
  2. Buat PeerJS peer dengan id `{lobbyCode}-{username}`.
  3. Kirim sinyal `ready` ke lobby (lewat Reverb event `.webrtc.signal` atau `POST /lobby/{code}/signal`).
  4. Pemain lain yang mendengar `.webrtc.signal` dari peer yang ready → langsung `peer.call(peerId, stream)` (memanggil peer yang baru siap).
  5. `call.on('stream')` → diputar di `<audio>` tersembunyi.
  6. STUN server Google (`stun.l.google.com:19302`) untuk menembus NAT.
- **Mute/unmute** — toggle `track.enabled`; indikator "sedang bicara" dari analyser level > threshold.

Jadi analoginya: **Reverb = pengeras suara balai lobby** (semua orang dengar pengumuman), **PeerJS = telepon dua arah langsung** (suara ngumpul hanya di antara yang ikut ngomong).

---

## 6. Alur data end-to-end (contoh konkret)

**Contoh: admin mengedit ikon achievement "Golden Brain (Market)"**

1. Admin buka `http://localhost:8000/admin/achievements`, ganti icon → file baru terunggah ke `storage/app/public/achievements/xxx.png`, kolom `achievements.icon` di-update.
2. Pemain buka layar Achievements → fetch `/api/achievements` + `/api/levels` → daftar achievement dengan icon `achievements/xxx.png`.
3. `resolveAssetPath` di frontend → `/storage/achievements/xxx.png`.
4. Browser meminta `http://localhost:8000/storage/achievements/xxx.png` → diserve oleh Laravel dari `storage/app/public/...` ✓.

**Contoh: pemain host menyelesaikan puzzle di Level 7**

1. Pemain klik hotspot → `solvePuzzle('puzzle_scene2')` di store.
2. Store kirim `POST /lobby/{code}/sync { action: 'puzzle_solved', ... }`.
3. Server `LobbyController@sync` update `lobby_game_states.revision++`, lalu `GameStateUpdated` di-broadcast.
4. Semua pemain (termasuk host sendiri) menerima `.game.state.updated` via Reverb → `multiplayer.ts` (`emit`) → `applySharedGameState` di store → UI semua pemain update.
5. Jika ada player yang disconnect, `useLobby` polling (3 detik) mendeteksi & menampilkan notifikasi; bila anggota keluar saat game berjalan, lainnya dikembalikan ke menu.

**Contoh: dialog intro level 1 dimainkan**

1. Pemain pilih Level 1 → `Setting pendingLevelId` → `LoadingScreen` → tidak ada `comicSrc` → tidak ada `introDialog` di file lokal → `startLevel('level_1')` dipanggil.
2. `startLevel` fetch `GET /api/levels/level_1` → mapping scenes/hotspots/puzzles/dialog_lines (dialog lines DB dipakai untuk overlay `SceneDialogOverlay` di dalam game).
3. Map tersimpan di `store.levels` (menggantikan data lokal untuk level ini).
4. GameScene dirender; hotspot & puzzle dari DB; achievements/treasures menimpa data lokal (API menang).

---

## 7. Build, menjalankan, dan testing

| Kebutuhan | Command | Keterangan |
|---|---|---|
| Install frontend | `npm install` | sekali |
| Run dev frontend | `npm run dev` | Vite `:5173` |
| Build production frontend | `npm run build` | output `dist/` |
| Install backend | `composer install` | sekali |
| Migrate + seed dev DB | `php artisan migrate --seed` | mengisi data level 1–7 |
| Run API | `php artisan serve` | `:8000` |
| Run Reverb | `php artisan reverb:start` | `:8080` |
| Admin panel | buka `http://localhost:8000/admin` | login `admin@admin.com` |
| Jalankan test backend | `php artisan test` atau `vendor/bin/phpunit` | 4 smoke test (butuh `App\Models\User::factory`) |

Persyaratan: **PHP 8.x**, **Composer**, **Node.js 18+**, **npm**, **MySQL** (Laragon/XAMPP cocok).
Untuk Level 7 multiplayer, Reverb wajib jalan (WS); untuk voice chat, browser butuh izin mikrofon.

---

## 8. Ringkasan kekuatan & batasan (jujur)

**Kekuatan**
- Satu sumber kebenaran untuk konten level (kecuali Level 7 & komik prolog) di database — bisa diubah lewat admin tanpa deploy ulang.
- State multiplayer satu jalur (satu modul Reverb) + fallback polling → tahan putus koneksi.
- Asset upload dari admin terintegrasi penuh (upload → storage → game resolusi otomatis).

**Batasan**
- Level 7 masih baca dari file lokal (`level7.ts`) — belum bisa diedit dari admin (kecuali achievements/treasures/dialogs/hints yang sudah ditimpa API).
- Komik prolog Level 6/7 tidak bisa diedit dari admin (tidak ada editor komik).
- `sceneTransitionPoints`, `exitDoorPoints`, `timeLimit`, HUD scene-navigator — baca dari file lokal, bukan DB.
- Reverb channel publik — bukan private channel; kode lobby bocor = bisa menonton state.

---

## 9. Glosarium

| Istilah | Arti |
|---|---|
| **Hotspot** | Area klik tak terlihat (atau dengan gambar) di scene yang memicu aksi saat diklik |
| **Puzzle** | Tantangan logika (keypad, pola, safe, komputer, botol kimia, …) |
| **Scene** | "Ruangan" dalam level; pemain berpindah antar scene |
| **Exit puzzle** | Puzzle terakhir yang membuka pintu keluar level |
| **Progres** | Best time & bintang per level yang disimpan server |
| **Revision** | Nomor urut update state lobby; mencegah event basi menimpa yang baru |
| **Seed** | Data awal yang dimasukkan ke DB saat setup (`db:seed`) |
| **Migration** | File PHP yang mendefinisikan/mengubah skema database secara terkontrol & berurutan |
| **Bearer token** | Token Sanctum yang dikirim di header `Authorization` untuk autentikasi API |
| **P2P / WebRTC** | Koneksi langsung antar browser tanpa relay server (dipakai voice chat) |
| **STUN** | Server yang membantu dua peer menemukan alamat jaringan masing-masing saat di balik NAT |
