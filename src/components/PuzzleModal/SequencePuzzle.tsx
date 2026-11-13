import { useState, useEffect } from 'react';
import type { Puzzle } from '../../types/game.types';
import styles from './SequencePuzzle.module.css';
import { useGameStore } from '../../store/gameStore';

interface Props {
  puzzle: Puzzle;
  onSolve: () => void;
  onInputChange?: (input: string[]) => void;
  sharedInput?: string[];
  sharedBy?: string;
}

const COLOR_MAP: Record<string, string> = {
  MERAH: '#ef4444', BIRU: '#3b82f6', HIJAU: '#22c55e',
  KUNING: '#eab308', UNGU: '#a855f7', ORANYE: '#f97316',
};

export function SequencePuzzle({ puzzle, onSolve, onInputChange, sharedInput, sharedBy }: Props) {
  const answer = puzzle.answer as string[];
  const setPuzzleInputState = useGameStore((s) => s.setPuzzleInputState);
  const savedState = useGameStore((s) => s.puzzleInputStates[puzzle.id]);
  const [pressed, setPressed] = useState<string[]>(savedState ?? []);
  const [wrong, setWrong] = useState(false);

  useEffect(() => {
    if (sharedInput) setPressed(sharedInput);
  }, [sharedInput]);

  const handlePress = (item: string) => {
    const next = [...pressed, item];
    setPressed(next);
    setPuzzleInputState(puzzle.id, next);
    onInputChange?.(next);

    if (next[next.length - 1] !== answer[next.length - 1]) {
      setWrong(true);
      setTimeout(() => {
        setPressed([]);
        setPuzzleInputState(puzzle.id, []);
        onInputChange?.([]);
        setWrong(false);
      }, 600);
      return;
    }
    if (next.length === answer.length) onSolve();
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
          ✏ {sharedBy} sedang memilih urutan...
        </div>
      )}
      <div className={styles.progress}>
        {answer.map((_, i) => (
          <span key={i} className={`${styles.dot} ${i < pressed.length ? styles.dotDone : ''} ${wrong ? styles.dotWrong : ''}`} />
        ))}
      </div>
      <div className={styles.buttons}>
        {answer.map((item) => {
          const color = COLOR_MAP[item] ?? '#6b7280';
          return (
            <button key={item} className={styles.btn} style={{ '--clr': color } as React.CSSProperties} onClick={() => handlePress(item)}>
              {item}
            </button>
          );
        })}
      </div>
      {wrong && <p className={styles.wrongMsg}>Urutan salah! Coba lagi.</p>}
    </div>
  );
}