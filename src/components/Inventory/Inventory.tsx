import { useState } from 'react';
import { useGameStore, useSettingsStore } from '../../store/gameStore';
import styles from './Inventory.module.css';

export function Inventory() {
  const { discoveredClues, goTo } = useGameStore();
 const { musicVolume, musicMuted, setMusicVolume, toggleMusicMuted } =
  useSettingsStore();
  const [tab, setTab] = useState<'clues' | 'settings'>('clues');

  return (
    <aside className={styles.panel}>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'clues' ? styles.active : ''}`}
          onClick={() => setTab('clues')}
        >
          🔍 Clue ({discoveredClues.length})
        </button>
        <button
          className={`${styles.tab} ${tab === 'settings' ? styles.active : ''}`}
          onClick={() => setTab('settings')}
        >
          ⚙️ Setting
        </button>
      </div>

      {/* Clue tab */}
      {tab === 'clues' && (
        <div className={styles.list}>
          {discoveredClues.length === 0 && (
            <p className={styles.empty}>Belum ada clue ditemukan.<br /><br />Klik objek di ruangan untuk menemukan clue!</p>
          )}
          {discoveredClues.map((clue, idx) => (
            <div key={clue.id} className={styles.clueCard}>
              <div className={styles.clueIndex}>#{idx + 1}</div>
              <div>
                <div className={styles.clueContent}>{clue.content}</div>
                <div className={styles.clueHint}>{clue.hint}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Settings tab */}
      {tab === 'settings' && (
        <div className={styles.settingsList}>

          {/* Music on/off */}
          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>🎵 Music</span>
            <button
              className={`${styles.toggleBtn} ${!musicMuted ? styles.toggleOn : styles.toggleOff}`}
              onClick={toggleMusicMuted}
            >
              {musicMuted ? 'OFF' : 'ON'}
            </button>
          </div>

          {/* Music volume */}
          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>🔊 Volume</span>
            <span className={styles.settingValue}>{Math.round(musicVolume * 100)}%</span>
          </div>
          <input
            type="range" min={0} max={1} step={0.05}
            value={musicVolume}
            onChange={(e) => setMusicVolume(Number(e.target.value))}
            className={styles.slider}
          />

         

          {/* Keluar ke menu */}
          <button
            className={styles.exitBtn}
            onClick={() => goTo('main_menu')}
          >
            🚪 Keluar ke Menu
          </button>
        </div>
      )}
    </aside>
  );
}