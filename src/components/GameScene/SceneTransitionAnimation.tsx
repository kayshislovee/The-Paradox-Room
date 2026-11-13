import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { LEVELS } from '../../data/levels';

type Phase = 'idle' | 'glow' | 'burst' | 'white';

interface Props {
  onTransitionEnd: () => void;
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
  { x: 45, y: 35 }, { x: 55, y: 35 },
  { x: 55, y: 65 }, { x: 45, y: 65 },
];

export function SceneTransitionAnimation({ onTransitionEnd }: Props) {
  const triggerSceneTransition    = useGameStore((s) => (s as any).triggerSceneTransition as boolean);
  const setTriggerSceneTransition = useGameStore((s) => (s as any).setTriggerSceneTransition as (v: boolean) => void);
  const activeTransitionSceneId   = useGameStore((s) => (s as any).activeTransitionSceneId as string | null);
  const currentLevelId            = useGameStore((s) => s.currentLevelId);

  const [phase, setPhase]         = useState<Phase>('idle');
  const [activePts, setActivePts] = useState(DEFAULT_PTS);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const localLevel    = LEVELS.find((l) => l.id === currentLevelId);
  const transitionMap = (localLevel as any)?.sceneTransitionPoints as Record<string, string> | undefined;

  useEffect(() => {
    if (!triggerSceneTransition || phase !== 'idle') return undefined;

    const pointsStr = activeTransitionSceneId && transitionMap
      ? transitionMap[activeTransitionSceneId]
      : undefined;
    setActivePts(pointsStr ? parsePoints(pointsStr) : DEFAULT_PTS);

    timers.current.forEach(clearTimeout);
    timers.current = [];

    const go = (fn: () => void, ms: number) => {
      const t = setTimeout(fn, ms);
      timers.current.push(t);
    };

    setPhase('glow');
    go(() => setPhase('burst'), 600);
    go(() => setPhase('white'), 1100);
    go(() => {
      // Pindah scene saat putih penuh
      onTransitionEnd();
      setTriggerSceneTransition(false);
      // Reset setelah scene baru render
      setTimeout(() => setPhase('idle'), 400);
    }, 1400);

    return () => timers.current.forEach(clearTimeout);
  }, [triggerSceneTransition]);

  if (phase === 'idle') return null;

  const cx = activePts.reduce((s, p) => s + p.x, 0) / activePts.length;
  const cy = activePts.reduce((s, p) => s + p.y, 0) / activePts.length;
  const clipPath = toClipPath(activePts);

  const isGlow  = phase === 'glow';
  const isBurst = phase === 'burst';
  const isWhite = phase === 'white';

  return (
    <>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', inset: 0,
        pointerEvents: 'none', zIndex: 210,
        background: `radial-gradient(ellipse 40% 60% at ${cx}% ${cy}%,
          rgba(255,240,200,${isGlow ? 0.4 : isBurst ? 0.9 : 1}) 0%,
          rgba(255,220,150,${isGlow ? 0.2 : isBurst ? 0.5 : 0.8}) 40%,
          transparent 70%)`,
        filter: 'blur(20px)',
        transition: 'background 0.5s ease',
      }} />

      {/* Cahaya dalam polygon */}
      <div style={{
        position: 'absolute', inset: 0,
        pointerEvents: 'none', zIndex: 212,
        clipPath, WebkitClipPath: clipPath,
        opacity: isGlow ? 0.7 : 1,
        transition: 'opacity 0.4s ease',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at ${cx}% ${cy}%,
            rgba(255,255,255,1) 0%,
            rgba(255,240,180,0.95) 30%,
            rgba(255,200,100,0.7) 60%,
            transparent 100%)`,
          transform: isBurst || isWhite ? 'scale(1.2)' : 'scale(1)',
          transition: 'transform 0.8s ease',
        }} />
      </div>

      {/* Garis tepi */}
      <div style={{
        position: 'absolute', inset: 0,
        pointerEvents: 'none', zIndex: 211,
        clipPath, WebkitClipPath: clipPath,
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

      {/* White fullscreen — pakai fixed supaya menutupi SELURUH layar termasuk HUD */}
      <div style={{
        position: 'fixed', inset: 0,
        background: '#ffffff',
        opacity: isWhite ? 1 : 0,
        transition: 'opacity 0.3s ease-in',
        pointerEvents: 'none',
        zIndex: 99999,
      }} />
    </>
  );
}