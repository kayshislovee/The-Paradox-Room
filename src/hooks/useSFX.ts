const sfxCache: Record<string, HTMLAudioElement> = {};

function playSound(src: string, volume = 0.7) {
  try {
    if (!sfxCache[src]) {
      sfxCache[src] = new Audio(src);
    }
    const audio = sfxCache[src];
    audio.currentTime = 0;
    audio.volume = volume;
    audio.play().catch(() => {});
  } catch {}
}

export function useSFX() {
  return {
    playWin: () => playSound('/audio/sfx/winner.mp3', 0.8),
    playLose: () => playSound('/audio/sfx/gameover.mp3', 0.8),
    playClick: () => playSound('/audio/sfx/kode.mp3', 0.5),
    playSuccess: () => playSound('/audio/sfx/correct.mp3', 0.7),
    playError: () => playSound('/audio/sfx/wrong.mp3', 0.6),
    playHint: () => playSound('/audio/sfx/hint.mp3', 0.6),
    playNotes: () => playSound('/audio/sfx/notes.mp3', 0.6),
    playNewGame: () => playSound('/audio/sfx/splash.mp3', 0.7),
  };
}