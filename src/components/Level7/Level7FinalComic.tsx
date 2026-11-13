import { useEffect, useState } from 'react';

interface Props {
  src: string;
  leverSolved: boolean;
  onLeverPulled: () => void;
}

export function Level7FinalComic({ src, leverSolved, onLeverPulled }: Props) {
  const [mounted, setMounted] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);

  // Trigger mount animation
  useEffect(() => {
    setMounted(true);
    // Delay content reveal for dramatic effect
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Auto-trigger if already solved (shouldn't normally happen but safety)
  useEffect(() => {
    if (leverSolved && !showContent) {
      setShowContent(true);
    }
  }, [leverSolved, showContent]);

  const handleButtonClick = () => {
    onLeverPulled();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleButtonClick();
    }
  };

  if (!mounted) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9500,
          background: '#000',
        }}
      />
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9500,
        overflow: 'hidden',
        background: '#080808',
      }}
    >
      {/* Background comic image - subtle */}
      <img
        src={src}
        alt="Scene 5 ending"
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.12,
          filter: 'brightness(0.4) contrast(1.2)',
          userSelect: 'none',
          transition: 'opacity 1s ease, filter 1s ease',
        }}
      />

      {/* Vignette overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)',
          zIndex: 1,
        }}
      />

      {/* Scanline overlay for CRT effect */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 2,
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)',
          opacity: 0.4,
        }}
      />

      {/* Main content container */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          padding: '20px',
        }}
      >
        {/* Status text - "REACTOR COMPLETE - ALL SYSTEMS SECURED" */}
        <div
          style={{
            opacity: showContent ? 1 : 0,
            transform: showContent ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
            transitionDelay: '0.2s',
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          <div style={{
            fontFamily: 'Courier New, Courier, monospace',
            fontSize: 'clamp(14px, 2.5vw, 22px)',
            fontWeight: 700,
            letterSpacing: '0.3em',
            color: '#34d399',
            textShadow: '0 0 20px rgba(52, 211, 153, 0.6), 0 2px 8px rgba(0,0,0,0.8)',
            textTransform: 'uppercase',
            marginBottom: '8px',
            animation: 'pulseGlow 2.5s ease-in-out infinite',
          }}>
            REACTOR COMPLETE
          </div>
          <div style={{
            fontFamily: 'Courier New, Courier, monospace',
            fontSize: 'clamp(10px, 1.5vw, 14px)',
            fontWeight: 400,
            letterSpacing: '0.2em',
            color: 'rgba(200, 184, 154, 0.8)',
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
            textTransform: 'uppercase',
          }}>
            ALL SYSTEMS SECURED
          </div>
        </div>

        {/* Warning & Button Stack Container (Button is positioned on top of warning) */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: showContent ? 1 : 0,
            transform: showContent ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.9)',
            transition: 'opacity 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
            transitionDelay: '0.4s',
            marginBottom: '24px',
          }}
        >
          {/* Warning image */}
          <div
            style={{
              filter: 'drop-shadow(0 8px 24px rgba(255, 60, 60, 0.3))',
            }}
          >
            <img
              src="/objects/warning.png"
              alt="System Warning"
              draggable={false}
              style={{
                display: 'block',
                marginTop:10,
                width: 'clamp(600px, 18vw, 1300px)',
                height: 'auto',
                maxWidth: '140vw',
              }}
            />
          </div>

          {/* Buttonlast image - clickable button positioned on top of the warning image */}
          <button
            onClick={handleButtonClick}
            onKeyDown={handleKeyDown}
            onMouseEnter={() => setButtonHovered(true)}
            onMouseLeave={() => setButtonHovered(false)}
            tabIndex={0}
            aria-label="Lanjut ke scene berikutnya"
            style={{
              position: 'absolute',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              zIndex: 10,
              transition: 'transform 0.15s ease',
            }}
          >
            <img
              src="/objects/buttonlast.png"
              alt="Lanjut"
              draggable={false}
              style={{
                display: 'block',
                width: 'clamp(100px, 25vw, 240px)',
                top:'200',
                height: 'auto',
                marginTop:75,
                maxWidth: '80vw',
                filter: buttonHovered
                  ? 'drop-shadow(0 0 16px rgba(56, 189, 248, 0.8)) brightness(1.15)'
                  : 'drop-shadow(0 4px 16px rgba(0, 0, 0, 0.6))',
                transition: 'filter 0.2s ease, transform 0.15s ease',
                transform: buttonHovered ? 'scale(1.03)' : 'scale(1)',
              }}
            />
            <div style={{
              fontFamily: 'Courier New, Courier, monospace',
              fontSize: 'clamp(10px, 1.3vw, 13px)',
              fontWeight: 600,
              letterSpacing: '0.25em',
              color: buttonHovered ? '#38bdf8' : 'rgba(200, 184, 154, 0.7)',
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
              textTransform: 'uppercase',
              transition: 'color 0.2s ease',
              whiteSpace: 'nowrap',
            }}>
              KLIK UNTUK LANJUT
            </div>
          </button>
        </div>

        {/* Subtle hint at bottom */}
        <div
          style={{
            opacity: showContent ? 0.5 : 0,
            transition: 'opacity 0.8s ease 1.2s',
            position: 'absolute',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'Courier New, Courier, monospace',
            fontSize: '10px',
            letterSpacing: '0.15em',
            color: 'rgba(100, 116, 139, 0.6)',
            textTransform: 'uppercase',
            pointerEvents: 'none',
          }}
        >
          Tekan ENTER atau klik tombol untuk melanjutkan
        </div>
      </div>

      {/* Ambient glow at center */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(52, 211, 153, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 5,
          opacity: showContent ? 1 : 0,
          transition: 'opacity 1.5s ease 0.3s',
          animation: 'ambientPulse 4s ease-in-out infinite',
        }}
      />

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { text-shadow: 0 0 20px rgba(52, 211, 153, 0.6), 0 2px 8px rgba(0,0,0,0.8); }
          50% { text-shadow: 0 0 32px rgba(52, 211, 153, 0.9), 0 2px 8px rgba(0,0,0,0.8), 0 0 60px rgba(52, 211, 153, 0.3); }
        }
        @keyframes ambientPulse {
          0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
        }
      `}</style>
    </div>
  );
}