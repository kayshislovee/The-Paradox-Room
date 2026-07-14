import { useState } from 'react';
import { useGameStore } from './store/gameStore';
import { Splash } from './components/Splash/Splash';
import { LevelSelect } from './components/LevelSelect/LevelSelect';
import { GameScene } from './components/GameScene/GameScene';
import { WinScreen } from './components/WinScreen/WinScreen';
import { Settings } from './components/Settings/Settings';
import { LoadingScreen } from './components/LoadingScreen/LoadingScreen';
import { LEVELS } from './data/levels';

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const [showLoading, setShowLoading] = useState(false);
  const [pendingLevelId, setPendingLevelId] = useState<string | null>(null);
  const startLevel = useGameStore((s) => s.startLevel);

  // Override startLevel untuk tampilkan loading dulu
  const handleStartLevel = (levelId: string) => {
    setPendingLevelId(levelId);
    setShowLoading(true);
  };

  const handleLoadingDone = () => {
    setShowLoading(false);
    if (pendingLevelId) {
      startLevel(pendingLevelId);
      setPendingLevelId(null);
    }
  };

  const pendingLevel = LEVELS.find((l) => l.id === pendingLevelId);

  if (showLoading && pendingLevel) {
    return (
      <LoadingScreen
        levelTitle={pendingLevel.title}
        levelDescription={pendingLevel.description}
        thumbnail={pendingLevel.thumbnail}
        onDone={handleLoadingDone}
      />
    );
  }

  switch (screen) {
    case 'splash':
    case 'main_menu':    return <Splash />;
    case 'level_select': return <LevelSelect onStartLevel={handleStartLevel} />;
    case 'gameplay':     return <GameScene />;
    case 'win': return <WinScreen onStartLevel={handleStartLevel} />;
    case 'settings':     return <Settings />;
    default:             return <Splash />;
  }
}