import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { useGameStore } from './store/gameStore';

// DEV ONLY: expose store di console supaya mudah cek data yang benar-benar
// dipakai game (mis. isi achievement/treasure dari API).
// Contoh: __gameStore.getState().levels.find(l => l.id === 'level_1').achievements
if (import.meta.env.DEV) {
  (window as any).__gameStore = useGameStore;
}

createRoot(document.getElementById('root')!).render(
    <App />
);
