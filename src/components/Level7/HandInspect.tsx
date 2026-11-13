import { useState, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';

export function HandInspect() {
  const setHandInspectOpen = useGameStore((s) => s.setHandInspectOpen);
  const setUvFlashlightActive = useGameStore((s) => s.setUvFlashlightActive);
  const setDesktopOpen = useGameStore((s) => s.setDesktopOpen);
  const FLASHLIGHT_RADIUS = 100;
const [clientPos, setClientPos] = useState({ x: 0, y: 0 });
const handRef = useRef<HTMLDivElement>(null);
const [handMousePos, setHandMousePos] = useState({ x: 0, y: 0 });

  const handleClose = () => {
    setHandInspectOpen(false);
    setUvFlashlightActive(false);
  };

const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
  // Untuk glow ring — relatif ke viewport
  setClientPos({ x: e.clientX, y: e.clientY });

  // Untuk UV mask — relatif ke div gambar tangan
  if (handRef.current) {
    const rect = handRef.current.getBoundingClientRect();
    setHandMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }
};

  return (
    <div
      onMouseMove={handleMouseMove}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.92)',
        zIndex: 9998,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'crosshair',
      }}
    >
      {/* Gambar tangan */}
      <div
        ref={handRef}
        style={{ position: 'relative', width: '40vw' }}
      >
        {/* Base image tangan normal */}
        <img
          src="/avatars/hand1.png"
          style={{ width: '100%', display: 'block', borderRadius: 8 }}
          alt="hand"
          draggable={false}
        />

        {/* UV image — muncul via mask flashlight */}
        <img
          src="/avatars/hand2.png"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            borderRadius: 8,
// UV mask pakai handMousePos:
WebkitMaskImage: `radial-gradient(circle ${FLASHLIGHT_RADIUS}px at ${handMousePos.x}px ${handMousePos.y}px, black 0%, black 50%, transparent 100%)`,
maskImage: `radial-gradient(circle ${FLASHLIGHT_RADIUS}px at ${handMousePos.x}px ${handMousePos.y}px, black 0%, black 50%, transparent 100%)`,
            pointerEvents: 'none',
          }}
          alt="hand uv"
          draggable={false}
        />

        {/* Glow ring — ikut posisi mouse */}
        <div style={{
  position: 'fixed',
  left: clientPos.x - FLASHLIGHT_RADIUS,
  top: clientPos.y - FLASHLIGHT_RADIUS,
  width: FLASHLIGHT_RADIUS * 2,
  height: FLASHLIGHT_RADIUS * 2,
  borderRadius: '50%',
  border: '2px solid rgba(179,0,255,0.4)',
  boxShadow: '0 0 20px rgba(179,0,255,0.15)',
  pointerEvents: 'none',
  zIndex: 9999,
}} />
      </div>

      {/* Tombol kembali ke desktop */}
      <button
        onClick={() => {
          setHandInspectOpen(false);
          setUvFlashlightActive(false);
          setDesktopOpen(true);
        }}
        style={{
          position: 'absolute', top: 20, left: 20,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8, color: 'rgba(255,255,255,0.7)',
          fontSize: 12, padding: '6px 14px',
          cursor: 'pointer', fontFamily: 'inherit',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.14)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
        }}
      >
        ← Kembali ke Desktop
      </button>

      {/* Tombol tutup */}
      <button
        onClick={handleClose}
        style={{
          position: 'absolute', top: 20, right: 20,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8, color: 'rgba(255,255,255,0.7)',
          fontSize: 12, padding: '6px 14px',
          cursor: 'pointer', fontFamily: 'inherit',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.15)';
          (e.currentTarget as HTMLElement).style.color = '#f87171';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
          (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)';
        }}
      >
        ✕ Tutup
      </button>

      {/* Hint */}
      <div style={{
        position: 'absolute', bottom: 24,
        fontSize: 11, color: 'rgba(179,0,255,0.5)',
        letterSpacing: 2, fontFamily: 'Courier New',
        pointerEvents: 'none',
        animation: 'pulse 2s ease infinite',
      }} >
        🔦 UV FLASHLIGHT ACTIVE — gerakkan mouse untuk scan
      </div>

      <style>{`
        @keyframes pulse {
          0%,100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}