import { useState, useEffect, useRef } from 'react';
import { pauseMusic, resumeMusic } from '../../hooks/useMusic';

export interface ComicPanel {
  x: number;
  y: number;
  width: number;
  height: number;
  enterFrom?: 'fade' | 'scale' | 'slide-left' | 'slide-right' | 'slide-up';
  effect?: 'flash' | 'shake' | 'none';
  duration?: number;
}

interface Props {
  src: string;
  panels: ComicPanel[];
  onDone: () => void;
}

function PanelContent({ src, panel, isNewest }: { src: string; panel: ComicPanel; isNewest: boolean }) {
  const [visible, setVisible] = useState(false);
  const [flash, setFlash] = useState(false);
  const dur = panel.duration ?? 380;
  useEffect(() => { const t = setTimeout(() => setVisible(true), 20); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (isNewest && panel.effect === 'flash') { setFlash(true); const t = setTimeout(() => setFlash(false), 200); return () => clearTimeout(t); }
  }, [isNewest, panel.effect]);
  const enterFrom = panel.enterFrom ?? 'fade';
  const initialTransform =
    enterFrom === 'slide-left' ? 'translateX(-16px)' :
    enterFrom === 'slide-right' ? 'translateX(16px)' :
    enterFrom === 'slide-up' ? 'translateY(12px)' :
    enterFrom === 'scale' ? 'scale(0.9)' : 'none';

  return (
    <>
      <div style={{ position: 'absolute', inset: 0, opacity: visible ? 1 : 0, transform: visible ? 'none' : initialTransform, transition: `opacity ${dur}ms ease, transform ${dur}ms cubic-bezier(0.34,1.1,0.64,1)` }}>
        <img src={src} alt="" draggable={false} style={{ position: 'absolute', left: `${(-panel.x / panel.width) * 100}%`, top: `${(-panel.y / panel.height) * 100}%`, width: `${(100 / panel.width) * 100}%`, height: `${(100 / panel.height) * 100}%`, objectFit: 'fill', userSelect: 'none', pointerEvents: 'none' }} />
      </div>
      {isNewest && visible && (
        <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.6)', animation: 'borderFade 1.2s ease forwards', pointerEvents: 'none', zIndex: 10 }} />
      )}
      {flash && (
        <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 0.55, transition: 'opacity 0.2s ease', pointerEvents: 'none', zIndex: 20 }} />
      )}
    </>
  );
}

