import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { MetalButton } from '../UI/MetalButton';
import { playMusic } from '../../hooks/useMusic';
import { HintToken } from '../HintToken/HintToken';
import { useHintRefill } from '../../hooks/useHintRefill';

type Phase = 'splash' | 'transitioning' | 'menu';

export function Splash() {
  const goTo = useGameStore((s) => s.goTo);
  const loadLevels = useGameStore((s) => s.loadLevels);
  const loadHintConfig = useGameStore((s) => s.loadHintConfig);
  const loadMyProgress = useGameStore((s) => s.loadMyProgress);
  
  const [phase, setPhase] = useState<Phase>('splash');
  const [pressVisible, setPressVisible] = useState(false);
  useHintRefill();

  // Fetch data dari API saat komponen mount
  useEffect(() => {
    loadLevels();
    loadHintConfig();
    loadMyProgress();
  }, []);

  // Mulai musik saat pertama kali ada interaksi
  useEffect(() => {
    const startMusic = () => {
      playMusic('/audio/menu_music.mp3', 0.7);
      window.removeEventListener('click', startMusic);
      window.removeEventListener('keydown', startMusic);
      window.removeEventListener('touchstart', startMusic);
    };

    window.addEventListener('click', startMusic);
    window.addEventListener('keydown', startMusic);
    window.addEventListener('touchstart', startMusic);

    return () => {
      window.removeEventListener('click', startMusic);
      window.removeEventListener('keydown', startMusic);
      window.removeEventListener('touchstart', startMusic);
    };
  }, []);

  // Animasi Press any button
  useEffect(() => {
    const t1 = setTimeout(() => setPressVisible(true), 1000);
    return () => clearTimeout(t1);
  }, []);

  const handlePress = () => {
    if (phase !== 'splash') return;
    playMusic('/audio/menu_music.mp3', 0.7);
    setPhase('transitioning');
    setPressVisible(false);
    setTimeout(() => {
      setPhase('menu');
    }, 100); // Mempercepat transisi panel masuk
  };

  useEffect(() => {
    window.addEventListener('keydown', handlePress);
    return () => window.removeEventListener('keydown', handlePress);
  }, [phase]);

  const isMenu = phase === 'menu' || phase === 'transitioning';

  return (
    <div
      onClick={handlePress}
      style={{
        width: '100%', height: '100%',
        // GANTI DENGAN ASSET BACKGROUND UTAMA ANDA
        background: 'url(/backgrounds/bg2.png) center/cover no-repeat', 
        display: 'flex',
        cursor: phase === 'splash' ? 'pointer' : 'default',
        position: 'relative', overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Overlay Gelap saat masih di phase splash */}
      <div style={{
        position: 'absolute', inset: 0,
        background: isMenu ? 'transparent' : 'rgba(0,0,0,0.6)',
        transition: 'background 1s ease',
        zIndex: 0,
      }} />

      {/* Press any button - Tengah Layar */}
      {phase === 'splash' && (
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'IM Fell English SC', 'Georgia', serif",
          fontSize: 24, color: '#e8d5b7', letterSpacing: 4,
          opacity: pressVisible ? 1 : 0,
          transition: 'opacity 0.4s ease',
          animation: pressVisible ? 'pressGlow 2s ease-in-out infinite' : 'none',
          textShadow: '0 0 10px rgba(200,184,154,0.5)',
          pointerEvents: 'none',
          zIndex: 1,
        }}>
          press any button to enter
        </div>
      )}

      {/* Panel Kanan (Kertas Perkamen) */}
      <div style={{
        position: 'absolute',
        right: 0, top: 0, bottom: 0,
        width: '42%', minWidth: '450px',
        // GANTI DENGAN ASSET KERTAS PERKAMEN ANDA
        background: 'url(/backgrounds/parchment_panel.png) left center/100% 100% no-repeat',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '8vh',
        transform: isMenu ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
        zIndex: 2,
        boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
      }}>
        
        {/* Kontainer Judul */}
        <div style={{
          textAlign: 'center',
          marginBottom: '6vh',
          opacity: isMenu ? 1 : 0,
          transform: isMenu ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'opacity 1s ease 0.5s, transform 1s ease 0.5s',
        }}>
          <div style={{
            fontFamily: "'IM Fell English SC', 'Georgia', serif",
            fontSize: 28, color: '#2b2b2b', letterSpacing: 4,
            marginBottom: -10,
          }}>
            THE
          </div>
          <div style={{
            fontFamily: "'Cinzel Decorative', 'Georgia', serif",
            fontSize: 64, color: '#1a1a1a', fontWeight: 700,
            letterSpacing: 2, lineHeight: 1,
            textShadow: '1px 1px 2px rgba(255,255,255,0.3)',
          }}>
            PARADOX
          </div>
          <div style={{
            fontFamily: "'IM Fell English SC', 'Georgia', serif",
            fontSize: 40, color: '#2b2b2b', letterSpacing: 6,
            marginTop: -5,
          }}>
            ROOM
          </div>
          {/* Ornamen Garis Bawah Judul */}
          <img src="/ui/title_ornament.png" alt="" style={{ width: '80%', marginTop: '10px' }} />
        </div>

        {/* Kontainer Tombol Menu */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          gap: 20, width: '70%', alignItems: 'flex-start',
          opacity: isMenu ? 1 : 0,
          transform: isMenu ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 1s ease 0.7s, transform 1s ease 0.7s',
          pointerEvents: isMenu ? 'auto' : 'none',
        }}>
          {/* Catatan: Anda mungkin perlu memodifikasi komponen <MetalButton> 
              agar mendukung penempatan ikon di sebelah kiri teks dan background transparan 
              sesuai dengan referensi gambar. */}
          <MetalButton onClick={(e) => { e.stopPropagation(); goTo('level_select'); }} label="New Game" />
          <MetalButton onClick={(e) => { e.stopPropagation(); goTo('achievements'); }} label="Continue" />
          <MetalButton onClick={(e) => { e.stopPropagation(); goTo('settings'); }} label="Settings" />
          <MetalButton onClick={(e) => { e.stopPropagation(); window.close(); }} label="Quit" />
        </div>

        {/* Hint Token */}
        {isMenu && (
          <div style={{
            position: 'absolute',
            bottom: '5%',
            right: '10%',
            zIndex: 1,
            opacity: isMenu ? 1 : 0,
            transition: 'opacity 1s ease 1s',
          }}>
            <HintToken />
          </div>
        )}
      </div>

      <style>{`
        @keyframes pressGlow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}