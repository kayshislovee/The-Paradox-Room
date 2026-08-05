import { useState, useRef } from 'react';

interface Props {
  image: string;
  onClose: () => void;
}

export function ZoomableNote({ image, onClose }: Props) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const lastTouchDist = useRef<number | null>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);

  // ── Pinch to zoom ──────────────────────────────────────────────────────────
  const getTouchDist = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      lastTouchDist.current = getTouchDist(e.touches);
    } else if (e.touches.length === 1) {
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      isDragging.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const dist = getTouchDist(e.touches);
      const delta = dist / lastTouchDist.current;
      setScale((s) => Math.min(4, Math.max(0.5, s * delta)));
      lastTouchDist.current = dist;
    } else if (e.touches.length === 1 && isDragging.current && lastPos.current) {
      const dx = e.touches[0].clientX - lastPos.current.x;
      const dy = e.touches[0].clientY - lastPos.current.y;
      setPosition((p) => ({ x: p.x + dx, y: p.y + dy }));
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchEnd = () => {
    lastTouchDist.current = null;
    isDragging.current = false;
    lastPos.current = null;
  };

  // ── Mouse wheel zoom (untuk desktop) ─────────────────────────────────────
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.min(4, Math.max(0.5, s * delta)));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* Gambar notes */}
      <img
        src={image}
        alt="note"
        draggable={false}
        style={{
          maxWidth: '85vw',
          maxHeight: '85vh',
          borderRadius: 8,
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: 'none',
          userSelect: 'none',
          pointerEvents: 'none',
          boxShadow: '0 8px 40px rgba(0,0,0,0.8)',
        }}
      />

      {/* Kontrol zoom */}
      <div style={{
        position: 'absolute', bottom: 32,
        display: 'flex', gap: 12, alignItems: 'center',
        background: 'rgba(0,0,0,0.6)',
        border: '1px solid rgba(200,184,154,0.2)',
        borderRadius: 40, padding: '8px 20px',
      }}>
        <button
          onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(200,184,154,0.1)',
            border: '1px solid rgba(200,184,154,0.3)',
            color: '#c8b89a', fontSize: 20, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >−</button>

        <span
          onClick={handleReset}
          style={{
            color: '#8a7a6a', fontSize: 11, letterSpacing: 2,
            cursor: 'pointer', fontFamily: "'Georgia', serif",
            minWidth: 48, textAlign: 'center',
          }}
        >
          {Math.round(scale * 100)}%
        </span>

        <button
          onClick={() => setScale((s) => Math.min(4, s + 0.2))}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(200,184,154,0.1)',
            border: '1px solid rgba(200,184,154,0.3)',
            color: '#c8b89a', fontSize: 20, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >+</button>
      </div>

      {/* Tombol tutup */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 20, right: 20,
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid rgba(200,184,154,0.3)',
          color: '#c8b89a', fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >✕</button>

      {/* Hint */}
      <div style={{
        position: 'absolute', top: 20, left: '50%',
        transform: 'translateX(-50%)',
        color: '#4a4a6a', fontSize: 10, letterSpacing: 2,
        fontFamily: 'sans-serif',
      }}>
        Scroll / Pinch untuk zoom • Drag untuk geser
      </div>
    </div>
  );
}