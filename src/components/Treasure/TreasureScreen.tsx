import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { LEVELS as HARDCODED_LEVELS } from '../../data/levels';
import { MetalButton } from '../UI/MetalButton';
import { resolveTreasureImagePath } from '../../lib/treasureImage';

interface TreasureInfo {
  name: string;
  description: string;
}

// Nama & deskripsi singkat per treasure (karena data Treasure tidak
// menyimpannya). Siluet ditampilkan untuk treasure yang belum didapat.
const TREASURE_INFO: Record<string, TreasureInfo> = {
  treasure_lab_1: { name: 'Atom Misterius', description: 'Partikel atom yang menyimpan energi paradoks.' },
  treasure_lab_2: { name: 'Ben 10 Watch', description: 'Jam tangan alien dari lab.' },
  treasure_school_1: { name: 'Sapi Perah', description: 'Sapi aneh di koridor sekolah.' },
  treasure_school_2: { name: 'Luffy Hat', description: 'Topi bajak laut tersembunyi.' },
  treasure_library_1: { name: 'Anjing Kecil', description: 'Anjing yang menjaga perpustakaan.' },
  treasure_library_2: { name: 'Burung Hantu', description: 'Burung hantu penjaga buku.' },
  treasure_minimarket_1: { name: 'Kunci Emas', description: 'Kunci yang membuka brankas.' },
  treasure_minimarket_2: { name: 'Spider', description: 'Labas-laba raksasa di minimarket.' },
  treasure_toystore_1: { name: 'Minion', description: 'Boneka minion di toko mainan.' },
  treasure_toystore_2: { name: 'Simpsons', description: 'Figur Simpsons tersembunyi.' },
  treasure_garden_2: { name: 'Meteor', description: 'Meteor jatuh di taman paradoks.' },
  treasure_garden_3: { name: 'Jaring Laba-laba', description: 'Jaring besar di taman.' },
  treasure_lv7_medal: { name: 'Medali Papan Tulis', description: 'Medali di ujung atas papan tulis scene 3.' },
  treasure_lv7_crayon: { name: 'Krayon', description: 'Krayon di bawah wastafel scene 3.' },
  treasure_lv7_racun: { name: 'Racun', description: 'Botol racun di kiri bawah scene 4.' },
  treasure_lv7_umbrella: { name: 'Payung', description: 'Payung di mesin kiri scene 5.' },
  treasure_lv7_teddy: { name: 'Teddy Bear', description: 'Boneka teddy di storage scene 2.' },
};

// ── Palet hitam & emas ──
const GOLD = '#d4af37';
const GOLD_LIGHT = '#f5d77a';
const GOLD_DARK = '#8a6d1f';

