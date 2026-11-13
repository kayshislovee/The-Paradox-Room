import { useGameStore } from '../store/gameStore';

export function usePuzzleSync(puzzleId: string) {
  const lobbyPuzzleInputs = useGameStore((s) => s.lobbyPuzzleInputs);
  const lastInputBy = useGameStore((s) => s.lobbyLastInputBy);

  const rawInput = lobbyPuzzleInputs?.[puzzleId];

  // WAJIB undefined, bukan null.
  // Sebagian komponen mengecek `sharedInput !== undefined` sebelum setInput().
  // Kalau di sini dikembalikan null, cek itu lolos, lalu `input[i]` meledak
  // dengan "Cannot read properties of null" dan seluruh app jadi black screen.
  const sharedInput = rawInput !== undefined ? rawInput : undefined;
  const sharedBy = rawInput !== undefined ? lastInputBy : undefined;

  return { sharedInput, sharedBy };
}