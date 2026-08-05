import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

export function useTimer() {
  const timerActive = useGameStore((s) => s.timerActive);
  const tickTimer = useGameStore((s) => s.tickTimer);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerActive) {
      intervalRef.current = setInterval(() => {
        tickTimer();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerActive]);
}

export function formatTime(elapsed: number, limit?: number) {
  // Kalau ada limit → hitung countdown, kalau tidak → tampilkan elapsed langsung
  const value = limit !== undefined
    ? Math.max(0, limit - elapsed)
    : Math.max(0, elapsed);
  const m = Math.floor(value / 60).toString().padStart(2, '0');
  const s = (value % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