export function Level7AllCompleteComic({ src, panels, onDone }: Props) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [fadeIn, setFadeIn] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);
  const isTransitioning = useRef(false);

  useEffect(() => { pauseMusic(); return () => { resumeMusic(); }; }, []);

  // Mount: fade in, reveal panel 1, then show button component
  useEffect(() => {
    setFadeIn(true);
    let t2: ReturnType<typeof setTimeout> | undefined;
    const t1 = setTimeout(() => {
      setRevealedCount(1);
      t2 = setTimeout(() => setShowOverlay(true), 700);
    }, 400);
    return () => {
      clearTimeout(t1);
      if (t2) clearTimeout(t2);
    };
  }, []);

  const allRevealed = revealedCount >= panels.length;

  const handleAdvance = () => {
    if (isTransitioning.current) return;
    if (revealedCount < 1) return;
    isTransitioning.current = true;

    if (revealedCount < panels.length) {
      setRevealedCount(prev => prev + 1);
      setTimeout(() => { isTransitioning.current = false; }, 350);
    } else {
      setFadeOut(true);
      setTimeout(() => onDone(), 600);
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTransitioning.current) return;
    isTransitioning.current = true;

    setShowOverlay(false);
    if (revealedCount < panels.length) {
      setRevealedCount(prev => prev + 1);
      setTimeout(() => { isTransitioning.current = false; }, 350);
    } else {
      setFadeOut(true);
      setTimeout(() => onDone(), 600);
    }
  };
  if (fadeOut) return null;

  return (
    <div onClick={handleAdvance} style={{ position: 'fixed', inset: 0, zIndex: 9500, overflow: 'hidden', background: '#080808', opacity: fadeIn ? 1 : 0, transition: 'opacity 0.5s ease', cursor: 'pointer' }}>
      {/* Background image dim */}
      <img src={src} alt="All Complete" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.12, filter: 'brightness(0.4) contrast(1.2)', userSelect: 'none' }} />

      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)', zIndex: 1 }} />

      {/* Comic panels */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
        {panels.slice(0, revealedCount).map((panel, i) => (
          <div key={i} style={{ position: 'absolute', left: `${panel.x}%`, top: `${panel.y}%`, width: `${panel.width}%`, height: `${panel.height}%`, overflow: 'hidden', zIndex: i + 1, boxShadow: i === revealedCount - 1 ? '0 0 0 2.5px rgba(255,255,255,0.8), 0 0 20px rgba(255,255,255,0.25)' : '0 0 0 1.5px rgba(255,255,255,0.25)', transition: 'box-shadow 1s ease' }}>
            <PanelContent src={src} panel={panel} isNewest={i === revealedCount - 1} />
          </div>
        ))}
      </div>

      {/* Warning + button overlay (appears after panel revealed) */}
      {showOverlay && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }}>
          <div style={{ opacity: 1, textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontFamily: 'Courier New, Courier, monospace', fontSize: 'clamp(14px, 2.5vw, 22px)', fontWeight: 700, letterSpacing: '0.3em', color: '#34d399', textShadow: '0 0 20px rgba(52, 211, 153, 0.6), 0 2px 8px rgba(0,0,0,0.8)', textTransform: 'uppercase', marginBottom: 8 }}>REACTOR COMPLETE</div>
            <div style={{ fontFamily: 'Courier New, Courier, monospace', fontSize: 'clamp(10px, 1.5vw, 14px)', fontWeight: 400, letterSpacing: '0.2em', color: 'rgba(200, 184, 154, 0.8)', textShadow: '0 1px 4px rgba(0,0,0,0.6)', textTransform: 'uppercase' }}>ALL SYSTEMS SECURED</div>
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{ filter: 'drop-shadow(0 8px 24px rgba(255, 60, 60, 0.3))' }}>
              <img src="/objects/warning.png" alt="System Warning" draggable={false} style={{ display: 'block', marginTop: 10, width: 'clamp(600px, 18vw, 1300px)', height: 'auto', maxWidth: '140vw' }} />
            </div>
            <button onClick={(e) => handleButtonClick(e)} onMouseEnter={() => setButtonHovered(true)} onMouseLeave={() => setButtonHovered(false)} tabIndex={0} aria-label="Lanjut" style={{ position: 'absolute', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, zIndex: 10, transition: 'transform 0.15s ease' }}>
              <img src="/objects/buttonlast.png" alt="Lanjut" draggable={false} style={{ display: 'block', width: 'clamp(100px, 25vw, 240px)', top: '200', height: 'auto', marginTop: 75, maxWidth: '80vw', filter: buttonHovered ? 'drop-shadow(0 0 16px rgba(56, 189, 248, 0.8)) brightness(1.15)' : 'drop-shadow(0 4px 16px rgba(0, 0, 0, 0.6))', transition: 'filter 0.2s ease, transform 0.15s ease', transform: buttonHovered ? 'scale(1.03)' : 'scale(1)' }} />
              <div style={{ fontFamily: 'Courier New, Courier, monospace', fontSize: 'clamp(10px, 1.3vw, 13px)', fontWeight: 600, letterSpacing: '0.25em', color: buttonHovered ? '#38bdf8' : 'rgba(200, 184, 154, 0.7)', textShadow: '0 1px 4px rgba(0,0,0,0.6)', textTransform: 'uppercase', transition: 'color 0.2s ease', whiteSpace: 'nowrap' }}>
                {allRevealed ? 'KLIK UNTUK LANJUT' : 'LANJUT'}
              </div>
            </button>
          </div>
          <div style={{ opacity: 0.5, position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', fontFamily: 'Courier New, Courier, monospace', fontSize: 10, letterSpacing: '0.15em', color: 'rgba(100, 116, 139, 0.6)', textTransform: 'uppercase', pointerEvents: 'none' }}>
            Tekan ENTER atau klik tombol untuk melanjutkan — {revealedCount} / {panels.length}
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52, 211, 153, 0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 5, opacity: 1, animation: 'ambientPulse 4s ease-in-out infinite' }} />

      <style>{`
        @keyframes borderFade { 0% { box-shadow: inset 0 0 0 2px rgba(255,255,255,0.8); } 100% { box-shadow: inset 0 0 0 2px rgba(255,255,255,0.15); } }
        @keyframes ambientPulse { 0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); } }
      `}</style>
    </div>
  );
}
