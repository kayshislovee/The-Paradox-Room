# Catatan Jawaban Puzzle — Escape Room

## Level 1 (Lab Misterius)
| Puzzle ID | Tipe | Jawaban | Max Digits |
|---|---|---|---|
| `puzzle_lever_pattern` | pattern | `10011001` | 8 |
| `puzzle_exit_keypad` | keypad | `374` | 3 |
| `puzzle_library_door` | keypad | `573` | 3 |
| `puzzle_store_computer` | computer | `755` | 3 |
| `puzzle_toystore_door` | computer | `5797` | 4 |

## Level 6 (The Infinity Paradox)
| Puzzle ID | Tipe | Jawaban |
|---|---|---|
| `puzzle_color_pattern` | pattern | `merah-orange-kuning-hijau-putih-hijau-hijau-pink-biru` |
| `puzzle_arrow_input` | combination | `2-3-75-27` |
| `puzzle_chemical_bottles` | combination | `biru-kuning-biru-pink` (exit puzzle) |

## Level 7 (Broken Paradox)

| `puzzle_dual_lock`  `['bintang', 'bulat', 'segitiga']` 
| `puzzle_scene2` | keypad | `52462`
login komputer
| `puzzle_chest_s4`  `146` 
| `puzzle_pod_control` | Scene 4 | — | `23150` | 

## Catatan
- `puzzle_scene3`, `puzzle_exit_scene4`, `puzzle_storage`, `puzzle_core_unlock` memiliki answer kosong — penyelesaiannya ditangani oleh logika scene (comic / goToScene), bukan input kode.
- `puzzle_pod_control` tidak lewat `solvePuzzle` input; kode `23150` di-verify di `PodControlPuzzle`.
- Puzzle `puzzle_lever_pattern` (pattern) dipakai di level 1 (scene lab) dengan answer `10011001`.