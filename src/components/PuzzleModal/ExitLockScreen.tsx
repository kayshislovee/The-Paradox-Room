import { useState, useRef, useCallback, useEffect } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────
interface NodeItem {
  id: number;
  collected: boolean;
  inSlot: boolean;
}

interface Props {
  collectedCount: number;
  totalNodes: number;
  onSolve: () => void;
  onClose: () => void;
}

// ── ASET LOKAL DUMMY (Ganti path-nya sesuai folder project kamu) ─────────────
const ASSETS = {
  // Phase 1: Scene
  bgScene: '/objects/maze/gerbang.jpg',
  interactObject: '/objects/maze/gembok1.png',
  
  // Phase 2: Unlock Menu
  bgUnlock: '/objects/maze/gerbang2.jpg',
  keyInventory: '/objects/maze/escapekey.png',
  lockClosed: '/objects/maze/gembok1.png',
  lockOpen: '/objects/maze/gembok2.png',
};

export function ExitLockScreen({ collectedCount, totalNodes, onSolve, onClose }: Props) {
  // ── State ──────────────────────────────────────────────────────────────────
  // 'scene' = Layar utama dengan objek yg bisa diklik | 'unlock' = Layar drag & drop kunci
  const [phase, setPhase] = useState<'scene' | 'unlock'>('scene'); 

  const [nodes, setNodes] = useState<NodeItem[]>(() =>
    Array.from({ length: totalNodes }, (_, i) => ({
      id: i,
      collected: i < collectedCount,
      inSlot: false,
    }))
  );

  const [lockUnlocked, setLockUnlocked] = useState(false);
  const [dragNodeId, setDragNodeId]     = useState<number | null>(null);
  const [dragPos, setDragPos]           = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging]     = useState(false);
  const [lockGlow, setLockGlow]         = useState(false);
  const [mounted, setMounted]           = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 30); }, []);

  const lockRef    = useRef<HTMLImageElement>(null); 
  const overlayRef = useRef<HTMLDivElement>(null);
  
  const inventoryNodes = nodes.filter(n => n.collected && !n.inSlot);

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const startDrag = useCallback((nodeId: number, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragNodeId(nodeId);
    setDragPos({ x: clientX, y: clientY });
    setIsDragging(true);
  }, []);

  const onMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragPos({ x: clientX, y: clientY });

    if (lockRef.current && phase === 'unlock') {
      const rect = lockRef.current.getBoundingClientRect();
      const over = clientX >= rect.left && clientX <= rect.right &&
                   clientY >= rect.top  && clientY <= rect.bottom;
      setLockGlow(over);
    }
  }, [isDragging, phase]);

  const onMouseUp = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || dragNodeId === null) return;
    const clientX = 'touches' in e ? (e as TouchEvent).changedTouches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as TouchEvent).changedTouches[0].clientY : (e as MouseEvent).clientY;

    if (lockRef.current && phase === 'unlock' && !lockUnlocked) {
      const rect = lockRef.current.getBoundingClientRect();
      const dropped = clientX >= rect.left && clientX <= rect.right &&
                      clientY >= rect.top  && clientY <= rect.bottom;
                      
      if (dropped) {
        // Berhasil dimasukkan (cukup 1 kunci langsung solve)
        setNodes(prev => prev.map(n => n.id === dragNodeId ? { ...n, inSlot: true } : n));
        setLockUnlocked(true);

        // Tunggu sebentar untuk animasi gembok terbuka, lalu trigger onSolve
        setTimeout(() => onSolve(), 1500); 
      }
    }

    setIsDragging(false);
    setDragNodeId(null);
    setLockGlow(false);
  }, [isDragging, dragNodeId, lockUnlocked, phase, onSolve]);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onMouseMove, { passive: false });
    window.addEventListener('touchend', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onMouseMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: mounted ? 1 : 0, transition: 'opacity 0.3s',
        userSelect: 'none',
      }}
    >
      <div style={{
        width: 890, maxWidth: '95vw', height: 480, maxHeight: '90vh',
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 0 40px rgba(0,0,0,0.8)',
        transform: mounted ? 'scale(1)' : 'scale(0.95)',
        transition: 'transform 0.3s',
      }}>
        
        {/* Tombol Close Global */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16, zIndex: 10,
            background: 'rgba(0,0,0,0.5)', color: 'white', border: '2px solid white',
            borderRadius: '50%', width: 36, height: 36, cursor: 'pointer',
            fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          ×
        </button>

        {/* ── PHASE 1: SCENE EKSPLORASI ── */}
        {phase === 'scene' && (
          <div style={{
            width: '100%', height: '100%',
            backgroundImage: `url(${ASSETS.bgScene})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            position: 'relative'
          }}>
            {/* Objek interaktif (Bisa digeser posisinya menggunakan top/left/right/bottom) */}
            <img 
              src={ASSETS.interactObject} 
              alt="Interactable Object"
              onClick={() => setPhase('unlock')}
              style={{
                position: 'absolute',
                top: '60%', left: '50.3%', // Atur koordinat letak objek di sini
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer',
                transition: 'transform 0.2s, filter 0.2s',
                width: 50,height: 70,
              }}
              onMouseEnter={(e) => e.currentTarget.style.filter = 'drop-shadow(0 0 10px white)'}
              onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
            />
          </div>
        )}

        {/* ── PHASE 2: MENU MASUKKAN KUNCI ── */}
        {phase === 'unlock' && (
          <div style={{
            width: '100%', height: '100%',
            backgroundImage: `url(${ASSETS.bgUnlock})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            display: 'flex',
          }}>
            
            {/* Tombol Back ke Scene */}
            <button
              onClick={() => setPhase('scene')}
              style={{
                position: 'absolute', top: 16, left: 16, zIndex: 10,
                background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none',
                padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontFamily: 'monospace'
              }}
            >
              ← KEMBALI
            </button>

            {/* Kiri: Inventory */}
            <div style={{
              width: 250, height: '100%',
              background: 'rgba(0, 0, 0, 0.6)', // Gelap transparan agar bg utama tetap terlihat
              backdropFilter: 'blur(4px)',
              padding: '80px 20px 20px',
              borderRight: '2px solid rgba(255,255,255,0.1)',
            }}>
              <h3 style={{ color: 'white', fontFamily: 'monospace', textAlign: 'center', marginBottom: 20 }}>
                INVENTORY KUNCI
              </h3>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
                {inventoryNodes.map((node) => (
                  <div key={node.id} style={{ position: 'relative' }}>
                    <img
                      src={ASSETS.keyInventory}
                      alt="Key"
                      style={{
                        width: 64, height: 64,
                        cursor: 'grab', objectFit: 'contain',
                        filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))'
                      }}
                      onMouseDown={(e) => startDrag(node.id, e)}
                      onTouchStart={(e) => startDrag(node.id, e)}
                      draggable={false}
                    />
                  </div>
                ))}

                {inventoryNodes.length === 0 && !lockUnlocked && (
                  <p style={{ color: '#aaa', textAlign: 'center', fontSize: 12, marginTop: 20 }}>
                    Kamu belum memiliki kunci.
                  </p>
                )}
              </div>
            </div>

            {/* Tengah: Gembok */}
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
            }}>
              <img
                ref={lockRef}
                src={lockUnlocked ? ASSETS.lockOpen : ASSETS.lockClosed}
                alt="Lock"
                draggable={false}
                style={{
                  width: 200, height: 200, objectFit: 'contain',
                  filter: lockGlow && !lockUnlocked 
                    ? 'drop-shadow(0 0 20px #facc15)' 
                    : lockUnlocked 
                      ? 'drop-shadow(0 0 30px #48bb78)' 
                      : 'drop-shadow(0 10px 15px rgba(0,0,0,0.8))',
                  transform: lockUnlocked ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
              />
              
              {/* Notifikasi Teks di Bawah Gembok */}
              <div style={{
                position: 'absolute', bottom: 40,
                color: lockUnlocked ? '#48bb78' : 'white',
                fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                background: 'rgba(0,0,0,0.5)', padding: '8px 16px', borderRadius: 20
              }}>
                {lockUnlocked ? 'KUNCI TERBUKA!' : 'Seret kunci ke gembok'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── DRAG GHOST (Gambar kunci yang mengikuti kursor saat di-drag) ── */}
      {isDragging && dragNodeId !== null && (
        <img
          src={ASSETS.keyInventory}
          alt="Dragging Key"
          style={{
            position: 'fixed',
            left: dragPos.x,
            top: dragPos.y,
            transform: 'translate(-50%, -50%)',
            width: 72, height: 72,
            pointerEvents: 'none',
            zIndex: 999999,
            filter: lockGlow ? 'drop-shadow(0 0 15px #facc15)' : 'drop-shadow(0 10px 15px rgba(0,0,0,0.5))',
            transition: 'filter 0.15s',
          }}
        />
      )}
    </div>
  );
}