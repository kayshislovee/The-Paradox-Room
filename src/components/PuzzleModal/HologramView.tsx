import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';

interface Props {
  onClose: () => void;
  onFixGlitch: () => void;
  onFixFake: () => void;
  

}

// ─── Object reactor di atas bg hologram ──────────────────────────────────────
const REACTOR_OBJECTS = [
  
  {
    id: 'reactor',
    normalImage: '/objects/active3.png',
    errorImage:  '/objects/error3.png',
    fakeImage:   '/objects/fake3.png',
    completedImage: '/objects/complete3.png', // ← tambah

    x: 16, y: 64, width: 20, height: 30, // % posisi di bg
  },
  {
    id: 'cooling',
    normalImage: '/objects/active2.png',
    errorImage:  '/objects/error2.png',
    fakeImage:   '/objects/fake2.png',
    completedImage: '/objects/complete2.png', // ← tambah
     x: 41, y: 69, width: 20, height: 30,
  },
  {
    id: 'power',
    normalImage: '/objects/active1.png',
    errorImage:  '/objects/error1.png',
    fakeImage:   '/objects/fake1.png',
    completedImage: '/objects/complete1.png', // ← tambah
   x: 67, y: 64, width: 20, height: 30,
  },
];

export function HologramView({ onClose, onFixGlitch, onFixFake }: Props) {
  const activeCharacter     = useGameStore(s => s.activeCharacter);
  const char3Inventory      = useGameStore(s => (s as any).char3Inventory ?? []);
  const glitchedReactors    = useGameStore(s => s.glitchedReactors);
  const fakeReactors        = useGameStore(s => s.fakeReactors);
  const reactorGlitchActive = glitchedReactors.length > 0;
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const solvedPuzzles = useGameStore(s => s.solvedPuzzles);

  const handleClose = () => {
    if (closing) return;
    setClosing(true);

    setTimeout(() => {
      onClose();
    }, 650);
  };

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  const hasUpgraded = char3Inventory.some((i: any) => i.id === 'hacking_device_upgraded');

  const handleClickReactor = (id: string) => {
    const isThisFake = fakeReactors.includes(id);
    const isThisGlitched = glitchedReactors.includes(id);

  if (!isThisFake && !isThisGlitched) return;

  if (activeCharacter !== 'char3') {
    useGameStore.getState().showNotification('Hanya Katsuragi yang bisa memperbaiki!', 'error');
    return;
  }
  if (!hasUpgraded) {
    useGameStore.getState().showNotification('Butuh Hacking Device+ untuk memperbaiki!', 'error');
    return;
  }

  if (isThisGlitched) {
    useGameStore.getState().setFixingReactorId(id);
    onFixGlitch();
  } else if (isThisFake) {
    useGameStore.getState().setFixingFakeReactorId(id);
    onFixFake();
  }
};

  const bg = reactorGlitchActive
    ? '/backgrounds/hologram.jpg'
    : '/backgrounds/hologram.jpg';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
      onClick={handleClose}
    >
      {/* 
        WRAPPER UTAMA: 
        Menampung kontainer layar hologram & gambar di luarnya 
      */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '60vw', maxWidth: 1000,
          bottom: '12.3%',
          // Animasi scale diletakkan di pembungkus luar ini
          transform: mounted ? 'scale(1)' : 'scale(0.96)',
          transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        
        {/* INNER CONTAINER (Layar Hologram) */}
        <div 
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16/9',
            borderRadius: 10,
            overflow: 'hidden', // Menyembunyikan elemen yang keluar dari kotak hologram
            transformOrigin: 'bottom center', // Titik awal muncul dari tengah bawah (lokasi jam)
   transform: (mounted && !closing) ? 'scale(1) translateY(0)' : 'scale(0) translateY(100px)',
    opacity: (mounted && !closing) ? 1 : 0,
    transition: closing
      ? 'transform 0.35s cubic-bezier(0.4, 0, 1, 1), opacity 0.25s ease' // Langsung mengecil
      : 'transform 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease',
          }}
        >
          {/* BG Hologram */}
          <img
            src={bg}
            alt="hologram"
            draggable={false}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              transition: 'opacity 0.4s ease',
            }}
          />

          {/* Object reactor */}
        {REACTOR_OBJECTS.map(obj => {
          const isGlitched = glitchedReactors.includes(obj.id);
          const isSolved = solvedPuzzles.some((p: string) => p.includes(obj.id));
          const isFake = fakeReactors.includes(obj.id);
          // Prioritas: glitch > fake info > selesai > normal.
          // Fake info wajib lebih dulu dari "selesai" supaya reactor yang
          // sudah solved tapi kena fake info tetap bisa diklik Katsuragi
          // untuk spot-diff.
          const src = isGlitched
            ? obj.errorImage
            : isFake
              ? obj.fakeImage
              : isSolved
                ? obj.completedImage
                : obj.normalImage;

          return (
            <div
              key={obj.id}
              onClick={() => handleClickReactor(obj.id)}
              onMouseEnter={() => setHoveredId(obj.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                position: 'absolute',
                left: `${obj.x}%`,
                top: `${obj.y}%`,
                width: `${obj.width}%`,
                height: `${obj.height}%`,
                cursor: isGlitched || isFake ? 'pointer' : isSolved ? 'default' : 'default',
                transition: 'transform 0.25s ease',
                transform: hoveredId === obj.id ? 'scale(1.08)' : 'scale(1)',
              }}
            >
              <img
                src={src}
                alt={obj.id}
                draggable={false}
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'contain',
                  transition: 'filter 0.25s ease',
                  filter: hoveredId === obj.id
                    ? isGlitched
                      ? 'drop-shadow(0 0 18px rgba(239,68,68,1)) brightness(1.3)'
                      : isFake
                        ? 'drop-shadow(0 0 18px rgba(234,179,8,1)) brightness(1.3)'
                        : isSolved
                          ? 'drop-shadow(0 0 18px rgba(52,211,153,1)) brightness(1.3)'
                          : 'drop-shadow(0 0 18px rgba(0,200,255,0.9)) brightness(1.3)'
                    : isGlitched
                      ? 'drop-shadow(0 0 8px rgba(239,68,68,0.6))'
                      : isFake
                        ? 'drop-shadow(0 0 8px rgba(234,179,8,0.6))'
                        : isSolved
                          ? 'drop-shadow(0 0 8px rgba(52,211,153,0.6))'
                          : 'none',
                }}
              />
            </div>
          );
        })}

          {/* Tombol close */}
          <button
            onClick={handleClose}
            style={{
              position: 'absolute', top: 14, right: 14,
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 6, color: 'rgba(255,255,255,0.7)',
              fontFamily: 'monospace', fontSize: 11,
              padding: '6px 14px', cursor: 'pointer',
              letterSpacing: 1,
              transition: 'all 0.2s',
              zIndex: 10,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            }}
          >
            CLOSE [X]
          </button>

          {/* Hint saat glitch */}
          {reactorGlitchActive && (
            <div style={{
              position: 'absolute', bottom: 16, left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: 6, padding: '6px 16px',
              fontFamily: 'monospace', fontSize: 10,
              color: '#fca5a5', letterSpacing: 1.5,
              animation: 'blink 1.2s step-end infinite',
              whiteSpace: 'nowrap',
              zIndex: 10,
            }}>
              ⚠ KLIK REACTOR YANG ERROR UNTUK PERBAIKI
            </div>
          )}
        </div>

        {/* 
          GAMBAR CUSTOM DI LUAR & BAWAH HOLOGRAM
          (Ini akan muncul persis di area lingkaran hijau pada image_ac9ae4.jpg)
        */}
        <img
          src="/objects/jam.png" /* TODO: GANTI DENGAN PATH GAMBAR KAMU */
          alt="custom bottom element"
          draggable={false}
          style={{
            position: 'absolute',
            top: '93%',         // Mendorong gambar ini persis di batas bawah layar hologram
            left: -280,
            width: '118%',       // Lebarnya sama persis dengan layar hologram
            marginTop: '10px',   // Opsional: Berikan sedikit jarak (gap) dari layar hologram ke gambar. Ubah jadi 0 jika ingin menempel.
            pointerEvents: 'none', 
            opacity: (mounted && !closing) ? 1 : 0,
      transform: (mounted && !closing) ? 'translateY(0)' : 'translateY(40px)',
      transition: closing
        ? 'opacity 0.3s ease 0.35s, transform 0.3s ease 0.35s'
        : 'opacity 0.3s ease, transform 0.3s ease',
            // height: '150px',  // Opsional: Anda bisa mengatur spesifik tingginya di sini jika gambar terlalu besar/kecil
            // objectFit: 'contain'
          }}
        />

      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}