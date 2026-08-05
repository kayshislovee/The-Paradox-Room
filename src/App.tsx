import { useState, useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { Splash } from './components/Splash/Splash';
import { LevelSelect } from './components/LevelSelect/LevelSelect';
import { GameScene } from './components/GameScene/GameScene';
import { WinScreen } from './components/WinScreen/WinScreen';
import { Settings } from './components/Settings/Settings';
import { LoadingScreen } from './components/LoadingScreen/LoadingScreen';
import { LEVELS } from './data/levels';
import { DialogScreen } from './components/Dialog/DialogScreen';
import { AuthScreen } from './components/Auth/AuthScreen';
import { ProfileIcon } from './components/Profile/ProfileIcon';
import { AchievementScreen } from './components/Achievement/AchievementScreen';
import { setUnauthorizedHandler } from './hooks/useapi';
import { ComicScene } from './components/Comic/ComicScene';
import type { ComicPage } from './types/game.types';
import { DoorEscapeAnimation } from './components/GameScene/DoorEscapeAnimation';
import { LoseScreen } from './components/WinScreen/LoseScreen';


export default function App() {
  const screen = useGameStore((s) => s.screen);
  const player = useGameStore((s) => s.player);
  const isGuest = useGameStore((s) => s.isGuest);
  const token = useGameStore((s) => s.token);
  const logout = useGameStore((s) => s.logout);
  const startLevel = useGameStore((s) => s.startLevel);
  const [showComic, setShowComic] = useState(false);
  const [comicPageIndex, setComicPageIndex] = useState(0);

  const showProfile = ['splash', 'main_menu', 'level_select'].includes(screen);
  const [showLoading, setShowLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [pendingLevelId, setPendingLevelId] = useState<string | null>(null);

  useEffect(() => {
    // Daftarkan handler logout global
    setUnauthorizedHandler(() => {
      logout();
    });
  }, [logout]);

  useEffect(() => {
    // Cek validitas token saat app pertama load
    if (!token) return;

    const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

    fetch(`${API_BASE}/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    }).then((res) => {
      if (res.status === 401) logout();
    }).catch(() => {
      // Network error, biarkan saja
    });
  }, [token, logout]);

  if (!player && !isGuest) {
    return <AuthScreen />;
  }

  const handleStartLevel = (levelId: string) => {
    setPendingLevelId(levelId);
    setShowLoading(true);
  };

const handleLoadingDone = async () => {
  const level = LEVELS.find((l) => l.id === pendingLevelId);
  
  // Cek comic dulu sebelum dialog
  if ((level as any)?.comicSrc) {
    setShowLoading(false);
    setShowComic(true);  // ← tampilkan comic dulu
    return;
  }

  if (level?.introDialog && level.introDialog.length > 0) {
    setShowLoading(false);
    setShowDialog(true);
  } else {
    if (pendingLevelId) {
      await startLevel(pendingLevelId);
      setShowLoading(false);
      setPendingLevelId(null);
    }
  }
};

  const handleDialogDone = async () => {
    const levelId = pendingLevelId;
    if (levelId) {
      await startLevel(levelId);
      
    }
    setShowDialog(false);
    setShowLoading(false);
    setPendingLevelId(null);
  };

  const pendingLevel = LEVELS.find((l) => l.id === pendingLevelId);

  return (
    <>
      {showProfile && <ProfileIcon />}
      <DoorEscapeAnimation />
      {showLoading && pendingLevel ? (
        <LoadingScreen levelId={pendingLevelId!} onDone={handleLoadingDone} />
      ) : showDialog && pendingLevel?.introDialog ? (
        <DialogScreen
          lines={pendingLevel.introDialog}
          background={pendingLevel.scenes[0]?.backgroundImage}
          music={pendingLevel.dialogMusic}
          onDone={handleDialogDone}
        />
      ) : null}

      {showComic && pendingLevelId && (() => {
  const level = LEVELS.find(l => l.id === pendingLevelId);
  const comicPages = (level as any)?.comicPages as ComicPage[] | undefined;
  const currentPage = comicPages?.[comicPageIndex];
  if (!currentPage) return null;

  return (
    <ComicScene
      src={currentPage.src}
      panels={currentPage.panels}
      onDone={async () => {
        const isLastPage = comicPageIndex >= (comicPages?.length ?? 1) - 1;
        if (!isLastPage) {
          // Lanjut ke halaman berikutnya
          setComicPageIndex((i) => i + 1);
          return;
        }
        // Semua halaman selesai
        setShowComic(false);
        setComicPageIndex(0);
        const lv = LEVELS.find((l) => l.id === pendingLevelId);
        if (lv?.introDialog && lv.introDialog.length > 0) {
          setShowDialog(true);
        } else if (pendingLevelId) {
          await startLevel(pendingLevelId);
          setPendingLevelId(null);
        }
      }}
      isLastPage={comicPageIndex >= (comicPages?.length ?? 1) - 1}
    />
  );
})()}
      
{!showLoading && !showDialog && !showComic && (() => {
  switch (screen) {
    case 'splash':
    case 'main_menu':
      return <Splash />;
    case 'level_select':
      return <LevelSelect onStartLevel={handleStartLevel} />;
    case 'gameplay':
    case 'win':
    case 'lose':
       return (
    <>
      <div style={{ display: screen === 'gameplay' ? 'block' : 'none' }}>
        <GameScene />
      </div>
      {screen === 'win' && <WinScreen onStartLevel={handleStartLevel} />}
      {screen === 'lose' && <LoseScreen onStartLevel={handleStartLevel} />}
    </>
  );
    case 'settings':
      return <Settings />;
    case 'achievements':
      return <AchievementScreen />;
    default:
      return <Splash />;
  }
})()}
    </>
  );
}