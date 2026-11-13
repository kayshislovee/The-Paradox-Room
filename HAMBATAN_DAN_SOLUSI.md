# Hambatan & Solusi — The Paradox Room (Escape Room)

Dokumen ini berisi daftar **hambatan (obstacles)** yang muncul selama pengembangan project, **akar penyebabnya**, dan **solusi yang diterapkan**. Disusun berdasarkanmenjadipunya selama pengerjaan, bukan contoh generik, supaya bisa langsung dipakai sebagai bagian laporan proyek.

> Konteks singkat: project ini terdiri dari dua repo yang bekerja sama —
> **`escape-room`** (frontend React + Vite, `:5173`) dan **`escape-room-api`** (backend Laravel + Filament, `:8000`, WebSocket Reverb `:8080`).
> Skala saat ini: 103 file TS/TSX, 71 file PHP, 7 file test.

---

## Daftar isi

1. [Ringkasan cepat (tabel)](#1-ringkasan-cepat-tabel)
2. [Kategori A — Sinkronisasi & realtime multiplayer](#2-kategori-a--sinkronisasi--realtime-multiplayer)
3. [Kategori B — Konsistensi state & race condition](#3-kategori-b--konsistensi-state--race-condition)
4. [Kategori C — Performa & skalabilitas](#4-kategori-c--performa--skalabilitas)
5. [Kategori D — Arsitektur data & pengelolaan konten](#5-kategori-d--arsitektur-data--pengelolaan-konten)
6. [Kategori E — Kualitas, testing & developer experience](#6-kategori-e--kualitas-testing--developer-experience)
7. [Kategori F — Keamanan](#7-kategori-f--keamanan)
8. [Rekomendasi lanjutan (roadmap)](#8-rekomendasi-lanjutan-roadmap)
9. [Bukti angka untuk laporan](#9-bukti-angka-untuk-laporan)

---

## 1. Ringkasan cepat (tabel)

| # | Hambatan | Dampak yang dirasakan | Solusi yang diterapkan | Status |
|---|----------|----------------------|------------------------|--------|
| A1 | Glitch & fake info hanya disimpan di browser masing-masing pemain | Glitch muncul hanya di POV pemain yang solve reactor; pemain kedua baru melihatnya setelah solve sendiri | State gangguan dipindah ke state bersama lobby (`glitched_reactors`, `fake_reactors`) + sinkronisasi via event `reactor_state` | Selesai |
| A2 | Server hanya bisa **menambah** daftar gangguan (union monoton) | Setelah Katsuragi memperbaiki glitch, glitch **muncul lagi** di kedua karakter beberapa detik kemudian | Protokol add/clear terpisah (`glitchAdd`/`glitchClear`, `fakeAdd`/`fakeClear`) + daftar `*_cleared` di server | Selesai |
| A3 | Fake info tidak pernah disinkronkan (kolom DB belum ada) | Tiap pemain punya daftar fake info yang berbeda | Migration kolom `fake_reactors`, `fake_cleared`, `glitched_cleared` + flag fake info dihitung server | Selesai |
| A4 | Posisi karakter dikirim via HTTP tiap 66 ms (DB write + broadcast state penuh) | Gerakan antar pemain lambat & patah-patah | Dipindah ke **whisper WebSocket** pada channel privat `maze.{code}` + interpolasi berbasis waktu + backpressure | Selesai |
| A5 | Setiap perubahan kecil broadcast seluruh state lobby ke semua pemain | Bandwidth & CPU sia-sia, state mudah saling menimpa | Event `reactor_state`/`pod_login` khusus; event state penuh hanya untuk perubahan yang memang perlu | Selesai |
| B1 | Dua pemain bisa memilih karakter yang sama (lobby & scene 5) | Karakter ganda, logika pod/level rusak | Server jadi arbiter (HTTP 409), client hanya menangani UX (tombol disabled) | Selesai |
| B2 | "Pod sudah dibebaskan" ambigu (ganti karakter lobby vs pod-release) | Pod terlihat sudah bebas padahal belum | Endpoint terpisah: `/release` (pilihan lobby) vs `/pod-release` (benar-benar bebas) | Selesai |
| B3 | Pemain yang keluar dianggap menyelesaikan level (false win) | Tim mendapat bintang & layar menang | `finish_type` default `'abandon'`, detach pemain memicu status abandon | Selesai |
| B4 | Broadcast lama bisa menimpa state lokal yang lebih baru | State "mundur" saat 2 orang berbarengan | Guard `revision` monoton di `multiplayer.ts` | Selesai |
| C1 | `php artisan serve` (1 worker) + `ShouldBroadcastNow` (blocking) | ~3–5 request/detik saja, padahal game butuh 15–30 | Event posisi pindah ke WebSocket; event penuh tidak lagi per-frame | Selesai |
| C2 | `Maximum update depth exceeded` | Halaman freeze saat level dimuat | `useMemo` pada `level` + pause/resume timer yang idempoten | Selesai |
| C3 | "Rendered more hooks than during the previous render" | React error, komponen crash | `return null` dipindah setelah semua hook | Selesai |
| C4 | Admin (Filament) edit tidak berefek di frontend | Konten yang disunting admin tidak muncul di game | Prolog + level 7 sekarang digabung API \> lokal (`mergeApiIntoLevel`), field JSON yang tak bisa diedit ditambahkan ke admin | Selesai |
| D1 | Sumber data ganda: file `src/data/level7.ts` vs database | Admin panel bisa "menyimpan" tapi game tidak berubah | Data lokal jadi pelengkap, database jadi sumber utama (`mergeApiIntoLevel`); prolog/comic juga dari API | Selesai |
| D2 | Path aset rusak di production (ikon achievement, audio) | Asset 404 di game | Perbaikan data + asset resolver | Selesai |
| D3 | Tabel `players`, `player_progress`, `leaderboard` belum ada | Statistik pemain tidak bisa disimpan | Migration baru + guard `hasTable` (aman di production) | Selesai |
| D4 | Kolom JSON (characters, scene_comics, scene_hints, scene_dialogs, char*_layer, char*_sub_views, comic_pages, intro_dialog) tidak punya field admin | Isinya tidak bisa disunting sama sekali | Field JSON baru di LevelResource & SceneResource + test cakupan form admin | Selesai |
| E1 | Tidak ada automated test | Regresi bug sulit dicegah | 18 feature test (regresi) + `tsc --noEmit` + build check | Selesai |
| E2 | Perubahan server butuh restart manual, mudah lupa | Bug "tidak jalan" padahal kode sudah benar | Dokumentasi restart + test otomatis | Selesai |
| E3 | Indentasi & format file tidak konsisten | Sulit dibaca & direview | (rekomendasi) ESLint + Prettier | Belum |
| F1 | Channel lobby **publik** | State game bisa dibaca pihak lain | Channel privat `maze.{code}` + auth Sanctum; channel state masih publik | Sebagian |
| F2 | Tidak ada rate limiting per endpoint | Potensi flooding & penyalahgunaan API | (rekomendasi) throttle + validasi payload | Belum |

---

## 2. Kategori A — Sinkronisasi & realtime multiplayer

### A1. State gangguan hanya lokal di browser

**Gejala:** Satu pemain menyelesaikan reactor → efek glitch hanya muncul di layar dia. Pemain kedua baru melihat glitch setelah **dia sendiri** menyelesaikan reactor. Fake info mengalami hal yang sama.

**Akar penyebab:** `glitchedReactors`, `fakeReactors`, `fakeInfoActive` disimpan di Zustand store sebagai state lokal murni, tidak pernah dikirim ke server. Gangguan ini hanya hidup di browser pemain tersebut, sementara event broadcast yang tersedia hanya untuk `solved_puzzles`, `inventory`, `character_inventories`, dll.

**Solusi:**
- Menambah kolom di `lobby_game_states`: `glitched_reactors`, `fake_info_active`, `any_reactor_solved`, `pod_logged_in`.
- Aksi sync baru `reactor_state` (broadcast penuh state bersama).
- Client: setiap aksi add/remove otomatis menyiarkan state ke server; `applySharedGameState` menerimanya.

**Dampak:** glitch & fake info kini muncul **serempak** di semua pemain.

---

### A2. Server hanya bisa menambah, tidak bisa menghapus (penyebab utama bug "glitch muncul lagi")

**Gejala:** Katsuragi memperbaiki glitch dengan Hacking Device+ → maze solved → notifikasi "Gangguan berhasil diperbaiki", tapi **beberapa detik kemudian glitch muncul lagi** di kedua karakter.

**Akar penyebab (penting untuk laporan):** di server, daftar gangguan disimpan dengan pola union monoton:

```php
// SEBELUM (bug)
$updates['glitched_reactors'] = array_values(array_unique([
    ...$current,            // daftar lama
    ...$glitched,            // daftar baru dari client
]));
```

Karena hanya bisa menambah, permintaan "hapus reactor ini dari daftar glitch" **tidak pernah tersimpan**. Pada broadcast berikutnya (polling 3 detik atau aksi apa pun), server mengirim ulang daftar lama → glitch muncul kembali di semua pemain. Secara lebih teknis, ini adalah masalah **monotonic state design**: state yang bisa ditambah tapi tidak bisa dibatalkan.

**Solusi:** pisahkan dua operasi pada protokol dan simpan daftar "sudah diperbaiki":

| Aksi client | Efek server |
|---|---|
| `glitchAdd: ['reactor']` | union → masuk `glitched_reactors` |
| `glitchClear: ['reactor']` | difference → keluar dari `glitched_reactors`, masuk `glitched_cleared` |
| `fakeAdd` / `fakeClear` | sama untuk `fake_reactors` / `fake_cleared` |

`glitched_cleared` & `fake_cleared` berfungsi sebagai **catatan permanen**, sehingga broadcast lama tidak bisa membangkitkan kembali gangguan yang sudah diperbaiki. Di sisi client ada `pendingGlitchClears`/`pendingFakeClears` agar penghapusan langsung tampil di layar (anti-kedip) sambil menunggu konfirmasi server.

**Dampak:** hasil perbaikan Katsuragi langsung hilang di kedua pemain dan tidak pernah kembali.

---

### A3. Fake info tidak pernah masuk ke state bersama

**Gejala:**/info fake hanya muncul di layar pemain yang memicunya; kolom database untuk daftar fake reactor tidak pernah ada.

**Solusi:** migration `2026_11_11_000002_add_fake_and_cleared_state_to_lobby_game_states` menambah `fake_reactors`, `fake_cleared`, `glitched_cleared`; flag `fake_info_active` dihitung server dari daftar fake yang masih aktif (bukan flag manual), sehingga kedua pemain tidak mungkin berbeda status.

---

### A4 & C1. Gerakan antar pemain lambat dan patah-patah (multiplayer maze)

**Gejala:** karakter pemain lain bergerak "ngonten" — tertinggal beberapa detik dan meloncat-loncat.

**Akar penyebab (diukur langsung):**

```
broadcast ShouldBroadcastNow : 210–276 ms per event
API php artisan serve (1 worker): ~3–5 request/detik
game mengirim posisi          : 15–30 request/detik (2 pemain × 15 Hz)
```

Mekanismenya: `POST /lobby/{code}/input` setiap 66 ms → **transaksi DB + broadcast seluruh game state**, dan broadcast bersifat blocking (`ShouldBroadcastNow`). Karena server dev hanya punya satu worker, antrean request menumpuk tanpa batas → latensi terus bertambah → gerakan teammate tertinggal dan datang bergerombol. Di sisi penerima, posisi hanya di-lerp dengan faktor tetap (`0.35/frame`), sehingga gerak terlihat "bertingkat".

**Solusi:**
1. **Transport baru:** channel privat `maze.{code}` (WebSocket) dengan *client event / whisper* → posisi dikirim tanpa menyentuh HTTP/DB.
2. **Otorisasi channel privat** dengan token Sanctum: `POST /api/broadcasting/auth` + `routes/channels.php` (hanya anggota lobby).
3. **Interpolasi berbasis waktu** di penerima: buffer sampel posisi, render 100 ms di belakang sampel terakhir, lalu interpolasi dua sampel → mulus di 60 fps.
4. **Backpressure:** kirim hanya saat posisi berubah + heartbeat 500 ms; fallback HTTP dibatasi (2×/detik) agar server tidak pernah dibanjiri request.
5. **Jalur cadangan tetap ada:** posisi tetap ditulis ke DB 1,5 detik sekali supaya polling 3 detik masih punya data bila WebSocket putus.

#### Penjelasan versi bahasa manusia (siap dipakai di laporan)

**Masalahnya apa?** Di mini-game Brain Maze, karakter pemain kedua (yang kamu tidak kendalikan) terlihat bergerak **lambat, tertinggal, dan meloncat-lompat**, padahal pemainnya sudah mengendap dengan normal. Daftar teks di layar juga terlihat nyendat-nyendat.

**Kenapa bisa terjadi?** Carsaalnya, setiap kali karakter bergerak sedikit saja, game mengirim "posisi karakter sekarang" ke server dengan cara yang mahal: satu permintaan internet untuk tiap gerakan, dan setiap permintaan itu server harus **menulis ke database** lalu **mengirim ulang seluruh data permainan ke semua pemain**. Ibarat mengirim surat untuk setiap geseran kecil, padahal yang dibutuhkan hanya menelepon.

Tiga hal ini jadi penyebabnya:

1. **Beban server tidak seimbang.** Server yang dipakai saat pengembangan hanya bisa memproses sekitar **3-5 permintaan per detik**, sementara game mengirim **15-30 permintaan per detik**. Excess permintaan tidak hilang, tapi **berantakan** - sehingga informasi posisi yang sudah "ketinggalan zaman" tetap dikirim, dan jeda antar pemain makin lama seiring waktu (*terlalu lama*).
2. **Gerak dikirim kasar.** Layar game diperbarui 60 kali per detik, tetapi posisi baru hanya sampai 15 kali per detik, dan cara menampilkannya masih "langsung loncat ke posisi terakhir". Akibatnya gerakan terlihat seperti berkedip dan melompat, bukan mengalir (*patah-patah*).
3. **Semua pemain dapat data berlebihan.** Tiap informasi posisi kecil membuat server mengirim ulang semua data permainan ke semua orang, padahal yang dibutuhkan cuma koordinat titik.

**Bagaimana diperbaikinya?**

1. **Pakai jalur yang tepat.** Posisi karakter dikirim lewat **koneksi WebSocket yang sudah terbuka** (channel privat khusus arena), seperti menelepon - tidak perlu menulis database dan tidak perlu mengirim data lengkap. Hanya anggota room yang boleh masuk ke channel ini.
2. **Gerak dibuat mengalir, bukan melompat.** Aplikasi menyimpan beberapa posisi terakhir dan menampilkan layar **100 milidetik "di belakang" posisi terbaru**, lalu menghitung posisi di antara dua titik itu. Efeknya: karakter teammate bergerak mulus mengikuti layar 60 fps, walau informasinya hanya dikirim 15-20 kali per detik.
3. **Posisi tidak dikirim sia-sia.** Kiriman hanya terjadi kalau posisi benar-benar berubah (plus denyut jantung tiap 0,5 detik agar tetap terhubung), dan jalur cadangan ke database dibatasi maksimal 2 kali per detik supaya server tidak pernah kewalahan.
4. **Tetap aman kalau koneksi putus.** Posisi tetap disimpan ke database tiap 1,5 detik, jadi kalau WebSocket terputus, koordinat terakhir masih terbaca dari mekanisme polling yang sudah ada.

**Hasilnya:** karakter pemain lain sekarang bergerak mulus dan hampir tanpa jeda, sementara beban server turun dari 15-30 permintaan per detik menjadi sekitar 2 permintaan per detik (ditambah traffic WebSocket yang jauh lebih ringan). Pembagian peran juga menjadi lebih jelas: **WebSocket untuk pengiriman cepat**, **database untuk penyimpanan resmi**.

---

## 3. Kategori B — Konsistensi state & race condition

### B1. Dua pemain memilih karakter yang sama

**Akar penyebab:** pengecekan karakter hanya di client, sehingga dua pemain bisa lolos bersamaan.

**Solusi:** server menjadi arbiter — `assignCharacter()` dan `selectScene5Character()` mengembalikan **409 Conflict** bila karakter sudah dipakai; client menampilkan tombol disabled "SUDAH DIPILIH PEMAIN LAIN". Prinsipnya: *server menjadi arbiter deterministik, client hanya menangani tampilan*.

### B2. Ambigu "pod sudah dibebaskan"

**Akar penyebab:** satu endpoint dipakai untuk dua maksud berbeda (ganti karakter di lobby vs pembebasan karakter dari pod).

**Solusi:** pisahkan endpoint — `POST /lobby/{code}/release` (pilihan karakter di lobby, tidak menyentuh pod) dan `POST /lobby/{code}/pod-release` (benar-benar membebaskan satu karakter dari pod). `released_character` kini hanya bisa diisi lewat endpoint yang benar.

### B3. False win ketika pemain keluar

**Akar penyebab:** `finish_type` default `'win'`, sehingga pemain yang keluar dianggap menyelesaikan level.

**Solusi:** default diubah ke `'abandon'`; hanya `'win'` eksplisit yang memicu `completeLevel()`. Pemain yang keluar menerima notifikasi dan kembali ke splash **tanpa bintang**.

### B4. State lokal tertimpa broadcast lama

**Solusi:** `revision` monoton dipakai sebagai pagar di `multiplayer.ts` (`lastRevision`), event dengan revision lebih lama diabaikan.

---

## 4. Kategori C — Performa & skalabilitas

| Temuan | Nilai terukur | Catatan untuk laporan |
|---|---|---|
| Broadcast event penuh (blocking) | 210–276 ms | Bottleneck utama realtime |
| Request `POST /api/broadcasting/auth` | 276–438 ms | Dev server 1 worker |
| Kapasitas API dev | ~3–5 req/detik | Cukup untuk state, tidak cukup untuk per-frame |
| Beban posisi lama | 15–30 req/detik | Diganti WebSocket |
| Bundle build | sukses, ±5–9 s | `npm run build` |

**Hambatan umum:** arsitektur "broadcast seluruh state" mudah ditulis tetapi tidak berskala — setiap perubahan sekecil apa pun dikirim ke semua pemain. Mitigasinya: pisahkan event **state penuh** (jarang) dari event **spektrum sempit** (sering, kecil).

---

## 5. Kategori D — Arsitektur data & pengelolaan konten

### D1/D2. Sumber data ganda & aset rusak

- Level 6 dipindahkan dari data lokal ke API (`USE_LOCAL_LEVELS = ['level_7']`), sedangkan level 7 masih memakai `src/data/level7.ts`.
- Akibatnya: **admin bisa menyunting hotspot/scene/puzzle level 6 dan itu langsung berefek**, tetapi untuk level 7 penyuntingan admin belum masuk ke game (blokir: level 7 butuh karakter berlapis, X-Vision, sub-view, dan ID multiplayer).
- Aset: `resolveAssetPath` + `src/lib/apiMap.ts` supaya path dari DB bisa dipakai di frontend; 3 ikon achievement rusak di production diperbaiki datanya.

### D4. Kolom JSON tidak bisa disunting dari admin

Beberapa kolom database berisi JSON (daftar karakter, comic per scene, hint per scene, dialog per scene, char layer, sub-view, halaman comic, intro dialog). Kolom-kolom ini **tidak punya field di form admin**, sehingga isinya tidak bisa diubah sama sekali - kasus "saya edit di admin tapi tidak ada bedanya".

**Solusi:** trait `FormatsJsonFields` (textarea JSON dengan validasi `json`) ditambahkan ke `LevelResource` dan `SceneResource`, plus test `AdminFormCoverageTest` yang memastikan setiap kolom yang dipakai frontend punya field admin.

### D8. Aset game tidak muncul (monitor & lever level Lab)

**Gejala:** di level Lab Misterius (level_1), gambar monitor dan panel lever tidak muncul di scene — hotspot-nya ada, tapi gambarnya 404.

**Dua akar penyebab yang berbeda:**

1. **Typo path di database.** Gambar monitor tersimpan sebagai `/object/monitor.png` (tanpa huruf "s"), sedangkan folder aslinya `objects` → 404. Diperbaiki di database (`/objects/monitor.png`).
2. **Aset hasil upload admin tidak bisa diakses dari origin frontend.** `resolveAssetPath()` mengembalikan `/storage/...` (root-relative), sehingga browser meminta ke origin frontend (Vite :5173), bukan ke API (:8000) → 404. Signature gambar hasil upload tetap 200 saat diakses langsung ke API, jadi file-nya sebenarnya ada.

**Solusi:** `resolveAssetPath()` kini mengembalikan **URL absolut ke host API** untuk path storage (`http://localhost:8000/storage/...`), sementara path aset frontend (`/objects/...`) tetap relatif. Ditambah validasi di panel admin (lihat D9).

### D9. Panel admin: path aset bisa salah tanpa pemberitahuan

**Gejala:** admin mengetik path yang tidak ada (mis. `/object/monitor.png`) → tersimpan tanpa error, hasilnya baru ketahuan saat game: hotspot tidak terlihat.

**Solusi:** trait `ValidatesAssetPaths` — field path aset di admin sekarang divalidasi (folder harus dikenal: objects, avatars, notes, treasures, achievements, backgrounds, comic, hotspots, ui, audio, levels + folder storage) dengan pesan error yang jelas. Field "Tipe Puzzle" juga diubah dari teks bebas menjadi dropdown (keypad, pattern, sequence, symbol, combination, computer, dual) supaya tidak salah memilih komponen puzzle di frontend.

### D10. Keluar dari level langsung keluar tanpa peringatan

**Gejala:** tombol "✕ Keluar" di HUD langsung memindahkan pemain ke menu utama — tidak ada konfirmasi. Cukup satu klik tidak sengaja, progres level yang sedang berjalan hilang.

**Solusi:** tombol Keluar sekarang membuka dialog konfirmasi ("Keluar dari level?") dengan tombol BATAL / YA, KELUAR. Isi peringatan menyebut level yang sedang dimainkan dan bahwa skor belum tersimpan.

### D11. "Reset progress" menghapus data tanpa backup

**Gejala:** fitur Reset Progress di menu Settings menghapus progress, achievement, dan treasure **permanen** (hard delete, tanpa arsip), padahal tidak ada tempat memulihkannya.

**Solusi:** fitur dihapus sepenuhnya — tombol di Settings, action di store, endpoint `DELETE /api/progress`, serta aksi "Reset Progress" di panel admin (per pemain maupun bulk). Tidak ada lagi cara menghapus progres pemain tanpa disengaja.

### D13. Treasure yang dikumpulkan tidak ada tampilannya

**Gejala:** saat treasure dikumpulkan di dalam game, tidak ada-feedback sama sekali - pemain hanya melihat treasure itu hilang. Bandingkan dengan menu Treasure, yang menampilkan gambar besar + nama + deskripsi dengan efek cahaya.

**Solusi:**
1. Komponen baru `TreasureShowcase` (tema hitam-emas) yang sama dengan showcase di menu Treasure: cahaya radial, sinar berputar, partikel berkilau, gambar treasure membesar, nama + deskripsi, dan teks "KLIK DI MANA SAJA UNTUK MENUTUP".
2. Store punya state baru `collectedTreasure` + action `setCollectedTreasure`; `findTreasure()` mengisinya dengan data treasure dari database (nama & deskripsi hasil edit admin).
3. Showcase dipasang **global di `App.tsx`** (bukan per level), jadi langsung muncul di level 1-7 maupun multiplayer. Menutupnya = klik di mana saja.

### D14. Treasure harus benar-benar tersimpan di database

**Risiko:** treasure bisa hilang di layar (hanya state lokal) tapi gagal tersimpan di server - pemain kehilangan koleksinya tanpa Tomorrow ada jejak.

**Solusi:**
- Alur resmi: `POST /api/treasures/found` → `PlayerTreasure::firstOrCreate()` (idempoten, aman untuk klik ganda) + pengecekan achievement "explorer" otomatis terbuka bila semua treasure level itu lengkap.
- Client sekarang **retry 3x** dengan jeda kalau request gagal (koneksi putus / server error).
- Treasure yang gagal disimpan dicatat di `pendingTreasureSaves` dan dicoba lagi pada collection berikutnya, plus notifikasi ke pemain ("Treasure belum tersimpan ke server, akan dicoba lagi").
- Guest (tanpa akun) memang tidak bisa disimpan - backend menolak dengan 403 "Guest cannot save treasures".

**Bukti pengujian end-to-end (level 1, akun uji):** treasure `treasure_lab_1` (Atom) dikumpulkan di browser → tampil showcase "ATOM" + deskripsi →dicek di `player_treasures` di database berisi 1 baris: `treasure_lab_1 (Atom) found_at=2026-11-13 02:50:17`.

### D12. Clue otomatis dari interaksi ("Catatan dibaca")

**Gejala:** setiap membuka catatan, zoom, atau panel puzzle otomatis menambah clue seperti "Catatan dibaca — Kamu membaca sebuah catatan". Isinya tidak membantu pemain dan memenuhi daftar clue dengan informasi sia-sia.

**Solusi:** clue otomatis tersebut dihapus (3 titik: `open_note`, `open_zoom`, `open_puzzle` di `useHotspotAction`). Clue yang benar-benar dari konten level (`give_clue`) tetap dipakai.

### D7. Avatar & nama karakter di layar Achievement "UNKNOWN"

**Gejala:** di menu Achievement, kolom avatar dan nama karakter per level tampil sebagai gambar default (`villain1.png`) dan teks **"UNKNOWN"**.

**Akar penyebab:** data `characterAvatar` / `characterName` hanya ada di file frontend (hardcode di `src/data/levels.ts` & `level6.ts` & `level7.ts`), sedangkan tabel `levels` di database **tidak punya kolomnya sama sekali**. Layar Achievement membaca level dari store (API), jadi kolom tersebut selalu kosong.

**Solusi:**
1. Migration baru menambah kolom `character_avatar` & `character_name` pada tabel `levels`, dan langsung mengisinya dengan nilai yang sama seperti data hardcode sebelumnya (Ethan, Ayla, Vania, Sunny, Andi, Katsuragi).
2. Field admin baru di `LevelResource` (Nama Karakter + Avatar) sehingga bisa diedit dari panel.
3. API mengirim kedua field di endpoint index (`/api/levels`) dan detail (`/api/levels/{key}`); frontend memetakannya ke `characterAvatar` / `characterName`.
4. Test `LevelCharacterProfileTest` + `AdminFormCoverageTest` menjaga agar field ini tidak hilang lagi.

**Pola yang bisa disimpulkan:** setiap data yang masih "hardcode di file" adalah calon bug yang sama - begitu kontennya pindah ke database, frontend harus punya satu jalur mapping yang jelas, dan admin harus punya field untuk mengeditnya.

### D6. Gameplay & gallery masih membaca data hardcode

Setelah prolog & level 7 diperbaiki,masih ada tempat lain yang membaca file lokal secara langsung:

| Tempat | Sumber lama | Solusi |
|---|---|---|
| `GameScene.tsx` (seluruh gameplay) | `LEVELS.find(...)` (file lokal); hanya treasure yang diambil dari API | Pakai level dari store (hasil merge API + lokal), `LEVELS` hanya fallback |
| `TreasureScreen.tsx` (galeri treasure) | `HARDCODED_LEVELS` + peta nama hardcode `TREASURE_INFO` | Pakai treasure dari store (API): nama, deskripsi, gambar, posisi dari database |
| `gameStore.ts` (lookup level/achievement) | `[...state.levels, ...FALLBACK_LEVELS]` — data lokal ikut terbaca dan bisa mengalahkan data API | Helper `findLevel()`: data store dulu, file lokal hanya fallback |
| `HUD.tsx` (batas waktu) | `LEVELS` | `timeLimit` dari store |
| `WinScreen` / `LoseScreen` | urutan level dari `LEVELS` | urutan & judul dari store |
| `Level7scene.tsx` | sudah pakai store, tapi hanya kalau `scenes.length > 0` | tetap dipakai, sekarang isinya sudah merge API |

**Detail penting level 7:** hotspot level 7 tidak ada di `scene.hotspots` (selalu kosong) tapi di dalam `char1/2/3Layer` dan sub-view. Karena itu overlay dari database harus dilakukan **mendalam (recursive)** ke seluruh array `hotspots` di dalam scene — kalau hanya `scene.hotspots` yang di-overlay, hasil edit admin untuk level 7 tidak akan pernah terlihat.

**Bukti pengujian:** posisi `hs_item_1` diubah di database dari `x=1.6` menjadi `x=12.3`, lalu level 7 dijalankan di browser — nilai yang dipakai game adalah **12.3** (dari database), bukan 1.6 (dari file lokal).

### D5. Data frontend tidak mengikuti database

Tiga penyebab yang ditemukan:

1. **Prolog memakai konstanta hardcode.** `App.tsx` membaca `LEVELS` (file lokal) untuk intro dialog dan comic, sehingga hasil edit "Dialog Lines" di admin tidak pernah tampil. **Solusi:** prolog sekarang diambil lewat `loadLevelPreview()` yang mengambil detail level dari API.
2. **Level 7 memakai data lokal sepenuhnya.** `USE_LOCAL_LEVELS = ['level_7']` membuat game mengabaikan database untuk level 7. **Solusi:** level 7 kini digabung - data lokal jadi pelengkap (char layer, X-Vision, sub-view, comic), database menimpa semua yang bisa disunting (posisi/gambar hotspot, background scene, jawaban puzzle, dialog, treasure, achievement).
3. **Kolom JSON tidak punya field admin** (lihat D4).

**Hasil:** setiap perubahan di admin (posisi hotspot, gambar, jawaban puzzle, dialog prolog, scene dialog, treasure, achievement, hint) langsung terlihat di game setelah refresh halaman.

**Hambatan arsitektural untuk laporan:** *sumber kebenaran ganda* (kode vs database) adalah sumber utama kebingungan saat demo dan debugging — "kok di admin berubah tapi di game tidak?"

---

## 6. Kategori E — Kualitas, testing & developer experience

- **Regresi multiplayer** sulit dicegay karena melibatkan dua browser. Solusinya: 18 feature test PHP yang mensimulasikan dua pemain pada level API (test yang dibuat karena bug ini):
  - `LobbyPodReleaseTest` (pod release, karakter ganda, pod login shared, reactor glitch shared)
  - `ReactorGlitchFixTest` (glitch add/clear per reactor, fake info per reactor, broadcast basi tidak membangkitkan gangguan)
  - `MazeChannelAuthTest` (otorisasi channel privat + route auth Sanctum)
- **Pemeriksaan otomatis berlapis:** `npx tsc --noEmit` (type safety), `npm run build` (build bersih), `vendor/bin/phpunit` (18/18 hijau).
- **Hambatan operasional:** perubahan backend baru berlaku setelah API di-restart — cukup sering menjadi sumber kebingungan ("kodenya sudah benar kok tidak jalan"). Rekomendasi: tambahkan watcher (`php artisan serve` + `npm run dev` dalam satu skrip) atau Laravel Octane.

---

## 7. Kategori F — Keamanan

- Channel lobby semula **publik** (`echo.channel`), sehingga siapa pun yang tahu nama lobby bisa menyimak state permainan. Diperbaiki untuk channel posisi baru (`private-maze.{code}` + `Broadcast::channel` + middleware `auth:sanctum`).
- Endpoint broadcast auth kini memakai token Bearer (bukan session `web`) supaya cocok dengan frontend SPA.
- **Utang:** channel state game masih publik; belum ada rate limiting per endpoint; belum ada audit log admin.

---

## 8. Rekomendasi lanjutan (roadmap)

### Prioritas tinggi (dampak besar, effort kecil–menengah)

1. **Pindahkan level 7 ke API** dengan skema JSON terstruktur (hotspot, scene, puzzle, char-layer) — menghapus sumber kebenaran ganda dan membuat seluruh konten bisa disunting dari admin.
2. **Channel privat untuk semua event state** (bukan hanya posisi) + `Broadcast::channel` authorization → menutup kebocoran state.
3. **Rate limiting + validasi payload** di endpoint sync (`throttle:120,1`, batas ukuran JSON) — melindungi API dari flooding.
4. **Skema kontrak API** (OpenAPI atau generated types) supaya interface TS dan PHP tidak diduplikasi manual.

### Prioritas menengah

5. **Server dev multi-worker** (Laravel Octane atau XAMPP/Apache) + Reverb tanpa `--debug` → waktu uji multiplayer jauh lebih stabil.
6. **Event spektrum sempit** untuk semua state yang sering berubah (inventory, hint, posisi), broadcast state penuh hanya untuk checkpoint.
7. **Pengganti `php -S` untuk benchmarking** + skrip benchmark (measure event latency, throughput) — hibrida pengukuran sebelum/sesudah perubahan.
8. **Pipeline CI**: `tsc` + `phpunit` + `build` otomatis pada setiap push; saat ini masih manual.

### Prioritas rendah (pengalaman & kualitas produk)

9. ESLint + Prettier + Husky (format & pre-commit) — saat ini indentasi file masih campuran.
10. **i18n**: seluruh teks Indonesia masih hardcode di komponen (`"Gangguan berhasil diperbaiki!"`).
11. **Observability**: log terstruktur untuk event sync (siapa, kapan, aksi apa) + dashboard error.
12. **E2E multiplayer test** (Playwright, 2 browser) untuk Alur glitch/fake info yang kini hanya diuji di level API.
13. **Manajemen aset**: validasi path aset saat upload (ceking file exists di DB), kompresi/ganti format (WebP) untuk aset besar.

---

## 9. Bukti angka untuk laporan

Angka-angka ini dapat dipakai sebagai bagian "evaluasi & hasil perbaikan":

| Indikator | Sebelum | Sesudah |
|---|---|---|
| Update posisi antar pemain | HTTP 15–30 req/detik (antrean menumpuk) | WebSocket whisper ~20 Hz, tanpa DB |
| Latensi broadcast state | 210–276 ms per event | Tidak lagi dipakai untuk per-frame |
| Glitch/fake info | hanya di POV solver, muncul lagi setelah diperbaiki | serempak di semua player, hilang permanen setelah diperbaiki |
| Fake info antar pemain | tidak pernah tersinkron | shared, dapat di-clear per reactor |
| Karakter ganda | bisa terjadi | ditolak server (409) |
| False win saat pemain keluar | terjadi | tidak terjadi (`finish_type='abandon'`) |
| Test otomatis | tidak ada | 18 feature test, 18/18 hijau |
| Type check | sering error baru ketahuan saat runtime | `tsc --noEmit` bersih, dipakai sebagai gate |

---

*Dokumen ini dibuat sebagai bahan laporan proyek: berisi hambatan nyata yang ditemukan selama pengembangan beserta solusi teknis dan dampaknya. Diperbarui mengikuti perubahan kode terbaru (sinkronisasi gangguan reactor level 7 & realtime multiplayer).*