export function TreasureScreen() {
  const goTo = useGameStore((s) => s.goTo);
  const loadMyProgress = useGameStore((s) => s.loadMyProgress);
  const foundTreasures = useGameStore((s) => s.foundTreasures);
  // Treasure & achievement diambil dari API (data admin), bukan file lokal.
  const storeLevels = useGameStore((s) => s.levels);
  const loadLevels = useGameStore((s) => s.loadLevels);

  useEffect(() => {
    loadMyProgress();
    loadLevels();
  }, [loadMyProgress, loadLevels]);

  // Simpan id treasure yang sedang di-zoom (bukan hanya gambarnya)
  // supaya nama & deskripsi ikut tampil di showcase.
  const [zoomedId, setZoomedId] = useState<string | null>(null);

  // Tutup showcase dengan tombol ESC
  useEffect(() => {
    if (!zoomedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomedId]);

  // Daftar treasure: pakai store levels (dari API, dengan name/description yang
// bisa diedit di admin) kalau sudah dimuat; fallback ke HARDCODED_LEVELS.
const apiTreasures = storeLevels.flatMap((l) => l.treasures ?? []);
  const allTreasures = apiTreasures.length > 0
    ? apiTreasures
    : HARDCODED_LEVELS.flatMap((l) => l.treasures ?? []);
  const progressPct = allTreasures.length
    ? Math.round((foundTreasures.length / allTreasures.length) * 100)
    : 0;

  const zoomedTreasure = zoomedId ? allTreasures.find((t) => t.id === zoomedId) : null;
  // Nama/deskripsi dari database (bisa diedit di admin). TREASURE_INFO
  // hanya dipakai kalau database belum punya nama.
  const zoomedInfo = zoomedId
    ? {
        name: zoomedTreasure?.name || TREASURE_INFO[zoomedId]?.name || zoomedId,
        description: zoomedTreasure?.description || TREASURE_INFO[zoomedId]?.description || '',
      }
    : null;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'url(/backgrounds/splash_bg.png) center/cover no-repeat',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Georgia', serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes showcaseFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes treasurePop {
          0%   { opacity: 0; transform: scale(0.3) translateY(40px); }
          70%  { opacity: 1; transform: scale(1.08) translateY(0); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes raysSpin { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.75; transform: translate(-50%, -50%) scale(1); }
          50%      { opacity: 1;    transform: translate(-50%, -50%) scale(1.15); }
        }
        @keyframes floatTreasure { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes textRise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes sparkle {
          0%   { opacity: 0; transform: translateY(0) scale(0.4); }
          30%  { opacity: 1; }
          100% { opacity: 0; transform: translateY(-120px) scale(1); }
        }
        .gold-scroll::-webkit-scrollbar { width: 6px; }
        .gold-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
        .gold-scroll::-webkit-scrollbar-thumb { background: ${GOLD_DARK}; border-radius: 3px; }
        .treasure-card { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
        .treasure-card.found { cursor: pointer; }
        .treasure-card.found:hover {
          transform: translateY(-4px);
          border-color: ${GOLD} !important;
          box-shadow: 0 0 22px rgba(212,175,55,0.45), 0 8px 18px rgba(0,0,0,0.7) !important;
        }
      `}</style>

      {/* Overlay Hitam */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, rgba(20,16,6,0.88) 0%, rgba(0,0,0,0.96) 100%)',
          zIndex: 0,
        }}
      />

      <div
        style={{
          zIndex: 1,
          width: '90%',
          maxWidth: 900,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Judul */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: 8,
              textTransform: 'uppercase',
              background: `linear-gradient(180deg, ${GOLD_LIGHT}, ${GOLD} 55%, ${GOLD_DARK})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 12px rgba(212,175,55,0.4))',
            }}
          >
            TREASURES
          </div>

          {/* Ornamen */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              margin: '10px auto 8px',
              width: 260,
            }}
          >
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
            <span style={{ color: GOLD, fontSize: 12 }}>◆</span>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(270deg, transparent, ${GOLD})` }} />
          </div>

          {/* Progress bar emas */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              maxWidth: 360,
              margin: '0 auto',
            }}
          >
            <div
              style={{
                flex: 1,
                height: 6,
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${GOLD_DARK}`,
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progressPct}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${GOLD_DARK}, ${GOLD_LIGHT})`,
                  boxShadow: `0 0 10px ${GOLD}`,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
            <div style={{ color: GOLD, fontSize: 12, fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>
              {foundTreasures.length} / {allTreasures.length} ditemukan
            </div>
          </div>
        </div>

        {/* Grid Treasure */}
        <div
          className="gold-scroll"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 16,
            maxHeight: '60vh',
            overflowY: 'auto',
            padding: '8px',
          }}
        >
          {allTreasures.map((t) => {
            const found = foundTreasures.includes(t.id);
            const info = {
              name: t.name || TREASURE_INFO[t.id]?.name || t.id,
              description: t.description || TREASURE_INFO[t.id]?.description || '',
            };
            return (
              <div
                key={t.id}
                className={`treasure-card ${found && t.image ? 'found' : ''}`}
                onClick={() => t.image && setZoomedId(t.id)}
                title={found ? 'Klik untuk memperbesar' : undefined}
                style={{
                  background: found
                    ? 'linear-gradient(180deg, rgba(60,45,10,0.5), rgba(10,10,10,0.95))'
                    : 'rgba(14,14,14,0.85)',
                  border: `1px solid ${found ? GOLD_DARK : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 8,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  opacity: found ? 1 : 0.55,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                }}
              >
                <div
                  style={{
                    width: 96,
                    height: 96,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: found
                      ? 'radial-gradient(circle, rgba(212,175,55,0.22), rgba(0,0,0,0.6) 70%)'
                      : 'rgba(0,0,0,0.5)',
                    border: `1px solid ${found ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: 8,
                    overflow: 'hidden',
                  }}
                >
                  {found && t.image ? (
                    <img
                      src={resolveTreasureImagePath(t.image)}
                      alt={info.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '60%',
                        height: '60%',
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: '50%',
                        filter: 'blur(2px)',
                      }}
                    />
                  )}
                </div>
                <div
                  style={{
                    color: found ? GOLD_LIGHT : '#4a4a4a',
                    fontSize: 12,
                    fontWeight: 700,
                    textAlign: 'center',
                    letterSpacing: 0.5,
                  }}
                >
                  {found ? info.name : '???'}
                </div>
                <div
                  style={{
                    color: found ? '#a89a78' : '#555',
                    fontSize: 10,
                    textAlign: 'center',
                    lineHeight: 1.4,
                    minHeight: 28,
                    fontFamily: 'sans-serif',
                  }}
                >
                  {found ? info.description : 'Belum ditemukan'}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
          <MetalButton
            onClick={(e) => {
              e.stopPropagation();
              goTo('splash');
            }}
            label="← Back"
          />
        </div>
      </div>

      {/* ============================================ */}
      {/* SHOWCASE TREASURE: gambar besar + efek cahaya */}
      {/* ============================================ */}
      {zoomedTreasure && zoomedInfo && (
        <div
          onClick={() => setZoomedId(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            animation: 'showcaseFade 0.3s ease-out',
            overflow: 'hidden',
          }}
        >
          {/* Wadah cahaya + gambar */}
          <div style={{ position: 'relative', width: 440, height: 440 }}>
            {/* Glow lembut */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 560,
                height: 560,
                borderRadius: '50%',
                background:
                  'radial-gradient(circle, rgba(255,223,120,0.75) 0%, rgba(212,175,55,0.35) 35%, rgba(212,175,55,0) 70%)',
                animation: 'glowPulse 3s ease-in-out infinite',
                pointerEvents: 'none',
              }}
            />
            {/* Sinar berputar */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 1000,
                height: 1000,
                background:
                  'repeating-conic-gradient(from 0deg, rgba(245,215,122,0.35) 0deg 6deg, transparent 6deg 24deg)',
                WebkitMaskImage: 'radial-gradient(circle, #000 0%, transparent 62%)',
                maskImage: 'radial-gradient(circle, #000 0%, transparent 62%)',
                animation: 'raysSpin 40s linear infinite',
                pointerEvents: 'none',
              }}
            />
            {/* Partikel berkilau */}
            {Array.from({ length: 12 }).map((_, i) => (
              <span
                key={i}
                style={{
                  position: 'absolute',
                  left: `${15 + ((i * 53) % 70)}%`,
                  bottom: `${10 + ((i * 29) % 30)}%`,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: GOLD_LIGHT,
                  boxShadow: `0 0 10px ${GOLD_LIGHT}`,
                  opacity: 0,
                  animation: `sparkle ${2.2 + (i % 4) * 0.5}s ease-out ${i * 0.25}s infinite`,
                  pointerEvents: 'none',
                }}
              />
            ))}

            {/* Gambar treasure besar */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'treasurePop 0.6s cubic-bezier(0.2, 0.9, 0.3, 1.2) both',
              }}
            >
              <div
                style={{
                  animation: 'floatTreasure 3.5s ease-in-out 0.6s infinite',
                  filter:
                    'drop-shadow(0 0 25px rgba(255,215,100,0.8)) drop-shadow(0 10px 20px rgba(0,0,0,0.8))',
                }}
              >
                <img
                  src={resolveTreasureImagePath(zoomedTreasure.image)}
                  alt={zoomedInfo.name}
                  style={{
                    maxWidth: 'min(300px, 60vw)',
                    maxHeight: 'min(300px, 40vh)',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Nama & deskripsi */}
          <div
            style={{
              textAlign: 'center',
              maxWidth: 520,
              padding: '0 24px',
              marginTop: 8,
              animation: 'textRise 0.6s ease-out 0.35s both',
            }}
          >
            <div
              style={{
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: 4,
                textTransform: 'uppercase',
                background: `linear-gradient(180deg, ${GOLD_LIGHT}, ${GOLD} 60%, ${GOLD_DARK})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 2px 12px rgba(212,175,55,0.5))',
              }}
            >
              {zoomedInfo.name}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                margin: '12px auto',
                width: 240,
              }}
            >
              <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
              <span style={{ color: GOLD, fontSize: 12 }}>◆</span>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(270deg, transparent, ${GOLD})` }} />
            </div>

            <div
              style={{
                color: '#cdbb92',
                fontSize: 15,
                lineHeight: 1.6,
                fontFamily: 'sans-serif',
              }}
            >
              {zoomedInfo.description}
            </div>

            <div
              style={{
                marginTop: 22,
                color: GOLD_DARK,
                fontSize: 11,
                letterSpacing: 2,
                fontFamily: 'sans-serif',
              }}
            >
              KLIK DI MANA SAJA UNTUK MENUTUP
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
