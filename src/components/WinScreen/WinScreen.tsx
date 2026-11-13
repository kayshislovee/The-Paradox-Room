import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { LEVELS } from '../../data/levels';
import { useSFX } from '../../hooks/useSFX';
import { MetalButton } from '../UI/MetalButton';

interface Props {
  onStartLevel?: (levelId: string) => void;
}

export function WinScreen({ onStartLevel }: Props) {
  const sfx = useSFX();
  const { currentLevelId, timeElapsed, startLevel, goTo } = useGameStore();

  const [visibleStars, setVisibleStars] = useState(0);
  const [barProgress,  setBarProgress]  = useState(0);
  const [showContent,  setShowContent]  = useState(false);
  const [flashVisible, setFlashVisible] = useState(true);

  // Ambil level dari store (API) dulu, fallback ke lokal
 // Urutan yang benar:
const storeLevel = useGameStore((s) => s.levels.find((l) => l.id === currentLevelId));
const localLevel = LEVELS.find((l) => l.id === currentLevelId);
const level      = storeLevel ?? localLevel;

const timeLeft   = Math.max(0, (level?.timeLimit ?? 0) - timeElapsed);
const timeLimit  = level?.timeLimit ?? 1;
const rawThresholds = level?.starThresholds as any;
const parsedThresholds: number[] = Array.isArray(rawThresholds)
  ? rawThresholds
  : typeof rawThresholds === 'string'
    ? (rawThresholds as string).split(',').map(Number)
    : [360, 200, 60];

const thresh3 = parsedThresholds[0] ?? 360;
const thresh2 = parsedThresholds[1] ?? 200;
const thresh1 = parsedThresholds[2] ?? 60;
// isTimeout DULU sebelum stars:
const isTimeout  = !!(level && timeElapsed >= level.timeLimit);

// Baru stars pakai isTimeout:
const stars = timeLeft >= thresh3 ? 3
  : timeLeft >= thresh2 ? 2
  : timeLeft >= thresh1 ? 1
  : 0;

const storeLevels = useGameStore((s) => s.levels);
const orderedLevels = storeLevels.length > 0 ? storeLevels : LEVELS;
const currentIdx = orderedLevels.findIndex((l) => l.id === currentLevelId);
const nextLevel  = orderedLevels[currentIdx + 1];

  const pctThresh2     = Math.round((thresh2 / timeLimit) * 100);
  const pctThresh3     = Math.round((thresh3 / timeLimit) * 100);
const pctThresh1  = Math.round((thresh1 / timeLimit) * 100); 
  const barFillTarget  = Math.round((timeLeft / timeLimit) * 100);

 // SESUDAH — urutkan dari pct terkecil ke terbesar
const thresholds = [
  { label: `${thresh1}s`, pct: pctThresh1, starN: 1 },
  { label: `${thresh2}s`, pct: pctThresh2, starN: 2 },
  { label: `${thresh3}s`, pct: pctThresh3, starN: 3 },
].sort((a, b) => a.pct - b.pct);

  useEffect(() => {
    // Fade out white flash overlay seamlessly from door animation
    const tFlash = setTimeout(() => setFlashVisible(false), 50);

    const t0 = setTimeout(() => {
      setShowContent(true);
      if (isTimeout) sfx.playLose(); else sfx.playWin();
    }, 150);

    if (!isTimeout) {
     const t1 = setTimeout(() => setVisibleStars(1), 500);
const t2 = setTimeout(() => setVisibleStars(2), 850);
const t3 = setTimeout(() => setVisibleStars(3), 1200);
      const t4 = setTimeout(() => setBarProgress(barFillTarget), 1500);
      return () => { [tFlash,t0,t1,t2,t3,t4].forEach(clearTimeout); };
    }
    return () => { clearTimeout(tFlash); clearTimeout(t0); };
  }, []);

  const handleStart = (levelId: string) => {
    if (onStartLevel) onStartLevel(levelId); else startLevel(levelId);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'url(/backgrounds/splash_bg.png) center/cover no-repeat',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Georgia', serif",
      zIndex: 9999,
    }}>
      {/* White flash overlay — seamless transition from door animation */}
      <div style={{
        position: 'fixed', inset: 0,
        background: '#ffffff',
        opacity: flashVisible ? 1 : 0,
        transition: 'opacity 0.5s ease-out',
        pointerEvents: 'none',
        zIndex: 10000,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: isTimeout ? 'rgba(20,0,0,0.85)' : 'rgba(8,4,24,0.82)',
      }} />

      {/* Card */}
      <div style={{
        position:   'relative', zIndex: 1,
        width:      360,
        background: isTimeout
          ? 'linear-gradient(160deg,rgba(40,10,10,0.97),rgba(20,5,5,0.98))'
          : 'linear-gradient(160deg,rgba(20,12,40,0.97),rgba(10,6,26,0.98))',
        border:        `1px solid ${isTimeout ? 'rgba(248,113,113,0.2)' : 'rgba(200,184,154,0.18)'}`,
        borderRadius:  16,
        padding:       '28px 28px 24px',
        boxShadow:     '0 24px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
        display:       'flex', flexDirection: 'column', alignItems: 'center',
        opacity:       showContent ? 1 : 0,
        transform:     showContent ? 'translateY(0) scale(1)' : 'translateY(28px) scale(0.97)',
        transition:    'opacity 0.5s ease, transform 0.5s ease',
      }}>

        {/* Dekorasi sudut */}
        {['top-left','top-right','bottom-left','bottom-right'].map((pos) => (
          <div key={pos} style={{
            position: 'absolute',
            top:    pos.includes('top')    ? 8 : undefined,
            bottom: pos.includes('bottom') ? 8 : undefined,
            left:   pos.includes('left')   ? 8 : undefined,
            right:  pos.includes('right')  ? 8 : undefined,
            width: 12, height: 12,
            borderTop:    pos.includes('top')    ? '1px solid rgba(200,184,154,0.3)' : undefined,
            borderBottom: pos.includes('bottom') ? '1px solid rgba(200,184,154,0.3)' : undefined,
            borderLeft:   pos.includes('left')   ? '1px solid rgba(200,184,154,0.3)' : undefined,
            borderRight:  pos.includes('right')  ? '1px solid rgba(200,184,154,0.3)' : undefined,
          }} />
        ))}

        {isTimeout ? (
          <>
            <div style={{ fontSize: 56, marginBottom: 10 }}>⏰</div>
            <div style={{
              color: '#f87171', fontSize: 36, fontWeight: 700,
              letterSpacing: 4, textTransform: 'uppercase',
              textShadow: '0 0 32px rgba(248,113,113,0.5)',
              marginBottom: 16, textAlign: 'center',
            }}>WAKTU HABIS</div>
            <p style={{
              color: '#fca5a5', fontSize: 13, opacity: 0.7,
              fontFamily: 'sans-serif', lineHeight: 1.6,
              textAlign: 'center', marginBottom: 24,
            }}>
              Kamu tidak berhasil kabur dari <strong>{level?.title}</strong> tepat waktu.
            </p>
          </>
        ) : (
          <>
            {/* Banner */}
            <img
              src="/ui/banner.png" alt="ESCAPED"
              style={{
                width: '100%', maxWidth: 300, marginBottom: 20,
                filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.8))',
                opacity: showContent ? 1 : 0,
                transform: showContent ? 'scale(1)' : 'scale(0.88)',
                transition: 'opacity 0.5s ease, transform 0.5s ease',
              }}
            />

            {/* Bintang */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 24 }}>
             {[1, 2, 3].map((n) => {
  const active  = n <= stars;
  const visible = n <= visibleStars;
  const size    = n === 2 ? 80 : 64;
  return (
    <div key={n} style={{
      width: size, height: size,
      opacity:    visible ? 1 : 0,
      transform:  visible ? 'scale(1) translateY(0)' : 'scale(0.2) translateY(16px)',
      transition: 'opacity 0.35s cubic-bezier(0.34,1.56,0.64,1), transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      filter:     active ? 'drop-shadow(0 0 10px rgba(251,191,36,0.9))' : 'none',
    }}>
      <img
        src={active ? '/ui/star.png' : '/ui/kosong.png'}
        alt="★"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  );
})}
            </div>

            {/* Progress Bar — berdasarkan timeLeft vs timeLimit */}
            <div style={{ width: '100%', marginBottom: 28 }}>

              {/* Label detik threshold di atas */}
              <div style={{ position: 'relative', height: 20, marginBottom: 6 }}>
                {thresholds.map((t) => (
                  <span key={t.label} style={{
                    position:  'absolute',
                    left:      `${t.pct}%`,
                    transform: 'translateX(-50%)',
                    color:     '#fbbf24', fontSize: 10,
                    fontFamily: 'monospace', fontWeight: 700,
                  }}>{t.label}</span>
                ))}
              </div>

              {/* Track */}
              <div style={{
                position: 'relative', height: 18, borderRadius: 9,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}>
                {/* Fill — dari kiri ke posisi timeLeft */}
                <div style={{
                  height: '100%', borderRadius: 9,
                  width: `${barProgress}%`,
                  background: stars >= 3
                    ? 'linear-gradient(90deg,#d97706,#fbbf24,#fde68a)'
                    : stars === 2
                    ? 'linear-gradient(90deg,#d97706,#fbbf24)'
                    : 'linear-gradient(90deg,#92400e,#d97706)',
                  boxShadow: '0 0 10px rgba(251,191,36,0.5)',
                  transition: 'width 1.2s cubic-bezier(0.34,1.1,0.64,1)',
                  overflow: 'hidden', position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)',
                    animation: 'shimmer 1.8s ease infinite',
                  }} />
                </div>

                {/* Marker garis threshold */}
                {thresholds.map((t) => (
                  <div key={t.label} style={{
                    position: 'absolute',
                    left: `${t.pct}%`, top: -3, bottom: -3,
                    width: 2,
                    background: barProgress >= t.pct
                      ? 'rgba(255,255,255,0.5)'
                      : 'rgba(255,255,255,0.2)',
                    borderRadius: 1,
                    transition: 'background 0.5s ease',
                  }} />
                ))}
              </div>

              {/* Bintang kecil di bawah marker */}
              <div style={{ position: 'relative', height: 28, marginTop: 4 }}>
                {thresholds.map((t, i) => (
                  <div key={i} style={{
                    position:  'absolute',
                    left:      `${t.pct}%`,
                    transform: 'translateX(-50%)',
                    filter:    barProgress >= t.pct
                      ? 'drop-shadow(0 0 4px rgba(251,191,36,0.8))'
                      : 'grayscale(1) brightness(0.35)',
                    transition: 'filter 0.5s ease',
                  }}>
                    <img src="/ui/star.png" alt="★" style={{ width: 20, height: 20 }} />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Divider */}
        <div style={{
          width: '100%', height: 1, marginBottom: 16,
          background: `linear-gradient(90deg,transparent,${
            isTimeout ? 'rgba(248,113,113,0.2)' : 'rgba(200,184,154,0.15)'
          },transparent)`,
        }} />

        {/* Tombol */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
          <MetalButton
            onClick={(e) => { e.stopPropagation(); currentLevelId && handleStart(currentLevelId); }}
            label="COBA LAGI"
            danger={isTimeout}
          />
          {nextLevel && !isTimeout && (
            <MetalButton
              onClick={(e) => { e.stopPropagation(); handleStart(nextLevel.id); }}
              label="LEVEL BERIKUTNYA"
            />
          )}
          <MetalButton
            onClick={(e) => { e.stopPropagation(); goTo('level_select'); }}
            label="PILIH LEVEL"
            small
          />
          <MetalButton
            onClick={(e) => { e.stopPropagation(); goTo('splash'); }}
            label="MENU UTAMA"
            small
          />
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}