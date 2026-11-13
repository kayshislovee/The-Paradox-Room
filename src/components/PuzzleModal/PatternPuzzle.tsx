import { useState, useEffect } from 'react';
import type { Puzzle } from '../../types/game.types';
import styles from './PatternPuzzle.module.css';
import { useGameStore } from '../../store/gameStore';

interface Props {
  puzzle: Puzzle;
  onSolve: () => void;
  onInputChange?: (input: number[]) => void;
  sharedInput?: number[];
  sharedBy?: string;
}

export function PatternPuzzle({ puzzle, onSolve, onInputChange, sharedInput, sharedBy }: Props) {
  const size = puzzle.patternSize ?? 9;
  const cols = Math.round(Math.sqrt(size));
  const answer = (puzzle.answer as string).split(',').map(Number);
  const setPuzzleInputState = useGameStore((s) => s.setPuzzleInputState);
  const savedState = useGameStore((s) => s.puzzleInputStates[puzzle.id]);
  const [selected, setSelected] = useState<Set<number>>(new Set(savedState ?? []));
  const [wrong, setWrong] = useState(false);

  useEffect(() => {
    if (sharedInput) setSelected(new Set(sharedInput));
  }, [sharedInput]);

  const toggle = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      const arr = [...next];
      onInputChange?.(arr);
      setPuzzleInputState(puzzle.id, arr);
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
      onInputChange?.([]);
      setPuzzleInputState(puzzle.id, []);
      setTimeout(() => setWrong(false), 600);
    }
  };

  return (
    <div className={styles.wrapper}>
      {sharedBy && (
        <div style={{
          padding: '6px 14px', background: 'rgba(124,58,237,0.15)',
          border: '1px solid rgba(124,58,237,0.3)', borderRadius: 7,
          fontFamily: 'Courier New', fontSize: 10, color: '#a78bfa',
          letterSpacing: 2, textAlign: 'center', marginBottom: 12,
        }}>
          ✏ {sharedBy} sedang memilih pola...
        </div>
      )}
      <div className={`${styles.grid} ${wrong ? styles.wrong : ''}`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: size }).map((_, i) => (
          <button key={i} className={`${styles.cell} ${selected.has(i) ? styles.active : ''}`} onClick={() => toggle(i)} />
        ))}
      </div>
      <button className={styles.checkBtn} onClick={check}>✓ Periksa Pola</button>
      {wrong && <p className={styles.wrongMsg}>Pola salah! Coba lagi.</p>}
    </div>
  );
}