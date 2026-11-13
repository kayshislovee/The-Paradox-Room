import { useEffect, useRef, useState } from 'react';

type Phase = 'idle' | 'glow' | 'burst' | 'dark' | 'done';

interface Props {
  trigger: boolean;
  onDone?: () => void;
  polygonPoints?: string;
}

function parsePoints(str: string) {
  return str.trim().split(/\s+/).map((p) => {
    const [x, y] = p.split(',').map(Number);
    return { x, y };
  });
}

function toClipPath(pts: { x: number; y: number }[]) {
  return `polygon(${pts.map((p) => `${p.x}% ${p.y}%`).join(', ')})`;
}

const DEFAULT_PTS = [
  { x: 37.8, y: 29.6 }, { x: 37.6, y: 81.1 },
  { x: 31.9, y: 85.8 }, { x: 51.3, y: 86 },
  { x: 47.4, y: 81.6 }, { x: 47.2, y: 29.3 },
  { x: 50.7, y: 24.6 }, { x: 33.7, y: 25.1 },
];

export function SplashTransition({ trigger, onDone, polygonPoints }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [finished, setFinished] = useState(false);
  const [activePts, setActivePts] = useState(DEFAULT_PTS);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!trigger) return undefined;
    if (phase !== 'idle') return undefined;

    setActivePts(polygonPoints ? parsePoints(polygonPoints) : DEFAULT_PTS);

    timers.current.forEach(clearTimeout);
    timers.current = [];

    const go = (fn: () => void, ms: number) => {
      const t = setTimeout(fn, ms);
      timers.current.push(t);
    };

    // Alur fase persis seperti DoorEscapeAnimation
    setPhase('glow');
    go(() => setPhase('burst'), 800);
    go(() => setPhase('dark'), 1600);
    go(() => {
      setPhase('done');
      setFinished(true);
      onDone?.();
    }, 2400);

    return () => timers.current.forEach(clearTimeout);
  }, [trigger]);

  useEffect(() => {
    if (finished && !trigger) {
      setPhase('idle');
      setFinished(false);
    }
  }, [finished, trigger]);

  if (phase === 'idle' && !finished) return null;

  const cx = activePts.reduce((s, p) => s + p.x, 0) / activePts.length;
  const cy = activePts.reduce((s, p) => s + p.y, 0) / activePts.length;
  const clipPath = toClipPath(activePts);

  const isGlow  = phase === 'glow';
  const isBurst = phase === 'burst';
  const isDark  = phase === 'dark';
  const isDone  = phase === 'done';

  return (
    <>
      {/* 1. Ambient Dark Purple Blur di Luar Polygon */}
      <div style={{
        position: 'fixed', inset: 0,
        pointerEvents: 'none', zIndex: 9990,
        background: `radial-gradient(ellipse 50% 70% at ${cx}% ${cy}%,
          rgba(102,0,204,${isGlow ? 0.4 : isBurst ? 0.8 : isDark || isDone ? 1 : 0}) 0%,
          rgba(40,0,80,${isGlow ? 0.25 : isBurst ? 0.6 : isDark || isDone ? 0.9 : 0}) 40%,
          rgba(0,0,0,${isGlow ? 0.1 : isBurst ? 0.3 : isDark || isDone ? 0.8 : 0}) 70%,
          transparent 100%)`,
        filter: 'blur(25px)',
        transition: 'background 0.6s ease',
      }} />

      {/* 2. Burst Cahaya Hitam-Ungu (Dikunci Presisi Mengikuti Polygon) */}
      <div style={{
        position: 'fixed', inset: 0,
        pointerEvents: 'none', zIndex: 9992,
        clipPath,
        WebkitClipPath: clipPath,
        opacity: isGlow ? 0.8 : 1,
        transition: 'opacity 0.4s ease',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at ${cx}% ${cy}%,
            rgba(180,100,255,${isGlow ? 0.7 : 1}) 0%,
            rgba(80,0,160,${isGlow ? 0.6 : 0.95}) 35%,
            rgba(20,0,40,${isGlow ? 0.4 : 0.85}) 65%,
            rgba(0,0,0,${isGlow ? 0.8 : 1}) 100%)`,
          transform: isBurst || isDark || isDone ? 'scale(1.2)' : 'scale(1)',
          transition: 'transform 0.8s ease, background 0.5s ease',
        }} />
      </div>

      {/* 3. Outer Edge / Glow Border Polygon (Ungu Menyala) */}
      <div style={{
        position: 'fixed', inset: 0,
        pointerEvents: 'none', zIndex: 9991,
        clipPath,
        WebkitClipPath: clipPath,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          border: `3px solid rgba(210,140,255,${isGlow ? 0.6 : 1})`,
          boxShadow: `
            0 0 ${isGlow ? 20 : 60}px rgba(160,50,255,0.9),
            0 0 ${isGlow ? 40 : 120}px rgba(80,0,180,0.7),
            inset 0 0 ${isGlow ? 20 : 60}px rgba(220,160,255,0.8)`,
          transition: 'all 0.5s ease',
        }} />
      </div>

      {/* 4. Dark/Purple Overlay Transisi Akhir Fullscreen */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse at center, #0d001a 0%, #000000 100%)',
        opacity: (isDark || isDone || finished) ? 1 : 0,
        transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'none',
        zIndex: 9999,
      }} />
    </>
  );
}