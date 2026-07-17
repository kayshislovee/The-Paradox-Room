import { useGameStore } from '../../store/gameStore';
import type { Level } from '../../types/game.types';
import { KeypadPuzzle } from './KeypadPuzzle';
import { SequencePuzzle } from './SequencePuzzle';
import { PatternPuzzle } from './PatternPuzzle';
import { LeverPuzzle } from './LeverPuzzle';
import styles from './PuzzleModal.module.css';

interface Props {
  puzzleId: string;
  level: Level;
}

export function PuzzleModal({ puzzleId, level }: Props) {
  const { closePuzzle, solvePuzzle, isPuzzleSolved, addToInventory, showNotification } =
    useGameStore();

  const puzzle = level.puzzles.find((p) => p.id === puzzleId);
  if (!puzzle) return null;

  const alreadySolved = isPuzzleSolved(puzzleId);

  const handleSolve = () => {
    solvePuzzle(puzzleId);
    if (puzzle.reward) {
      const item = level.items.find((i) => i.id === puzzle.reward);
      if (item) addToInventory(item);
    }
    showNotification('✅ Sistem teraktifkan! Pintu terbuka!', 'success');
    setTimeout(() => closePuzzle(), 1500);
  };

  // Puzzle tuas (pola biner) — tampilan full panel
  const isLeverPuzzle = puzzle.id === 'puzzle_lever_pattern' || puzzle.patternSize === 8;

  return (
    <div className={styles.overlay} onClick={closePuzzle}>
      <div
        className={styles.box}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <h3 className={styles.title}>{puzzle.title}</h3>
          <button className={styles.closeBtn} onClick={closePuzzle}>✕</button>
        </div>

        <div className={styles.content}>
          {alreadySolved ? (
            <div className={styles.solved}>✓ SISTEM SUDAH AKTIF</div>
          ) : (
            <>
              {isLeverPuzzle && (
                <LeverPuzzle puzzle={puzzle} onSolve={handleSolve} />
              )}
              {!isLeverPuzzle && puzzle.type === 'keypad' && (
                <KeypadPuzzle puzzle={puzzle} onSolve={handleSolve} />
              )}
              {!isLeverPuzzle && puzzle.type === 'sequence' && (
                <SequencePuzzle puzzle={puzzle} onSolve={handleSolve} />
              )}
              {!isLeverPuzzle && puzzle.type === 'pattern' && (
                <PatternPuzzle puzzle={puzzle} onSolve={handleSolve} />
              )}
            </>
          )}
        </div>

        {/* Clue hints */}
        {puzzle.clueIds.length > 0 && (
          <div className={styles.clueHints}>
            <span className={styles.clueLabel}>💡 Clue terkait:</span>
            {puzzle.clueIds.map((cid) => {
              const clue = level.clues.find((c) => c.id === cid);
              return clue ? (
                <span key={cid} className={styles.clueTag}>{clue.hint}</span>
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}