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

  const level = LEVELS.find((l) => l.id === levelId);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    loadAssets();
  }, []);

  const loadAssets = async () => {
    if (!level) return;

    const assets: string[] = [];

    // Kumpulkan semua asset yang perlu diload
    level.scenes.forEach((scene) => {
      if (scene.backgroundImage) assets.push(scene.backgroundImage);
    });

    // Kumpulkan asset notes dari hotspots
    level.scenes.forEach((scene) => {
      scene.hotspots.forEach((hs) => {
        if (hs.action.type === 'open_note') {
          assets.push(hs.action.image);
        }
        if (hs.action.type === 'open_zoom') {
          assets.push(hs.action.zoomImage);
        }
      });
    });

    // Load audio
    if (level.music) assets.push(level.music);

    const total = assets.length || 1;
    let loaded = 0;

    setStatus('Memuat background...');

    for (const asset of assets) {
      await preloadAsset(asset);
      loaded++;
      const pct = Math.round((loaded / total) * 100);
      setProgress(pct);

      // Update status sesuai jenis asset
      if (asset.includes('background')) setStatus('Memuat background...');
      else if (asset.includes('note')) setStatus('Memuat catatan...');
      else if (asset.includes('audio')) setStatus('Memuat musik...');
      else setStatus('Memuat aset...');
    }

    setProgress(100);
    setStatus('Siap!');

    setTimeout(() => {
      setFadeOut(true);
      setTimeout(onDone, 600);
    }, 400);
  };

  const preloadAsset = (src: string): Promise<void> => {
    return new Promise((resolve) => {
      if (src.match(/\.(mp3|wav|ogg)$/)) {
        // Preload audio
        const audio = new Audio();
        audio.src = src;
        audio.oncanplaythrough = () => resolve();
        audio.onerror = () => resolve(); // skip jika gagal
        audio.load();
        // Timeout fallback
        setTimeout(resolve, 3000);
      } else {
        // Preload image
        const img = new Image();
        img.src = src;
        img.onload = () => resolve();
        img.onerror = () => resolve(); // skip jika gagal
      }
    });
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
        alignItems: 'center', gap: 0,
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

        <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 10 }}>
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
      </div>
    </div>
  );
}