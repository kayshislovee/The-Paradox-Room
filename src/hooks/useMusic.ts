import { useEffect } from 'react';
import { useSettingsStore } from '../store/gameStore';

let currentAudio: HTMLAudioElement | null = null;
let currentSrc = '';

export function useMusic(src: string, defaultVolume?: number) {
  const musicVolume = useSettingsStore((s) => s.musicVolume);
  const musicMuted = useSettingsStore((s) => s.musicMuted);

  useEffect(() => {
    if (!src) {
      currentAudio?.pause();
      currentAudio = null;
      currentSrc = '';
      return;
    }

    if (currentSrc === src && currentAudio) {
      // Sudah ada audio yang jalan, jangan restart
      if (currentAudio.paused && !musicMuted) {
        currentAudio.play().catch(() => {});
      }
      return;
    }

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    currentAudio = new Audio(src);
    currentAudio.loop = true;
    currentAudio.volume = musicMuted ? 0 : (defaultVolume ?? musicVolume);
    currentAudio.play().catch(() => {});
    currentSrc = src;
  }, [src]);

  useEffect(() => {
    if (!currentAudio) return;
    if (musicMuted) {
      currentAudio.volume = 0;
      currentAudio.pause();
    } else {
      currentAudio.volume = defaultVolume ?? musicVolume;
      currentAudio.play().catch(() => {});
    }
  }, [musicMuted, musicVolume, defaultVolume]);
}