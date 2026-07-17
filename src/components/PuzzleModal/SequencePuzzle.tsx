import { useState } from 'react';
import type { Puzzle } from '../../types/game.types';
import styles from './SequencePuzzle.module.css';

interface Props { puzzle: Puzzle; onSolve: () => void; }

const COLOR_MAP: Record<string, string> = {
  MERAH: '#ef4444', BIRU: '#3b82f6', HIJAU: '#22c55e',
  KUNING: '#eab308', UNGU: '#a855f7', ORANYE: '#f97316',
};

export function SequencePuzzle({ puzzle, onSolve }: Props) {
  const answer = puzzle.answer as string[];
  const [pressed, setPressed] = useState<string[]>([]);
  const [wrong, setWrong] = useState(false);

  const handlePress = (item: string) => {
    const next = [...pressed, item];
    setPressed(next);

    // Cek apakah urutan salah di tengah jalan
    if (next[next.length - 1] !== answer[next.length - 1]) {
      setWrong(true);
      setTimeout(() => { setPressed([]); setWrong(false); }, 600);
      return;
    }

    if (next.length === answer.length) onSolve();
  };

  return (
    <div className={styles.wrapper}>
      {/* Progress indicator */}
      <div className={styles.progress}>
        {answer.map((_, i) => (
          <span
            key={i}
            className={`${styles.dot} ${i < pressed.length ? styles.dotDone : ''} ${wrong ? styles.dotWrong : ''}`}
          />
        ))}
      </div>

      {/* Buttons */}
      <div className={styles.buttons}>
        {answer.map((item) => {
          const color = COLOR_MAP[item] ?? '#6b7280';
          return (
            <button
              key={item}
              className={styles.btn}
              style={{ '--clr': color } as React.CSSProperties}
              onClick={() => handlePress(item)}
            >
              {item}
            </button>
          );
        })}
      </div>

      {wrong && <p className={styles.wrongMsg}>Urutan salah! Coba lagi.</p>}
    </div>
  );
}
