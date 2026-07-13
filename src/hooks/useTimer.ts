import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

/**
 * Menjalankan timer setiap detik selama gameplay aktif.
 * Dipanggil sekali di komponen GameScene.
 */
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
  }, [timerActive, tickTimer]);
}

/** Format detik → MM:SS */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
