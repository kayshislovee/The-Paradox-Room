import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { LEVELS } from '../../data/levels';

type Phase = 'idle' | 'glow' | 'burst' | 'done';

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
  { x: 45, y: 40 }, { x: 55, y: 40 },
  { x: 55, y: 60 }, { x: 45, y: 60 },
];

export function SceneTransitionAnimation({ onTransitionEnd }: Props) {
  const triggerSceneTransition    = useGameStore((s) => (s as any).triggerSceneTransition as boolean);
  const setTriggerSceneTransition = useGameStore((s) => (s as any).setTriggerSceneTransition as (v: boolean) => void);
  const activeTransitionSceneId   = useGameStore((s) => (s as any).activeTransitionSceneId as string | null);
  const currentLevelId            = useGameStore((s) => s.currentLevelId);

  const [phase, setPhase]         = useState<Phase>('idle');
  const [activePts, setActivePts] = useState(DEFAULT_PTS);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Selalu ambil dari LEVELS lokal — sceneTransitionPoints tidak ada di API
  const localLevel = LEVELS.find((l) => l.id === currentLevelId);
  const transitionMap = (localLevel as any)?.sceneTransitionPoints as Record<string, string> | undefined;

  useEffect(() => {
    if (!triggerSceneTransition || phase !== 'idle') return undefined;

    // Ambil points dari activeTransitionSceneId (scene asli sebelum _open)
    const pointsStr = activeTransitionSceneId && transitionMap
      ? transitionMap[activeTransitionSceneId]
      : undefined;

    // Simpan ke STATE supaya render pakai nilai yang benar
    setActivePts(pointsStr ? parsePoints(pointsStr) : DEFAULT_PTS);

    timers.current.forEach(clearTimeout);
    timers.current = [];

    const go = (fn: () => void, ms: number) => {
      const t = setTimeout(fn, ms);
      timers.current.push(t);
    };

    setPhase('glow');
    go(() => setPhase('burst'), 400);
    go(() => { onTransitionEnd(); }, 700);
    go(() => { setTriggerSceneTransition(false); }, 750);

    return () => timers.current.forEach(clearTimeout);
  }, [triggerSceneTransition]);

  useEffect(() => {
    if (!triggerSceneTransition && phase !== 'idle') {
      const t = setTimeout(() => setPhase('idle'), 400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [triggerSceneTransition]);

  if (phase === 'idle' && !triggerSceneTransition) return null;

  const cx = activePts.reduce((s, p) => s + p.x, 0) / activePts.length;
  const cy = activePts.reduce((s, p) => s + p.y, 0) / activePts.length;
  const clipPath = toClipPath(activePts);

  const isGlow  = phase === 'glow';
  const isBurst = phase === 'burst';

  return (
    <>
      {/* Glow radial dari titik tengah polygon */}
      <div style={{
        position:   'absolute', inset: 0,
        zIndex:     210,
        pointerEvents: 'none',
        background: `radial-gradient(ellipse 50% 60% at ${cx}% ${cy}%,
          rgba(255,240,200,${isGlow ? 0.6 : isBurst ? 1 : 0}) 0%,
          rgba(255,220,150,${isGlow ? 0.3 : isBurst ? 0.7 : 0}) 45%,
          transparent 80%)`,
        filter:     'blur(18px)',
        transition: 'background 0.35s ease',
      }} />

      {/* Cahaya dalam polygon */}
      <div style={{
        position: 'absolute', inset: 0,
        pointerEvents: 'none', zIndex: 211,
        clipPath,
        opacity: isGlow ? 0.9 : 1,
        transition: 'opacity 0.3s ease',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at ${cx}% ${cy}%,
            rgba(255,255,255,1) 0%,
            rgba(255,240,180,0.9) 50%,
            transparent 100%)`,
        }} />
      </div>

      {/* Burst putih memancar dari titik polygon */}
      <div style={{
        position:      'absolute', inset: 0,
        zIndex:        212,
        pointerEvents: 'none',
        background:    '#ffffff',
        clipPath:      isBurst
          ? `circle(200% at ${cx}% ${cy}%)`
          : `circle(0% at ${cx}% ${cy}%)`,
        transition:    'clip-path 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      }} />
    </>
  );
}