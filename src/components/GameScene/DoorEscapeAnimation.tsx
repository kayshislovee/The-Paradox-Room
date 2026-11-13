import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { LEVELS } from '../../data/levels';

type Phase = 'idle' | 'glow' | 'burst' | 'white' | 'done';

interface Props {
  onComplete?: () => void;
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
  { x: 43, y: 22 }, { x: 57, y: 22 },
  { x: 57, y: 62 }, { x: 43, y: 62 },
];

export function DoorEscapeAnimation({ onComplete }: Props) {
  const triggerDoorAnimation    = useGameStore((s) => (s as any).triggerDoorAnimation as boolean);
  const setTriggerDoorAnimation = useGameStore((s) => (s as any).setTriggerDoorAnimation as (v: boolean) => void);
  const completeLevel           = useGameStore((s) => s.completeLevel);
  const currentLevelId          = useGameStore((s) => s.currentLevelId);
  const screen                  = useGameStore((s) => s.screen);

  const [phase, setPhase]       = useState<Phase>('idle');
  const [finished, setFinished] = useState(false);
  const [activePts, setActivePts] = useState(DEFAULT_PTS);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const localLevel = LEVELS.find((l) => l.id === currentLevelId);

  useEffect(() => {
    if (!triggerDoorAnimation) return undefined;
    if (phase !== 'idle') return undefined;

    const doorPoints = (localLevel as any)?.exitDoorPoints as string | undefined;
    setActivePts(doorPoints ? parsePoints(doorPoints) : DEFAULT_PTS);

    timers.current.forEach(clearTimeout);
    timers.current = [];

    const go = (fn: () => void, ms: number) => {
      const t = setTimeout(fn, ms);
      timers.current.push(t);
    };

    setPhase('glow');
    go(() => setPhase('burst'), 800);
    go(() => setPhase('white'), 1600);
    go(() => {
      setPhase('done');
      setFinished(true);
      setTriggerDoorAnimation(false);
      completeLevel();
      onComplete?.();
    }, 2400);

    return () => timers.current.forEach(clearTimeout);
  }, [triggerDoorAnimation]);

  useEffect(() => {
    if (finished && screen !== 'gameplay') {
      setPhase('idle');
      setFinished(false);
    }
  }, [finished, screen]);

  if (phase === 'idle' && !finished) return null;

  const cx = activePts.reduce((s, p) => s + p.x, 0) / activePts.length;
  const cy = activePts.reduce((s, p) => s + p.y, 0) / activePts.length;
  const clipPath = toClipPath(activePts);

  const isGlow  = phase === 'glow';
  const isBurst = phase === 'burst';
  const isWhite = phase === 'white';
  const isDone  = phase === 'done';

  return (
    <>
      {/* 1. Ambient Blur di Luar Pintu */}
      <div style={{
        position: 'absolute', inset: 0,
        pointerEvents: 'none', zIndex: 10,
        background: `radial-gradient(ellipse 40% 60% at ${cx}% ${cy}%,
          rgba(255,240,200,${isGlow ? 0.4 : isBurst ? 0.9 : isWhite || isDone ? 1 : 0}) 0%,
          rgba(255,220,150,${isGlow ? 0.2 : isBurst ? 0.5 : isWhite || isDone ? 0.8 : 0}) 40%,
          transparent 70%)`,
        filter: 'blur(20px)',
        transition: 'background 0.6s ease',
      }} />

      {/* 2. Burst Cahaya (Dikunci Presisi Mengikuti Polygon Pintu) */}
      <div style={{
        position: 'absolute', inset: 0,
        pointerEvents: 'none', zIndex: 12,
        clipPath,
        WebkitClipPath: clipPath,
        opacity: isGlow ? 0.7 : 1,
        transition: 'opacity 0.4s ease',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at ${cx}% ${cy}%,
            rgba(255,255,255,${isGlow ? 0.8 : 1}) 0%,
            rgba(255,240,180,${isGlow ? 0.6 : 0.95}) 30%,
            rgba(255,200,100,${isGlow ? 0.3 : 0.7}) 60%,
            transparent 100%)`,
          transform: isBurst || isWhite || isDone ? 'scale(1.2)' : 'scale(1)',
          transition: 'transform 0.8s ease, background 0.5s ease',
        }} />
      </div>

      {/* 3. Outer Edge / Shadow Pintu */}
      <div style={{
        position: 'absolute', inset: 0,
        pointerEvents: 'none', zIndex: 11,
        clipPath,
        WebkitClipPath: clipPath,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          border: `3px solid rgba(255,255,200,${isGlow ? 0.6 : 1})`,
          boxShadow: `
            0 0 ${isGlow ? 20 : 60}px rgba(255,240,150,0.9),
            0 0 ${isGlow ? 40 : 120}px rgba(255,200,100,0.6),
            inset 0 0 ${isGlow ? 20 : 60}px rgba(255,255,255,0.8)`,
          transition: 'all 0.5s ease',
        }} />
      </div>

      {/* 4. White Overlay Transisi Akhir Fullscreen */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse at center, #ffffff 0%, #fffdf0 100%)',
        opacity: (isWhite || isDone || finished) ? 1 : 0,
        transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'none',
        zIndex: 9999,
      }} />
    </>
  );
}
