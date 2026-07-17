import { useState } from 'react';
import type { Puzzle } from '../../types/game.types';
import styles from './PatternPuzzle.module.css';

interface Props { puzzle: Puzzle; onSolve: () => void; }

export function PatternPuzzle({ puzzle, onSolve }: Props) {
  const size = puzzle.patternSize ?? 9;
  const cols = Math.round(Math.sqrt(size));
  const answer = (puzzle.answer as string).split(',').map(Number); // "0,2,4,6,8" → [0,2,4,6,8]

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState(false);

  const toggle = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const check = () => {
    const sel = [...selected].sort((a, b) => a - b);
    const ans = [...answer].sort((a, b) => a - b);
    if (JSON.stringify(sel) === JSON.stringify(ans)) {
      onSolve();
    } else {
      setWrong(true);
      setSelected(new Set());
      setTimeout(() => setWrong(false), 600);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.grid} ${wrong ? styles.wrong : ''}`}
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: size }).map((_, i) => (
          <button
            key={i}
            className={`${styles.cell} ${selected.has(i) ? styles.active : ''}`}
            onClick={() => toggle(i)}
          />
        ))}
      </div>

      <button className={styles.checkBtn} onClick={check}>
        ✓ Periksa Pola
      </button>

      {wrong && <p className={styles.wrongMsg}>Pola salah! Coba lagi.</p>}
    </div>
  );
}
