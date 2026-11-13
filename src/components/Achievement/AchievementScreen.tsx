import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { MetalButton } from '../UI/MetalButton';
import { LEVELS as HARDCODED_LEVELS } from '../../data/levels';
import { looksLikeImagePath, resolveAssetPath } from '../../lib/assetPath';

export function AchievementScreen() {
  const goTo = useGameStore((s) => s.goTo);
  const unlockedAchievements = useGameStore((s) => s.unlockedAchievements);
  const levelProgress = useGameStore((s) => s.levelProgress);

  const storeLevels = useGameStore((s) => s.levels);
  const allLevels = storeLevels.length > 0 && storeLevels.some((l) => l.achievements && l.achievements.length > 0) ? storeLevels : HARDCODED_LEVELS;
  const allAchievements = allLevels.flatMap((l) => l.achievements ?? []);
  const achievementsByLevel = allLevels
    .filter((l) => l.achievements && l.achievements.length > 0)
    .map((l) => ({
      levelId: l.id,
      levelTitle: l.title,
      thumbnail: l.thumbnail,
      characterAvatar: l.characterAvatar,
      characterName: l.characterName,
      achievements: l.achievements ?? [],
    }));

  const totalUnlocked = allAchievements.filter((a) =>
    unlockedAchievements.some((u) =>
      typeof u === 'string'
        ? u === a.id
        : (u as any).achievement_key === a.id
    )
  ).length;

  // State untuk filter level
  const [activeFilter, setActiveFilter] = useState('All');

  // Opsi filter & data yang ditampilkan
  const filterOptions = ['All', ...achievementsByLevel.map(l => l.levelTitle)];
  const displayedAchievements = activeFilter === 'All' 
    ? allAchievements 
    : achievementsByLevel.find(l => l.levelTitle === activeFilter)?.achievements || [];

  // ── Kolom kiri: data dinamis berdasarkan filter ──
  const activeLevel = achievementsByLevel.find(l => l.levelTitle === activeFilter);
  const avatarSrc = activeFilter === 'All'
    ? '/avatars/villain1.png'
    : activeLevel?.characterAvatar ?? '/avatars/villain1.png';
  const characterName = activeFilter === 'All'
    ? 'CAMPAIGN'
    : activeLevel?.characterName?.toUpperCase() ?? 'UNKNOWN';

  // Best time: format dari levelProgress
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  let bestTimeDisplay = '—';
  if (activeFilter === 'All') {
    // Tampilkan total best time gabungan semua level yang sudah selesai
    const completedLevels = achievementsByLevel.filter(l => levelProgress[l.levelId]?.completed);
    if (completedLevels.length > 0) {
      const totalBest = completedLevels.reduce((sum, l) => sum + (levelProgress[l.levelId]?.bestTime ?? 0), 0);
      bestTimeDisplay = formatTime(totalBest);
    }
  } else if (activeLevel) {
    const progress = levelProgress[activeLevel.levelId];
    if (progress?.completed) {
      bestTimeDisplay = formatTime(progress.bestTime);
    }
  }


  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'url(/backgrounds/splash_bg.png) center/cover no-repeat',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Georgia', serif",
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Overlay Gelap */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 0 }} />

      {/* Main Container: 2 Kolom */}
      <div style={{ zIndex: 1, width: 880, display: 'flex', gap: 32, height: '75vh' }}>
        
        {/* ======================= */}
        {/* KOLOM KIRI: INFO LEVEL  */}
        {/* ======================= */}
        <div style={{
          width: 240,
          background: '#e8d5b7',
          borderRadius: 4,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
          border: '1px solid #1a2a1a',
          flexShrink: 0
        }}>
          {/* Foto Karakter — dinamis berdasarkan filter */}
          <div style={{ 
            background: '#0e1f13',
            height: 290, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'flex-end',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <img 
              key={avatarSrc}
              src={avatarSrc}   
              alt="Character" 
              style={{ 
                width: '120%', height: '120%', objectFit: 'cover', objectPosition: 'center 55px',
                animation: 'fadeInAvatar 0.4s ease-out',
              }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            {/* Fallback silhouette icon */}
            
            {/* CSS animation for avatar transition */}
            <style>{`
              @keyframes fadeInAvatar {
                from { opacity: 0; transform: scale(1.05); }
                to   { opacity: 1; transform: scale(1); }
              }
            `}</style>
          </div>
          
          {/* Header Banner — nama karakter dinamis */}
          <div style={{
            background: '#153f1f',
            color: '#e8d5b7',
            textAlign: 'center',
            padding: '8px 0',
            fontWeight: 'bold',
            letterSpacing: 2,
            borderBottom: '2px solid #0a2e15',
            transition: 'all 0.3s ease',
          }}>
            {characterName}
          </div>

          {/* Level Name & Waktu Tercepat */}
          <div style={{ 
            padding: '24px 16px', 
            textAlign: 'center', 
            color: '#1a1a1a', 
            display: 'flex', 
            flexDirection: 'column', 
            flex: 1, 
            justifyContent: 'space-between' 
          }}>
            <div>
               <div style={{ fontSize: 20, fontWeight: 'bold', fontFamily: "'Georgia', serif" }}>
                 {activeFilter === 'All' ? 'SEMUA LEVEL' : activeFilter.toUpperCase()}
               </div>
               
               {/* Ornamen Garis & Bintang */}
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '16px 0' }}>
                  <div style={{ height: 1, width: '30%', background: '#8a7a6a' }} />
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#153f1f', color: '#e8d5b7', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #8a7a6a', fontSize: 14 }}>
                  </div>
                  <div style={{ height: 1, width: '30%', background: '#8a7a6a' }} />
               </div>
            </div>

            {/* Waktu Terbaik — dinamis dari levelProgress */}
            <div>
               <div style={{ fontSize: 11, letterSpacing: 2, color: '#4a4a4a', marginBottom: 4, fontFamily: 'sans-serif', fontWeight: 'bold' }}>
                 BEST TIME
               </div>
               <div style={{ 
                 fontSize: 24, fontWeight: 'bold', fontFamily: 'monospace', color: '#1a1a1a',
                 transition: 'all 0.3s ease',
               }}>
                 {bestTimeDisplay}
               </div>
               {activeFilter !== 'All' && activeLevel && !levelProgress[activeLevel.levelId]?.completed && (
                 <div style={{ fontSize: 10, color: '#888', fontFamily: 'sans-serif', marginTop: 4 }}>
                   Belum diselesaikan
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* ======================= */}
        {/* KOLOM KANAN: DAFTAR ACH */}
        {/* ======================= */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* Judul & Navigasi Filter */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              color: '#e8d5b7', fontSize: 32, fontWeight: 700,
              letterSpacing: 4, textTransform: 'uppercase',
              textShadow: '0 4px 15px rgba(0,0,0,0.9)',
            }}>
              ACHIEVEMENTS
            </div>
            <div style={{ color: '#8a7a6a', fontSize: 12, marginBottom: 16, fontFamily: 'sans-serif' }}>
              {totalUnlocked} / {allAchievements.length} Terbuka
            </div>

            {/* Tombol Filter berdasarkan Level */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
              {filterOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => setActiveFilter(opt)}
                  style={{
                    background: activeFilter === opt ? '#e8d5b7' : 'rgba(30,30,30,0.6)',
                    color: activeFilter === opt ? '#1a1a1a' : '#c8b89a',
                    border: '1px solid',
                    borderColor: activeFilter === opt ? '#e8d5b7' : '#4a4a4a',
                    padding: '6px 16px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontFamily: "'Georgia', serif",
                    fontWeight: activeFilter === opt ? 'bold' : 'normal',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    letterSpacing: 1,
                    fontSize: 12
                  }}
                >
                  {opt === 'All' ? 'SEMUA LEVEL' : opt}
                </button>
              ))}
            </div>
          </div>

          {/* List Achievements */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 10,
            overflowY: 'auto', paddingRight: 8, flex: 1
          }}>
            {displayedAchievements.map((ach) => {
              const isUnlocked = unlockedAchievements.some((u) => 
                typeof u === 'string' 
                  ? u === ach.id 
                  : (u as any).achievement_key === ach.id
              );

              return (
                <div key={ach.id} style={{
                  background: isUnlocked 
                     ? 'linear-gradient(90deg, rgba(40,35,25,0.95), rgba(20,20,20,0.9))' 
                     : 'rgba(25,25,25,0.7)',
                  border: isUnlocked 
                     ? '1px solid rgba(232,213,183,0.3)' 
                     : '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 4,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                }}>
                  {/* Icon Bagian Kiri */}
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: isUnlocked ? '#1a1a1a' : '#2a2a2a',
                    border: `2px solid ${isUnlocked ? (ach.isGolden ? '#fbbf24' : '#e8d5b7') : '#4a4a4a'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {isUnlocked ? (
                       looksLikeImagePath(ach.icon) ? (
                         <img src={resolveAssetPath(ach.icon)} style={{ width: 64, height: 64, objectFit: 'contain' }} alt="icon" />
                       ) : (
                         <span style={{ fontSize: 20 }}>{ach.icon}</span>
                       )
                    ) : (
                       <span style={{ fontSize: 20, filter: 'grayscale(1)', opacity: 0.3 }}>🔒</span>
                    )}
                  </div>

                  {/* Info Teks Bagian Tengah */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      color: isUnlocked ? (ach.isGolden ? '#fbbf24' : '#e8d5b7') : '#666',
                      fontSize: 15, fontWeight: 700,
                      fontFamily: "'Georgia', serif",
                      letterSpacing: 1
                    }}>
                      {isUnlocked ? ach.title : '???' }
                    </div>  
                    <div style={{
                      color: isUnlocked ? '#a0a0a0' : '#444',
                      fontSize: 12,
                      fontFamily: 'sans-serif', marginTop: 4,
                    }}>
                      {isUnlocked ? ach.description : 'Selesaikan tantangan untuk membuka informasi.'}
                    </div>
                  </div>

                  {/* Status Bagian Kanan (Completed/Incomplete) */}
                  <div style={{
                     flexShrink: 0,
                     fontSize: 12,
                     fontWeight: 'bold',
                     color: isUnlocked ? (ach.isGolden ? '#fbbf24' : '#e8d5b7') : '#555',
                     textTransform: 'uppercase',
                     fontFamily: 'sans-serif',
                     letterSpacing: 1,
                     borderLeft: '1px solid rgba(255,255,255,0.1)',
                     paddingLeft: 16
                  }}>
                     {isUnlocked ? 'Completed' : 'Incomplete'}
                  </div>
                </div>
              );
            })}

            {displayedAchievements.length === 0 && (
              <div style={{
                color: '#666', textAlign: 'center',
                fontFamily: 'sans-serif', fontSize: 14, padding: '40px 0',
              }}>
                Tidak ada achievement di level ini.
              </div>
            )}
          </div>

          {/* Tombol Back */}
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
            <MetalButton
              onClick={(e) => { e.stopPropagation(); goTo('splash'); }}
              label="← BACK"
              small
            />
          </div>
        </div>

      </div>
    </div>
  );
}