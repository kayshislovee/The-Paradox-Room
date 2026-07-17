import { useEffect } from 'react';
import { useSettingsStore } from '../store/gameStore';

let currentAudio: HTMLAudioElement | null = null;
let currentSrc = '';

// Fungsi ini bisa dipanggil manual dari luar hook
export function playMusic(src: string, volume = 0.7) {
  if (!src) {
    currentAudio?.pause();
    currentAudio = null;
    currentSrc = '';
    return;
  }

  if (currentSrc === src && currentAudio) {
    if (currentAudio.paused) {
      currentAudio.play().catch(() => {});
    }
    return;
  }

  currentAudio?.pause();
  currentAudio = new Audio(src);
  currentAudio.loop = true;
  currentAudio.volume = volume;
  currentAudio.play().catch(() => {});
  currentSrc = src;
}

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
      if (currentAudio.paused && !musicMuted) {
        currentAudio.play().catch(() => {});
      }
      return;
    }

    currentAudio?.pause();
    currentAudio = new Audio(src);
    currentAudio.loop = true;
     currentAudio.volume = 0.7; 
    currentAudio.play().catch(() => {});
    currentSrc = src;
  }, [src]);

  useEffect(() => {
    if (!currentAudio) return;
    if (musicMuted) {
      currentAudio.volume = 0;
      currentAudio.pause();
    } else {
      currentAudio.volume = musicVolume; 
      currentAudio.play().catch(() => {});
    }
  }, [musicMuted, musicVolume, defaultVolume]);
}