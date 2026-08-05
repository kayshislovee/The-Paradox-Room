import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

const MAX_TOKENS = 5;
const REFILL_INTERVAL =  60 * 1000; 

export function useHintRefill() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      const { hintTokens, refillHintTokens } = useGameStore.getState();
      if (hintTokens < MAX_TOKENS) {
        refillHintTokens();
      }
    }, REFILL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
}