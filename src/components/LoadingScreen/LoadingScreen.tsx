import { useEffect, useState } from 'react';
import { LEVELS } from '../../data/levels';

interface Props {
  levelId: string;
  onDone: () => void;
}

export function LoadingScreen({ levelId, onDone }: Props) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Memuat level...');
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [loadDone, setLoadDone] = useState(false);

  const level = LEVELS.find((l) => l.id === levelId);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    loadAssets();
  }, []);

  const loadAssets = async () => {
    if (!level) return;

    const assets: string[] = [];

    level.scenes.forEach((scene) => {
      if (scene.backgroundImage) assets.push(scene.backgroundImage);
      scene.hotspots.forEach((hs) => {
        if (hs.action.type === 'open_note') assets.push(hs.action.image);
        if (hs.action.type === 'open_zoom') assets.push(hs.action.zoomImage);
      });
    });

    if (level.music) assets.push(level.music);

    const total = assets.length || 1;
    let loaded = 0;

    for (const asset of assets) {
      await preloadAsset(asset);
      loaded++;
      const pct = Math.round((loaded / total) * 100);
      setProgress(pct);

      if (asset.includes('background')) setStatus('Memuat background...');
      else if (asset.includes('note')) setStatus('Memuat catatan...');
      else if (asset.includes('audio')) setStatus('Memuat musik...');
      else setStatus('Memuat aset...');
    }

    setProgress(100);
    setStatus('Selesai dimuat!');
    setLoadDone(true); // ← tampilkan tombol
  };

  const preloadAsset = (src: string): Promise<void> => {
    return new Promise((resolve) => {
      if (src.match(/\.(mp3|wav|ogg)$/)) {
        const audio = new Audio();
        audio.src = src;
        audio.oncanplaythrough = () => resolve();
        audio.onerror = () => resolve();
        audio.load();
        setTimeout(resolve, 3000);
      } else {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve();
        img.onerror = () => resolve();
      }
    });
  };

  const handleNext = () => {
    setFadeOut(true);
    setTimeout(onDone, 600);
  };

  if (!level) return null;

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
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.7)',
      }} />

      <div style={{
        zIndex: 1, textAlign: 'center',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
      }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>{level.thumbnail}</div>

        <div style={{
          color: '#8a7a6a', fontSize: 11,
          letterSpacing: 6, textTransform: 'uppercase', marginBottom: 8,
        }}>
          loading level
        </div>

        <div style={{
          color: '#e8d5b7', fontSize: 48, fontWeight: 700,
          letterSpacing: 4, textTransform: 'uppercase',
          textShadow: '0 4px 20px rgba(0,0,0,0.9)',
          marginBottom: 8,
        }}>
          {level.title}
        </div>

        <div style={{
          color: '#8a7a6a', fontSize: 14,
          maxWidth: 400, lineHeight: 1.6,
          fontFamily: 'sans-serif', marginBottom: 48,
        }}>
          {level.description}
        </div>

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
        <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
          <div style={{
            width: '100%', height: 3,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 2, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #8a7a6a, #c8b89a)',
              borderRadius: 2,
              transition: 'width 0.3s ease',
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
              {status}
            </span>
            <span style={{
              color: '#c8b89a', fontSize: 12,
              fontFamily: 'monospace',
            }}>
              {progress}%
            </span>
          </div>
        </div>

        {/* Tombol next — muncul setelah loading selesai */}
        <div style={{
          opacity: loadDone ? 1 : 0,
          transform: loadDone ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.4s ease, transform 0.4s ease',
          pointerEvents: loadDone ? 'auto' : 'none',
          width: 320,
        }}>
          <button
            onClick={handleNext}
            style={{
              position: 'relative',
              width: '100%',
              padding: '16px 0',
              background: 'linear-gradient(180deg, #5a5a5a 0%, #2a2a2a 40%, #1a1a1a 60%, #3a3a3a 100%)',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontFamily: "'Georgia', serif",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: 6,
              color: '#e8d5b7',
              textTransform: 'uppercase',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.5)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(180deg, #6a6a6a 0%, #3a3a3a 40%, #2a2a2a 60%, #4a4a4a 100%)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(180deg, #5a5a5a 0%, #2a2a2a 40%, #1a1a1a 60%, #3a3a3a 100%)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {/* Dekorasi kiri */}
            <div style={{
              position: 'absolute', left: 16, top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <div style={{ width: 16, height: 1, background: '#666' }} />
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#555' }} />
            </div>
            {/* Dekorasi kanan */}
            <div style={{
              position: 'absolute', right: 16, top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex', alignItems: 'center', gap: 6, flexDirection: 'row-reverse',
            }}>
              <div style={{ width: 16, height: 1, background: '#666' }} />
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#555' }} />
            </div>

            ▶ Masuk Level

            {/* Border */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 4,
              border: '1px solid #555', pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', inset: 3, borderRadius: 2,
              border: '1px solid #444', pointerEvents: 'none',
            }} />
          </button>
        </div>
      </div>
    </div>
  );
}