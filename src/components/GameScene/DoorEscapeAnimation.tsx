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
  // Track whether the animation has finished so we keep the white overlay
  const [finished, setFinished] = useState(false);
  const [activePts, setActivePts] = useState(DEFAULT_PTS);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const localLevel = LEVELS.find((l) => l.id === currentLevelId);

  useEffect(() => {
    if (!triggerDoorAnimation) {
      // Don't reset phase to idle here — let 'finished' state keep the overlay
      return undefined;
    }
    if (phase !== 'idle') return undefined;

    // Simpan points ke STATE saat trigger aktif
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
      // Mark animation as finished but keep white overlay
      setPhase('done');
      setFinished(true);
      setTriggerDoorAnimation(false);
      completeLevel();
      onComplete?.();
    }, 2400);

    return () => timers.current.forEach(clearTimeout);
  }, [triggerDoorAnimation]);

  // Reset everything only when screen actually leaves 'gameplay' (e.g. becomes 'win')
  useEffect(() => {
    if (finished && screen !== 'gameplay') {
      setPhase('idle');
      setFinished(false);
    }
  }, [finished, screen]);

  

  // Show the white overlay if the animation is finished (waiting for screen change)
  // OR if a phase animation is actively playing
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
      <div style={{
        position: 'absolute', inset: 0,
        pointerEvents: 'none', zIndex: 10,
        background: `radial-gradient(ellipse 30% 50% at ${cx}% ${cy}%,
          rgba(255,240,200,${isGlow ? 0.4 : isBurst ? 0.9 : isWhite || isDone ? 1 : 0}) 0%,
          rgba(255,220,150,${isGlow ? 0.2 : isBurst ? 0.5 : isWhite || isDone ? 0.8 : 0}) 40%,
          transparent 70%)`,
        filter: 'blur(20px)',
        transition: 'background 0.6s ease',
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        pointerEvents: 'none', zIndex: 12,
        clipPath,
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
          transition: 'background 0.5s ease',
        }} />
      </div>

      <div style={{
        position: 'absolute', inset: 0,
        pointerEvents: 'none', zIndex: 11,
        clipPath,
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

     {/* Burst — cahaya melebar smooth dari titik pintu */}
{(isBurst || isWhite || isDone) && (
  <div style={{
    position: 'absolute', inset: 0,  // ← fixed bukan absolute
    pointerEvents: 'none', zIndex: 13,
    clipPath,
    background: `radial-gradient(ellipse 60% 80% at ${cx}% ${cy}%,
      rgba(255,255,255,${isWhite || isDone ? 1 : 0.5}) 0%,
      rgba(255,250,220,${isWhite || isDone ? 1 : 0.3}) 40%,
      rgba(255,240,180,${isWhite || isDone ? 0.8 : 0.1}) 70%,
      transparent 100%)`,
    transition: 'background 0.8s cubic-bezier(0.4, 0, 0.2, 1)',  // ← lebih smooth
    mixBlendMode: 'screen',
  }} />
)}

{/* White overlay full screen */}
<div style={{
  position: 'absolute', inset: 0,  // ← sudah fixed, pertahankan
  background: 'radial-gradient(ellipse at center, #ffffff 0%, #fffdf0 100%)',  // ← gradient bukan flat white
  opacity: (isWhite || isDone || finished) ? 1 : 0,
  transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',  // ← lebih smooth
  pointerEvents: 'none',
  zIndex: 14,
}} />
    </>
  );
}
