import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { MetalButton } from '../UI/MetalButton';
import { playMusic } from '../../hooks/useMusic';
import { HintToken } from '../HintToken/HintToken';
import { useHintRefill } from '../../hooks/useHintRefill';
import { SplashTransition } from '../UI/SplashTransition';
import { useSFX } from '../../hooks/useSFX';

type Phase = 'splash' | 'transitioning' | 'menu';

export function Splash() {
  const goTo = useGameStore((s) => s.goTo);
  const loadLevels = useGameStore((s) => s.loadLevels);
  const loadHintConfig = useGameStore((s) => s.loadHintConfig);
  const loadMyProgress = useGameStore((s) => s.loadMyProgress);

  const [phase, setPhase] = useState<Phase>('splash');
  const [pressVisible, setPressVisible] = useState(false);

  const { playNewGame } = useSFX();

  const [bgImage, setBgImage] = useState('/backgrounds/bg2.png');

  const [showTransition, setShowTransition] = useState(false);
  const [pendingNav, setPendingNav] = useState<(() => void) | null>(null);

  useHintRefill();

  useEffect(() => {
    loadLevels();
    loadHintConfig();
    loadMyProgress();
  }, []);

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

  useEffect(() => {
    const t1 = setTimeout(() => setPressVisible(true), 1000);

    return () => clearTimeout(t1);
  }, []);

  const triggerAnimatedNav = (action: () => void) => {
    setBgImage('/backgrounds/bg3.png');
    setPendingNav(() => action);
    setShowTransition(true);
  };

  const handlePress = () => {
    if (phase !== 'splash') return;

    playMusic('/audio/menu_music.mp3', 0.7);

    setPhase('transitioning');
    setPressVisible(false);

    setTimeout(() => {
      setPhase('menu');
    }, 150);
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
        width: '100%',
        height: '100%',
        backgroundColor: '#0d0015',
        background: `url(${bgImage}) center/cover no-repeat`,
        transition: 'background 1.5s ease',
        display: 'flex',
        cursor: phase === 'splash' ? 'pointer' : 'default',
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Dark overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, transparent 10%, rgba(0,0,0,0.7) 100%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: isMenu
            ? 'transparent'
            : 'rgba(0,0,0,0.4)',
          backdropFilter: isMenu ? 'blur(0px)' : 'blur(3px)',
          transition:
            'background 1.2s ease, backdrop-filter 1.2s ease',
          zIndex: 0,
        }}
      />

      {/* PRESS ANY BUTTON */}
      {phase === 'splash' && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'IM Fell English SC', 'Georgia', serif",
            fontSize: '2rem',
            color: '#e8d5b7',
            letterSpacing: 8,
            opacity: pressVisible ? 1 : 0,
            transition: 'opacity 0.5s ease',
            animation: pressVisible
              ? 'pressGlow 3s ease-in-out infinite'
              : 'none',
            textShadow:
              '0 0 20px rgba(232,213,183,0.4), 0 0 40px rgba(0,0,0,0.8)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          PRESS ANY BUTTON TO ENTER
        </div>
      )}

      {/* RIGHT MENU PANEL */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,

          width: '42%',
          height: '100%',

          background: 'linear-gradient(270deg, rgba(10,10,15,0.85) 0%, rgba(10,10,15,0.4) 70%, transparent 100%)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',

          borderLeft: '1px solid rgba(255,255,255,0.06)',

          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',

          paddingTop: '4vh',
          paddingBottom: '4vh',

          transform: isMenu
            ? 'translateX(0)'
            : 'translateX(100%)',

          transition:
            'transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)',

          zIndex: 2,

          boxShadow: '-20px 0 60px rgba(0,0,0,0.8)',
        }}
      >
        {/* TITLE */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '6vh',

            opacity: isMenu ? 1 : 0,

            transform: isMenu
              ? 'translateY(0)'
              : 'translateY(-40px)',

            transition:
              'opacity 1.2s ease 0.3s, transform 1.2s ease 0.3s',
          }}
        >
          <div
            style={{
              fontFamily: "'Eczar', 'Georgia', serif",
              fontSize: '2rem',
              color: 'rgba(236,231,231,0.7)',
              letterSpacing: 6,
              marginBottom: -8,
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            }}
          >
            The
          </div>

          <div
            style={{
              fontFamily: "'Eczar', 'Cinzel Decorative', serif",
              fontSize: '5rem',
              color: '#ece7e7f5',
              fontWeight: 800,
              letterSpacing: 5,
              lineHeight: 1,
              textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.4)',
            }}
          >
            PARADOX
          </div>

          <div
            style={{
              fontFamily: "'Eczar', 'Georgia', serif",
              fontSize: '2.8rem',
              color: '#ece7e7f5',
              letterSpacing: 10,
              marginTop: -4,
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            }}
          >
            ROOM
          </div>

          {/* Decorative divider */}
          <div
            style={{
              width: '70%',
              height: '1px',
              margin: '20px auto 0 auto',
              background:
                'linear-gradient(90deg, transparent 0%, rgba(236,231,231,0.4) 30%, rgba(236,231,231,0.6) 50%, rgba(236,231,231,0.4) 70%, transparent 100%)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: '8px',
                height: '8px',
                backgroundColor: '#ece7e7',
                transform: 'rotate(45deg)',
                boxShadow: '0 0 8px rgba(255,255,255,0.6)',
              }}
            />
          </div>
        </div>

        {/* MENU BUTTONS */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '250px',
            maxWidth: '75%',
            gap: 14,
            alignItems: 'stretch',

            opacity: isMenu ? 1 : 0,

            transform: isMenu
              ? 'translateY(0)'
              : 'translateY(40px)',

            transition:
              'opacity 1.2s ease 0.5s, transform 1.2s ease 0.5s',

            pointerEvents: isMenu ? 'auto' : 'none',
          }}
        >
          <MetalButton
            onClick={(e) => {
              e.stopPropagation();
              playNewGame();
              triggerAnimatedNav(() =>
                goTo('level_select')
              );
            }}
            label="START"
          />

          <MetalButton
            onClick={(e) => {
              e.stopPropagation();
              goTo('lobby');
            }}
            label="MULTIPLAYER"
          />

          <MetalButton
            onClick={(e) => {
              e.stopPropagation();
              goTo('achievements');
            }}
            label="ACHIEVEMENTS"
          />

          <MetalButton
            onClick={(e) => {
              e.stopPropagation();
              goTo('treasures');
            }}
            label="TREASURES"
          />

          <MetalButton
            onClick={(e) => {
              e.stopPropagation();
              goTo('settings');
            }}
            label="SETTINGS"
          />

          <MetalButton
            onClick={(e) => {
              e.stopPropagation();
              window.close();
            }}
            label="QUIT"
            danger
          />
        </div>

        {/* HINT TOKEN */}
        {isMenu && (
          <div
            style={{
              position: 'absolute',
              bottom: '30px',
              right: '30px',
              zIndex: 10,
              opacity: isMenu ? 1 : 0,
              transition: 'opacity 1s ease 0.9s',
            }}
          >
            <HintToken />
          </div>
        )}
      </div>

      {/* PRESS ANIMATION */}
      <style>{`
        @keyframes pressGlow {
          0%, 100% {
            opacity: 0.4;
            transform: translate(-50%, -50%) scale(0.98);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.03);
          }
        }
      `}</style>

      {/* TRANSITION */}
      {showTransition && (
        <SplashTransition
          trigger={showTransition}
          polygonPoints="31.8,85.8 37.6,81.1 37.6,29.1 32.9,25.1 51,24.4 47.2,29.6 47.2,81.3 51.7,86"
          onDone={() => {
            setShowTransition(false);
            pendingNav?.();
            setPendingNav(null);
          }}
        />
      )}
    </div>
  );
}
