import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { MetalButton } from '../UI/MetalButton';
import { playMusic } from '../../hooks/useMusic';

type Phase = 'splash' | 'transitioning' | 'menu';

export function Splash() {
  const goTo = useGameStore((s) => s.goTo);
  const [phase, setPhase] = useState<Phase>('splash');
  const [titleVisible, setTitleVisible] = useState(false);
  const [subVisible, setSubVisible] = useState(false);
  const [pressVisible, setPressVisible] = useState(false);
  const [buttonsVisible, setButtonsVisible] = useState(false);

  // Mulai musik saat pertama kali ada interaksi
  useEffect(() => {
    const startMusic = () => {
      playMusic('/audio/menu_music.mp3', 0.7);                      //niwoiigh
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

  // Animasi judul muncul
  useEffect(() => {
    const t1 = setTimeout(() => setTitleVisible(true), 500);
    const t2 = setTimeout(() => setSubVisible(true), 1200);
    const t3 = setTimeout(() => setPressVisible(true), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const handlePress = () => {
    if (phase !== 'splash') return;
    playMusic('/audio/menu_music.mp3', 0.7);
    setPhase('transitioning');
    setPressVisible(false);
    setTimeout(() => {
      setPhase('menu');
      setButtonsVisible(true);
    }, 800);
  };

  useEffect(() => {
    window.addEventListener('keydown', handlePress);
    return () => window.removeEventListener('keydown', handlePress);
  }, [phase]);

  const isMenu = phase === 'menu';
  const isTransitioning = phase === 'transitioning';

  return (
    <div
      onClick={handlePress}
      style={{
        width: '100%', height: '100%',
        background: 'url(/backgrounds/splash_bg.png) center/cover no-repeat',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: phase === 'splash' ? 'pointer' : 'default',
        position: 'relative', overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.4)', zIndex: 0,
      }} />

      {/* Judul */}
      <div style={{
        zIndex: 1, textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        transform: isMenu || isTransitioning ? 'translateY(-120px)' : 'translateY(0)',
        transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>

        {/* "the" */}
        <div style={{
          fontFamily: "'Georgia', serif",
          fontSize: 32, color: '#c8b89a', letterSpacing: 6,
          opacity: titleVisible ? 1 : 0,
          transform: titleVisible ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'opacity 1s ease, transform 1s ease',
          marginBottom: 4,
          textShadow: '0 2px 12px rgba(0,0,0,0.8)',
        }}>
          THE
        </div>

        {/* Judul utama */}
        <div style={{
          fontFamily: "'Georgia', serif",
          fontSize: 88, color: '#e8d5b7', fontWeight: 700,
          letterSpacing: 4, lineHeight: 1,
          opacity: titleVisible ? 1 : 0,
          transform: titleVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
          transition: 'opacity 1.2s ease, transform 1.2s ease',
          textShadow: '0 4px 30px rgba(0,0,0,0.9), 0 0 60px rgba(200,160,100,0.2)',
        }}>
          PARADOX
        </div>

        {/* Subjudul */}
        <div style={{
          fontFamily: "'Georgia', serif",
          fontSize: 48, color: '#c8b89a', letterSpacing: 8,
          opacity: subVisible ? 1 : 0,
          transform: subVisible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 1s ease, transform 1s ease',
          textShadow: '0 2px 12px rgba(0,0,0,0.8)',
          marginTop: 4,
        }}>
          ROOM
        </div>

        {/* Garis dekoratif */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 12, marginTop: 20,
          opacity: subVisible ? 1 : 0,
          transition: 'opacity 1s ease 0.3s',
        }}>
          <div style={{ width: 80, height: 1, background: '#c8b89a', opacity: 0.5 }} />
          <div style={{
            width: 8, height: 8,
            border: '1.5px solid #c8b89a',
            transform: 'rotate(45deg)', opacity: 0.7,
          }} />
          <div style={{ width: 80, height: 1, background: '#c8b89a', opacity: 0.5 }} />
        </div>

        {/* Press any button */}
        {phase === 'splash' && (
          <div style={{
            fontFamily: "'Georgia', serif",
            fontSize: 16, color: '#c8b89a', letterSpacing: 4,
            marginTop: 32,
            opacity: pressVisible ? 1 : 0,
            transition: 'opacity 0.4s ease',
            animation: pressVisible ? 'pressGlow 2s ease-in-out infinite' : 'none',
            textShadow: '0 0 10px rgba(200,184,154,0.5)',
            pointerEvents: 'none',
          }}>
            press any button
          </div>
        )}
      </div>

      {/* Tombol menu */}
      <div style={{
        zIndex: 1,
        position: 'absolute',
        bottom: '22%',
        display: 'flex', flexDirection: 'column',
        gap: 14, width: 320,
        opacity: buttonsVisible ? 1 : 0,
        transform: buttonsVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s',
        pointerEvents: buttonsVisible ? 'auto' : 'none',
      }}>
        <MetalButton onClick={(e) => { e.stopPropagation(); goTo('level_select'); }} label="START" />
        <MetalButton onClick={(e) => { e.stopPropagation(); goTo('settings'); }} label="OPTIONS" />
        <MetalButton onClick={(e) => { e.stopPropagation(); window.close(); }} label="QUIT" />
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