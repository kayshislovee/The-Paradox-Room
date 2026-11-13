

import { useEffect, useRef, useState } from 'react';

type Phase = 'idle' | 'ripple' | 'suck' | 'dark' | 'done';

interface Props {
  onDone: () => void;
  /** Titik pusat portal dalam % layar */
  originX?: number;
  originY?: number;
}

export function BlackHoleTransition({ onDone, originX = 50, originY = 50 }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [rippleSize, setRippleSize] = useState(0);
  const [suckProgress, setSuckProgress] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const go = (fn: () => void, ms: number) => {
      const t = setTimeout(fn, ms);
      timers.current.push(t);
      return t;
    };

    // Fase 1: Ripple — gelombang hitam menyebar dari titik
    setPhase('ripple');
    setRippleSize(0);

    // Animasi ripple expand
    const rippleStart = performance.now();
    const rippleDuration = 600;
    const animateRipple = (now: number) => {
      const t = Math.min((now - rippleStart) / rippleDuration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setRippleSize(ease * 30); // max 30% radius
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animateRipple);
      }
    };
    rafRef.current = requestAnimationFrame(animateRipple);

    // Fase 2: Suck — semua konten tersedot ke titik pusat
    go(() => {
      setPhase('suck');
      const suckStart = performance.now();
      const suckDuration = 800;
      const animateSuck = (now: number) => {
        const t = Math.min((now - suckStart) / suckDuration, 1);
        const ease = Math.pow(t, 2);
        setSuckProgress(ease);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(animateSuck);
        }
      };
      rafRef.current = requestAnimationFrame(animateSuck);
    }, 500);

    // Fase 3: Dark — layar gelap total
    go(() => setPhase('dark'), 1200);

    // Fase 4: Done — pindah screen
    go(() => {
      setPhase('done');
      onDone();
    }, 1600);

    return () => {
      timers.current.forEach(clearTimeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (phase === 'idle') return null;

  const isRipple = phase === 'ripple';
  const isSuck = phase === 'suck';
  const isDark = phase === 'dark' || phase === 'done';

  return (
    <>
      {/* Layer 1: Ripple gelombang hitam dari titik */}
      {isRipple && (
        <>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              position: 'fixed',
              left: `${originX}%`,
              top: `${originY}%`,
              width: `${rippleSize * (1 - i * 0.25)}vmax`,
              height: `${rippleSize * (1 - i * 0.25)}vmax`,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              border: `${2 - i * 0.5}px solid rgba(0,0,0,${0.6 - i * 0.15})`,
              boxShadow: `0 0 ${20 - i * 5}px rgba(0,0,0,0.4)`,
              pointerEvents: 'none',
              zIndex: 9990 + i,
            }} />
          ))}
        </>
      )}

      {/* Layer 2: Vignette hitam dari tepi ke pusat (suck effect) */}
      <div style={{
        position: 'fixed', inset: 0,
        background: `radial-gradient(ellipse at ${originX}% ${originY}%,
          transparent ${isSuck ? Math.max(0, 40 - suckProgress * 45) : isDark ? 0 : 40}%,
          rgba(0,0,0,${isSuck ? 0.3 + suckProgress * 0.7 : isDark ? 1 : 0}) 70%,
          rgba(0,0,0,${isSuck ? 0.6 + suckProgress * 0.4 : isDark ? 1 : 0}) 100%)`,
        transition: isRipple ? 'background 0.4s ease' : 'none',
        pointerEvents: 'none',
        zIndex: 9993,
      }} />

      {/* Layer 3: Portal hitam di titik pusat yang membesar */}
      <div style={{
        position: 'fixed',
        left: `${originX}%`,
        top: `${originY}%`,
        width: isSuck
          ? `${suckProgress * 300}vmax`
          : isRipple ? `${rippleSize * 0.3}vmax` : 0,
        height: isSuck
          ? `${suckProgress * 300}vmax`
          : isRipple ? `${rippleSize * 0.3}vmax` : 0,
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse at center, #000000 0%, #0a0a0a 40%, #111 100%)',
        boxShadow: isSuck
          ? `0 0 ${suckProgress * 60}px rgba(0,0,0,0.9), 0 0 ${suckProgress * 120}px rgba(0,0,0,0.6)`
          : 'none',
        transition: 'none',
        pointerEvents: 'none',
        zIndex: 9994,
      }} />

      {/* Layer 4: Distorsi warna di sekitar portal */}
      {isSuck && (
        <div style={{
          position: 'fixed',
          left: `${originX}%`,
          top: `${originY}%`,
          width: `${suckProgress * 200}vmax`,
          height: `${suckProgress * 200}vmax`,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: `radial-gradient(ellipse at center,
            transparent 40%,
            rgba(20,0,40,${suckProgress * 0.4}) 60%,
            rgba(40,0,20,${suckProgress * 0.3}) 80%,
            transparent 100%)`,
          pointerEvents: 'none',
          zIndex: 9992,
          filter: `blur(${suckProgress * 8}px)`,
        }} />
      )}

      {/* Layer 5: Full black overlay di akhir */}
      <div style={{
        position: 'fixed', inset: 0,
        background: '#000000',
        opacity: isDark ? 1 : 0,
        transition: isDark ? 'opacity 0.4s ease-in' : 'none',
        pointerEvents: 'none',
        zIndex: 9999,
      }} />
    </>
  );
}