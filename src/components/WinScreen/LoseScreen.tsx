import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { LEVELS } from '../../data/levels';
import { useSFX } from '../../hooks/useSFX';
import { MetalButton } from '../UI/MetalButton';

interface Props {
  // onStartLevel opsional, jika tidak ada akan pakai startLevel dari store
  onStartLevel?: (levelId: string) => void;
}

export function LoseScreen({ onStartLevel }: Props) {
  const sfx = useSFX();
  const { currentLevelId, startLevel, goTo } = useGameStore();

  const [showContent, setShowContent] = useState(false);
  const [flashVisible, setFlashVisible] = useState(true);

  // Ambil data level untuk menampilkan judul
  const storeLevel = useGameStore((s) => s.levels.find((l) => l.id === currentLevelId));
  const localLevel = LEVELS.find((l) => l.id === currentLevelId);
  const level = storeLevel ?? localLevel;

  useEffect(() => {
    // Efek flash putih saat transisi masuk (seamless)
    const tFlash = setTimeout(() => setFlashVisible(false), 50);

    // Mainkan suara kalah dan munculkan konten setelah delay singkat
    const t0 = setTimeout(() => {
      setShowContent(true);
      sfx.playLose(); // Pastikan hook useSFX memiliki fungsi ini
    }, 150);

    // Cleanup timeout saat komponen di-unmount
    return () => {
      clearTimeout(tFlash);
      clearTimeout(t0);
    };
  }, [sfx]);

  const handleRetry = () => {
    if (!currentLevelId) return;
    if (onStartLevel) {
      onStartLevel(currentLevelId);
    } else {
      startLevel(currentLevelId);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'url(/backgrounds/splash_bg.png) center/cover no-repeat',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Georgia', serif", 
      zIndex: 9999,
    }}>
      {/* White flash overlay */}
      <div style={{
        position: 'fixed', inset: 0,
        background: '#ffffff',
        opacity: flashVisible ? 1 : 0,
        transition: 'opacity 0.5s ease-out',
        pointerEvents: 'none',
        zIndex: 10000,
      }} />

      {/* Overlay Gelap Kemerahan (Lebih elegan, deep dark red) */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(15, 5, 5, 0.90)', 
        backdropFilter: 'blur(4px)', // Memberikan efek blur pada background jika didukung browser
      }} />

      {/* Card Utama */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: 380,
        // Gradient gelap yang lebih subtle dan modern
        background: 'linear-gradient(180deg, rgba(35, 15, 15, 0.95), rgba(15, 5, 5, 0.98))',
        border: '1px solid rgba(185, 28, 28, 0.3)', // Merah gelap/crimson
        borderRadius: 12,
        padding: '40px 32px 32px', 
        boxShadow: '0 24px 64px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.02)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        
        opacity: showContent ? 1 : 0,
        transform: showContent ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.98)',
        transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>

        {/* Dekorasi sudut (Lebih tipis dan presisi) */}
        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
          <div key={pos} style={{
            position: 'absolute',
            top: pos.includes('top') ? 12 : undefined,
            bottom: pos.includes('bottom') ? 12 : undefined,
            left: pos.includes('left') ? 12 : undefined,
            right: pos.includes('right') ? 12 : undefined,
            width: 12, height: 12,
            borderTop: pos.includes('top') ? '1px solid rgba(185, 28, 28, 0.4)' : undefined,
            borderBottom: pos.includes('bottom') ? '1px solid rgba(185, 28, 28, 0.4)' : undefined,
            borderLeft: pos.includes('left') ? '1px solid rgba(185, 28, 28, 0.4)' : undefined,
            borderRight: pos.includes('right') ? '1px solid rgba(185, 28, 28, 0.4)' : undefined,
          }} />
        ))}

        {/* --- KONTEN KEKALAHAN --- */}

        {/* Ikon Jam / Waktu Habis (SVG Minimalis) */}
        <div style={{ 
          marginBottom: 24, 
          animation: 'floatIcon 3s ease-in-out infinite',
          filter: 'drop-shadow(0 4px 12px rgba(185, 28, 28, 0.5))'
        }}>
          {/* Jika ingin pakai PNG: <img src="/icons/time-out.png" alt="Time Out" width={64} height={64} /> */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="64" height="64" 
            viewBox="0 0 24 24" fill="none" 
            stroke="#ef4444" strokeWidth="1.5" 
            strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
            <line x1="12" y1="2" x2="12" y2="4" />
          </svg>
        </div>

        {/* Judul Besar: WAKTU HABIS */}
        <div style={{
          color: '#ef4444', 
          fontSize: 32,
          fontWeight: 700,
          letterSpacing: 6,
          textTransform: 'uppercase',
          textShadow: '0 2px 4px rgba(0,0,0,0.8)', // Shadow tegas, bukan glow menyebar
          marginBottom: 12,
          textAlign: 'center',
          lineHeight: 1.2,
        }}>
          Waktu Habis
        </div>

        {/* Pesan Deskriptif */}
        <p style={{
          color: '#d1d5db', // Soft light gray (bukan pink, agar lebih netral/elegan)
          fontSize: 14,
          fontFamily: "'Inter', 'Segoe UI', sans-serif", // Sans-serif modern
          lineHeight: 1.6,
          textAlign: 'center',
          marginBottom: 32,
          padding: '0 8px',
        }}>
          Kamu gagal melarikan diri dari <strong style={{ color: '#ffffff', fontWeight: 600 }}>{level?.title ?? 'Level'}</strong>. Waktu tidak berpihak padamu kali ini.
        </p>

        {/* Divider (Lebih tipis dan elegan) */}
        <div style={{
          width: '80%', height: 1, marginBottom: 24,
          background: 'linear-gradient(90deg, transparent, rgba(185, 28, 28, 0.4), transparent)',
        }} />

        {/* --- TOMBOL AKSI --- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
          {/* Tombol Coba Lagi */}
          <MetalButton
            onClick={(e) => { e.stopPropagation(); handleRetry(); }}
            label="COBA LAGI"
            danger={true}
          />

          {/* Tombol Navigasi Lain (Kecil & Berdampingan) */}
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            <div style={{ flex: 1 }}>
              <MetalButton
                onClick={(e) => { e.stopPropagation(); goTo('level_select'); }}
                label="PILIH LEVEL"
                small
              />
            </div>
            <div style={{ flex: 1 }}>
              <MetalButton
                onClick={(e) => { e.stopPropagation(); goTo('splash'); }}
                label="MENU UTAMA"
                small
              />
            </div>
          </div>
        </div>
      </div>

      {/* Keyframes untuk animasi mengambang yang halus */}
      <style>{`
        @keyframes floatIcon {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}