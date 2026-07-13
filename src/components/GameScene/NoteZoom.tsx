import { useEffect, useState } from 'react';

interface Props {
  image: string;
  onClose: () => void;
}

export function NoteZoom({ image, onClose }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 250);
  };

  return (
   <div
  onClick={handleClose}
  style={{
    position: 'fixed', inset: 0,
    background: 'rgba(0, 0, 0, 0.27)',  // ← perbesar opacity ini
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(8px)',  // ← perbesar blur ini
  }}
>
      <img
        src={image}
        alt="note"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '60vw',
          maxHeight: '75vh',
          borderRadius: 8,
          border:'none',
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0)',
          transform: visible ? 'scale(1)' : 'scale(0.3)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.25s',
        }}
      />

      <button
        onClick={handleClose}
        style={{
          position: 'absolute', top: 20, right: 20,
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.3)',
          color: '#fff', borderRadius: 8,
          padding: '8px 16px', cursor: 'pointer', fontSize: 14,
        }}
      >
        ✕ Tutup
      </button>
    </div>
  );
}