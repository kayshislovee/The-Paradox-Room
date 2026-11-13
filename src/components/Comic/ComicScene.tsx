import { useState, useEffect, useCallback, useRef } from 'react';
import { pauseMusic, resumeMusic } from '../../hooks/useMusic';
import { resolveAssetPath } from '../../lib/assetPath';

export interface ComicPanel {
  x: number;
  y: number;
  width: number;
  height: number;
  enterFrom?: 'fade' | 'scale' | 'slide-left' | 'slide-right' | 'slide-up';
  effect?: 'flash' | 'shake' | 'none';
  duration?: number;
  sfx?: string;
}

interface Props {
  src: string;
  panels: ComicPanel[];
  onDone: () => void;
  isLastPage?: boolean;
}

export function ComicScene({ src, panels, onDone }: Props) {
  const resolvedSrc = resolveAssetPath(src) ?? src;
  const [revealedCount, setRevealedCount] = useState(0);
  const [fadeIn, setFadeIn] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [skipAll, setSkipAll] = useState(false);
  const [hint, setHint] = useState(true);
  const isTransitioning = useRef(false);

  const allRevealed = revealedCount >= panels.length;

  useEffect(() => {
    pauseMusic();
    return () => { resumeMusic(); };
  }, []);

  // Reset state saat src berubah (ganti halaman)
  useEffect(() => {
    setRevealedCount(0);
    setFadeIn(false);
    setFadeOut(false);
    setShaking(false);
    setSkipAll(false);
    setHint(true);
    isTransitioning.current = false;

    // Fade in lalu muncul panel pertama
    const t1 = setTimeout(() => {
      setFadeIn(true);
    }, 80);
    const t2 = setTimeout(() => {
      setRevealedCount(1);
    }, 480);
    const t3 = setTimeout(() => setHint(false), 3500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [src]);

  // Shake & SFX saat panel baru muncul
  useEffect(() => {
    if (revealedCount < 1) return;
    const panel = panels[revealedCount - 1];

    if (panel?.effect === 'shake') {
      setShaking(true);
      setTimeout(() => setShaking(false), 480);
    }

    if (panel?.sfx) {
      const audio = new Audio(panel.sfx);
      audio.volume = 0.7;
      audio.play().catch(() => {});
    }
  }, [revealedCount, panels]);

  const handleClick = useCallback(() => {
    if (isTransitioning.current || fadeOut) return;

    // Semua panel sudah muncul — klik area tidak keluar
    // harus tekan tombol LANJUT
    if (allRevealed) return;

    isTransitioning.current = true;
    setTimeout(() => {
      setRevealedCount((c) => c + 1);
      isTransitioning.current = false;
    }, 80);
  }, [allRevealed, fadeOut]);

  const handleDone = useCallback(() => {
    setFadeOut(true);
    setTimeout(onDone, 500);
  }, [onDone]);

  const handleSkip = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (allRevealed) {
        handleDone();
        return;
      }
      setSkipAll(true);
      setRevealedCount(panels.length);
    },
    [allRevealed, panels.length, handleDone]
  );

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (['Space', 'Enter', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
        handleClick();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleClick]);

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#111',
        cursor: allRevealed ? 'default' : 'pointer',
        userSelect: 'none',
        zIndex: 9000,
        overflow: 'hidden',
        opacity: fadeIn && !fadeOut ? 1 : 0,
        transition: fadeOut ? 'opacity 0.5s ease' : 'opacity 0.45s ease',
      }}
    >
      {/* Halaman komik penuh — redup sebagai background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: shaking ? 'shake 0.45s ease' : 'none',
        }}
      >
        <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
          {/* Background komik redup */}
          <img
            src={resolvedSrc}
            alt="Comic"
            draggable={false}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'fill',
              opacity: 0.18,
              filter: 'brightness(0.7)',
              userSelect: 'none',
            }}
          />

          {/* Panel-panel yang sudah di-reveal */}
          {panels.slice(0, revealedCount).map((panel, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${panel.x}%`,
                top: `${panel.y}%`,
                width: `${panel.width}%`,
                height: `${panel.height}%`,
                overflow: 'hidden',
                zIndex: i + 1,
                boxShadow:
                  i === revealedCount - 1 && !skipAll
                    ? '0 0 0 2.5px rgba(255,255,255,0.8), 0 0 20px rgba(255,255,255,0.25)'
                    : '0 0 0 1.5px rgba(255,255,255,0.25)',
                transition: 'box-shadow 1s ease',
              }}
            >
              <PanelContent
                src={resolvedSrc}
                panel={panel}
                isNewest={i === revealedCount - 1 && !skipAll}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 50,
          background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.65) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: 3, zIndex: 60,
          background: 'rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${(revealedCount / panels.length) * 100}%`,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.7))',
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      {/* Hint */}
      <div
        style={{
          position: 'absolute',
          bottom: 18, right: allRevealed ? 120 : 20,
          color: 'rgba(255,255,255,0.5)',
          fontSize: 11,
          fontFamily: 'sans-serif',
          letterSpacing: 2,
          textTransform: 'uppercase',
          opacity: hint ? 1 : 0,
          transition: 'opacity 0.5s, right 0.3s',
          animation: 'pulse 1.8s ease infinite',
          pointerEvents: 'none',
          zIndex: 60,
        }}
      >
        {allRevealed ? '' : 'Tap untuk panel berikutnya →'}
      </div>

      {/* Counter */}
      <div
        style={{
          position: 'absolute',
          bottom: 18, left: 20,
          color: 'rgba(255,255,255,0.3)',
          fontSize: 11,
          fontFamily: 'monospace',
          letterSpacing: 1,
          zIndex: 60,
          pointerEvents: 'none',
        }}
      >
        {revealedCount} / {panels.length}
      </div>

      {/* Tombol SKIP / LANJUT */}
      <button
        onClick={handleSkip}
        style={{
          position: 'absolute',
          top: 16, right: 16,
          background: allRevealed
            ? 'rgba(255,255,255,0.15)'
            : 'rgba(255,255,255,0.07)',
          border: `1px solid ${allRevealed ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'}`,
          borderRadius: 6,
          color: allRevealed ? '#fff' : 'rgba(255,255,255,0.45)',
          fontSize: 11,
          fontFamily: 'sans-serif',
          letterSpacing: 2,
          textTransform: 'uppercase',
          padding: '7px 16px',
          cursor: 'pointer',
          transition: 'all 0.25s',
          zIndex: 60,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = allRevealed
            ? 'rgba(255,255,255,0.15)'
            : 'rgba(255,255,255,0.07)';
          e.currentTarget.style.color = allRevealed
            ? '#fff'
            : 'rgba(255,255,255,0.45)';
        }}
      >
        {allRevealed ? 'LANJUT ▶' : 'SKIP ▶▶'}
      </button>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }
        @keyframes shake {
          0%   { transform: translate(0,0); }
          15%  { transform: translate(-5px, 3px); }
          30%  { transform: translate(5px, -3px); }
          45%  { transform: translate(-4px, 2px); }
          60%  { transform: translate(4px, -2px); }
          75%  { transform: translate(-2px, 1px); }
          100% { transform: translate(0,0); }
        }
      `}</style>
    </div>
  );
}

// ── Sub-komponen panel ────────────────────────────────────────────────────────
function PanelContent({
  src,
  panel,
  isNewest,
}: {
  src: string;
  panel: ComicPanel;
  isNewest: boolean;
}) {
  const resolvedSrc = resolveAssetPath(src) ?? src;
  const [visible, setVisible] = useState(false);
  const [flash, setFlash] = useState(false);
  const dur = panel.duration ?? 380;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isNewest && panel.effect === 'flash') {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 200);
      return () => clearTimeout(t);
    }
  }, [isNewest, panel.effect]);

  const enterFrom = panel.enterFrom ?? 'fade';

  const initialTransform =
    enterFrom === 'slide-left'
      ? 'translateX(-16px)'
      : enterFrom === 'slide-right'
      ? 'translateX(16px)'
      : enterFrom === 'slide-up'
      ? 'translateY(12px)'
      : enterFrom === 'scale'
      ? 'scale(0.9)'
      : 'none';

  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: visible ? 1 : 0,
          transform: visible ? 'none' : initialTransform,
          transition: `opacity ${dur}ms ease, transform ${dur}ms cubic-bezier(0.34,1.1,0.64,1)`,
        }}
      >
        <img
          src={resolvedSrc}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            left: `${(-panel.x / panel.width) * 100}%`,
            top: `${(-panel.y / panel.height) * 100}%`,
            width: `${(100 / panel.width) * 100}%`,
            height: `${(100 / panel.height) * 100}%`,
            objectFit: 'fill',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Highlight border panel terbaru */}
      {isNewest && visible && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.6)',
            animation: 'borderFade 1.2s ease forwards',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
      )}

      {/* Flash effect */}
      {flash && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#fff',
            opacity: 0.55,
            transition: 'opacity 0.2s ease',
            pointerEvents: 'none',
            zIndex: 20,
          }}
        />
      )}

      <style>{`
        @keyframes borderFade {
          0%   { box-shadow: inset 0 0 0 2px rgba(255,255,255,0.8); }
          100% { box-shadow: inset 0 0 0 2px rgba(255,255,255,0); }
        }
      `}</style>
    </>
  );
}