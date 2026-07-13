import { useState, useEffect, useCallback } from 'react';
import type { Puzzle } from '../../types/game.types';
import styles from './KeypadPuzzle.module.css';

interface Props { puzzle: Puzzle; onSolve: () => void; }

const KEYS = ['1','2','3','4','5','6','7','8','9','←','0','✓'];

export function KeypadPuzzle({ puzzle, onSolve }: Props) {
  const [input, setInput] = useState('');
  const [shake, setShake] = useState(false);
  const maxDigits = puzzle.maxDigits ?? 4;

  const handleKey = useCallback((key: string) => {
    if (key === '←') {
      setInput((p) => p.slice(0, -1));
      return;
    }
    if (key === '✓') {
      if (input === puzzle.answer) {
        onSolve();
      } else {
        setShake(true);
        setInput('');
        setTimeout(() => setShake(false), 500);
      }
      return;
    }
    if (input.length < maxDigits) {
      setInput((p) => p + key);
    }
  }, [input, puzzle.answer, maxDigits, onSolve]);

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleKey(e.key);
      if (e.key === 'Backspace') handleKey('←');
      if (e.key === 'Enter') handleKey('✓');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKey]);

  return (
    <div className={styles.wrapper}>
      {/* Display */}
      <div className={`${styles.display} ${shake ? styles.shake : ''}`}>
        {Array.from({ length: maxDigits }).map((_, i) => (
          <span key={i} className={`${styles.digit} ${i < input.length ? styles.filled : ''}`}>
            {input[i] ?? '·'}
          </span>
        ))}
      </div>

      {/* Keys */}
      <div className={styles.grid}>
        {KEYS.map((k) => (
          <button
            key={k}
            className={`${styles.key} ${k === '✓' ? styles.confirm : ''} ${k === '←' ? styles.del : ''}`}
            onClick={() => handleKey(k)}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}
