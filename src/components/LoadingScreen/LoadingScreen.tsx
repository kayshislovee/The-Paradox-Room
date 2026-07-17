import { useEffect, useRef, useState } from 'react';
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

  // Simpan referensi Image di memori supaya tidak di-GC sebelum dipakai
  const imageCache = useRef<HTMLImageElement[]>([]);

  const level = LEVELS.find((l) => l.id === levelId);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    loadAssets();
  }, []);

  const loadAssets = async () => {
    if (!level) return;

    // Kumpulkan semua URL aset gambar dan audio
    const imageUrls: string[] = [];
    const audioUrls: string[] = [];

    level.scenes.forEach((scene) => {
      if (scene.backgroundImage) imageUrls.push(scene.backgroundImage);
      scene.hotspots.forEach((hs) => {
        if (hs.image) imageUrls.push(hs.image);
        if (hs.action.type === 'open_note') imageUrls.push(hs.action.image);
        if (hs.action.type === 'open_zoom') imageUrls.push(hs.action.zoomImage);
      });
    });

    // Zoom images tambahan dari level items jika ada
    level.items?.forEach((item) => {
      if (typeof item.icon === 'string' && item.icon.startsWith('/')) {
        imageUrls.push(item.icon);
      }
    });

    if (level.music) audioUrls.push(level.music);

    const allAssets = [...imageUrls, ...audioUrls];
    const total = allAssets.length || 1;
    let loaded = 0;

    // ── Preload gambar: onload + decode() ──────────────────────────────────────
    // decode() memaksa browser men-decode gambar ke GPU memory sekarang,
    // bukan saat pertama kali dirender ke layar (= hilangnya pop-in)
    const imagePromises = imageUrls.map((src) =>
      new Promise<void>((resolve) => {
        const img = new Image();

        img.onload = async () => {
          try {
            // decode() = sinyal ke browser: "siapkan ke GPU sekarang"
            await img.decode();
          } catch {
            // decode() bisa gagal di beberapa browser lama, tidak masalah
          }
          // Simpan referensi agar tidak di-GC
          imageCache.current.push(img);
          loaded++;
          setProgress(Math.round((loaded / total) * 100));
          if (src.includes('background')) setStatus('Memuat background...');
          else if (src.includes('objects')) setStatus('Memuat objek...');
          else if (src.includes('note') || src.includes('zoom')) setStatus('Memuat gambar...');
          else setStatus('Memuat aset...');
          resolve();
        };

        img.onerror = () => {
          // Tetap lanjut meski aset gagal, jangan blok loading
          loaded++;
          setProgress(Math.round((loaded / total) * 100));
          resolve();
        };

        // Set src SETELAH pasang handler
        img.src = src;
      })
    );

    // ── Preload audio: cukup canplaythrough ────────────────────────────────────
    const audioPromises = audioUrls.map((src) =>
      new Promise<void>((resolve) => {
        const audio = new Audio();
        const done = () => {
          loaded++;
          setProgress(Math.round((loaded / total) * 100));
          setStatus('Memuat musik...');
          resolve();
        };
        audio.oncanplaythrough = done;
        audio.onerror = done;
        audio.src = src;
        audio.load();
        // Timeout fallback 5 detik untuk audio (bisa lambat)
        setTimeout(done, 5000);
      })
    );

    // Jalankan semua bersamaan (parallel, bukan serial) = jauh lebih cepat
    await Promise.all([...imagePromises, ...audioPromises]);

    // Inject <link rel="preload"> ke <head> supaya browser tahu
    // aset ini sudah di-cache dan pakai dari disk cache
    imageUrls.forEach((src) => {
      if (document.querySelector(`link[href="${src}"]`)) return;
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });

    setProgress(100);
    setStatus('Selesai!');
    setLoadDone(true);
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
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} />

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

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <div style={{ width: 60, height: 1, background: '#c8b89a', opacity: 0.4 }} />
          <div style={{ width: 7, height: 7, border: '1.5px solid #c8b89a', transform: 'rotate(45deg)', opacity: 0.6 }} />
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#8a7a6a', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' }}>
              {status}
            </span>
            <span style={{ color: '#c8b89a', fontSize: 12, fontFamily: 'monospace' }}>
              {progress}%
            </span>
          </div>
        </div>

        {/* Tombol masuk */}
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
              position: 'relative', width: '100%', padding: '16px 0',
              background: 'linear-gradient(180deg, #5a5a5a 0%, #2a2a2a 40%, #1a1a1a 60%, #3a3a3a 100%)',
              border: 'none', borderRadius: 4, cursor: 'pointer',
              fontFamily: "'Georgia', serif", fontSize: 15, fontWeight: 600,
              letterSpacing: 6, color: '#e8d5b7', textTransform: 'uppercase',
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
            <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 16, height: 1, background: '#666' }} />
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#555' }} />
            </div>
            <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 6, flexDirection: 'row-reverse' }}>
              <div style={{ width: 16, height: 1, background: '#666' }} />
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#555' }} />
            </div>
            ▶ Masuk Level
            <div style={{ position: 'absolute', inset: 0, borderRadius: 4, border: '1px solid #555', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', inset: 3, borderRadius: 2, border: '1px solid #444', pointerEvents: 'none' }} />
          </button>
        </div>
      </div>
    </div>
  );
}