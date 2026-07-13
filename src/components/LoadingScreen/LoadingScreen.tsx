import { useEffect, useState } from 'react';

interface Props {
  levelTitle: string;
  levelDescription: string;
  thumbnail: string;
  onDone: () => void;
}

export function LoadingScreen({ levelTitle, levelDescription, thumbnail, onDone }: Props) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);

    // Simulasi loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 12;
      });
    }, 120);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(onDone, 600);
      }, 500);
    }
  }, [progress]);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'url(/backgrounds/splash_bg.png) center/cover no-repeat',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.6s ease',
      fontFamily: "'Georgia', serif",
    }}>

      {/* Overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.7)',
      }} />

      {/* Konten */}
      <div style={{
        zIndex: 1, textAlign: 'center',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 0,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
      }}>

        {/* Thumbnail */}
        <div style={{ fontSize: 64, marginBottom: 24 }}>{thumbnail}</div>

        {/* Label */}
        <div style={{
          color: '#8a7a6a', fontSize: 11,
          letterSpacing: 6, textTransform: 'uppercase', marginBottom: 8,
        }}>
          loading level
        </div>

        {/* Judul level */}
        <div style={{
          color: '#e8d5b7', fontSize: 48, fontWeight: 700,
          letterSpacing: 4, textTransform: 'uppercase',
          textShadow: '0 4px 20px rgba(0,0,0,0.9)',
          marginBottom: 8,
        }}>
          {levelTitle}
        </div>

        {/* Deskripsi */}
        <div style={{
          color: '#8a7a6a', fontSize: 14,
          maxWidth: 400, lineHeight: 1.6,
          fontFamily: 'sans-serif', marginBottom: 48,
        }}>
          {levelDescription}
        </div>

        {/* Garis dekoratif */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 12, marginBottom: 40,
        }}>
          <div style={{ width: 60, height: 1, background: '#c8b89a', opacity: 0.4 }} />
          <div style={{
            width: 7, height: 7,
            border: '1.5px solid #c8b89a',
            transform: 'rotate(45deg)', opacity: 0.6,
          }} />
          <div style={{ width: 60, height: 1, background: '#c8b89a', opacity: 0.4 }} />
        </div>

        {/* Progress bar */}
        <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{
            width: '100%', height: 3,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 2, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(progress, 100)}%`,
              background: 'linear-gradient(90deg, #8a7a6a, #c8b89a)',
              borderRadius: 2,
              transition: 'width 0.15s ease',
              boxShadow: '0 0 8px rgba(200,184,154,0.5)',
            }} />
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{
              color: '#8a7a6a', fontSize: 10,
              letterSpacing: 3, textTransform: 'uppercase',
            }}>
              {progress < 100 ? 'preparing...' : 'ready'}
            </span>
            <span style={{
              color: '#c8b89a', fontSize: 12,
              fontFamily: 'monospace',
            }}>
              {Math.min(Math.round(progress), 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}