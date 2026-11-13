import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { multiplayer } from '../lib/multiplayer';
import type { LobbyData, LobbyPlayer, SharedGameState } from '../lib/multiplayer';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';
const POLL_INTERVAL = 3000;

export type { LobbyData, LobbyPlayer, SharedGameState };

export function useLobby() {
  const token = useGameStore((s) => s.token);
  const player = useGameStore((s) => s.player);
  const completeLevel = useGameStore((s) => s.completeLevel);
  const screen = useGameStore((s) => s.screen);

  const [lobby, setLobby] = useState<LobbyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prevPlayersCount = useRef<number>(0);
  const prevStatus = useRef<string>('waiting');
  const isInGame = useRef<boolean>(false);

  const setLobbyCode = useGameStore((s) => s.setLobbyCode);

  const headers = useCallback(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  // ── Transisi status & deteksi disconnect ───────────────────────────────────
  // Dipisah dari setLobby() supaya tidak lagi menulis store / melakukan fetch
  // di dalam React state updater (pola lama memicu render.side-effect).
  const handleLobbyData = useCallback(
    (data: LobbyData) => {
      const prevCount = prevPlayersCount.current;
      const prevStat = prevStatus.current;

      // Karakter milik kita harus selalu ikut — sebelumnya hanya host yang
      // mengisinya, sehingga guest level 7 berperan sebagai mode single-player.
      // Harus dihitung SEBELUM startLevel(), karena startLevel() membaca
      // playerCharacter untuk menentukan activeCharacter.
      const myPlayer = player && data.players
        ? data.players.find((p) => p.id === player.id)
        : undefined;

      if (myPlayer?.character && useGameStore.getState().playerCharacter !== myPlayer.character) {
        useGameStore.getState().setPlayerCharacter(myPlayer.character);
      }
      // Kalau karakter pemain ini dilepas (pivot jadi null), bersihkan juga
      // state lokal supaya tidak memakai karakter yang sudah tidak dimiliki.
      if (myPlayer && !myPlayer.character && useGameStore.getState().playerCharacter) {
        useGameStore.getState().setPlayerCharacter(null);
      }

      if (isInGame.current && data.players.length < prevCount && data.status === 'playing') {
        // Player yang keluar memicu 'player_left' broadcast yang berisi nama
        // playernya (triggeredBy). Pakai nama itu di notifikasi.
        //
        // PENTING: tandiai sesi lokal sebagai abandoned. Kalau tidak, polling
        // berikutnya melihat lobby kosong (status 'finished') dan menganggap
        // level MENANG -> bintang + win screen padahal tidak pernah selesai.
        isInGame.current = false;
        useGameStore.getState().showNotification(
          'Salah satu player telah keluar. Kembali ke menu.',
          'error'
        );
        setTimeout(async () => {
          await fetch(`${API_BASE}/lobby/${data.lobby_code}/leave`, {
            method: 'POST',
            headers: headers(),
          }).catch(() => {});
          useGameStore.getState().goTo('splash');
        }, 2000);
      }

      if (prevStat === 'waiting' && data.status === 'playing') {
        const currentScreen = useGameStore.getState().screen;
        if (currentScreen !== 'gameplay') {
          isInGame.current = true;
          useGameStore.getState().setLobbyCode(data.lobby_code);

          // Masuk level memakai startLevel() persis seperti jalur host di
          // LobbyScreen.handleStart(). Sebelumnya di sini diisi
          // `screen: 'loading'`, tapi App.tsx tidak punya case 'loading' —
          // akibatnya LobbyScreen ter-unmount sebelum sempat memanggil
          // startLevel(), jadi game tidak pernah benar-benar dimulai.
          useGameStore.getState().startLevel(data.level_key);
        }
      }

      if (isInGame.current && prevStat === 'playing' && data.status === 'finished') {
        isInGame.current = false;

        // finish_type: 'win' = level benar-benar selesai, 'lose' = kalah,
        // 'abandon'/null = pemain keluar, level TIDAK selesai.
        // Default TIDAK boleh 'win' — kalau begitu, pemain yang keluar
        // akan tetap dapat bintang + win screen padahal level belum selesai.
        const finishType = data.game_state?.finish_type ?? 'abandon';
        if (finishType === 'win') {
          completeLevel();
        } else if (finishType === 'lose') {
          useGameStore.getState().goTo('lose');
        } else {
          // Sesi dibatalkan (pemain keluar). Kembali ke menu tanpa bintang.
          useGameStore.getState().showNotification(
            'Sesi multiplayer dibatalkan. Level tidak diselesaikan.',
            'error'
          );
          useGameStore.getState().goTo('splash');
        }
      }

      // Pilihan karakter scene 5 per-player. Diterapkan SETELAH transisi
      // waiting→playing karena startLevel() me-reset nilainya ke null; kalau
      // diterapkan lebih dulu, pilihannya akan terhapus lagi.
      const myScene5 = myPlayer?.scene5_character ?? null;
      if (myScene5 && useGameStore.getState().scene5Character !== myScene5) {
        useGameStore.getState().setScene5Character(myScene5);
      }

      // Pilihan karakter scene 5 SEMUA pemain, supaya UI bisa menonaktifkan
      // karakter yang sudah dipakai pemain lain (satu karakter = satu pemain).
      const choices: Record<string, string> = {};
      for (const p of data.players) {
        if (p.scene5_character) choices[String(p.id)] = p.scene5_character;
      }
      const currentChoices = useGameStore.getState().scene5Choices;
      const choicesChanged =
        Object.keys(choices).length !== Object.keys(currentChoices).length ||
        Object.keys(choices).some((k) => choices[k] !== currentChoices[k]);
      if (choicesChanged) useGameStore.getState().setScene5Choices(choices);

      prevPlayersCount.current = data.players.length;
      prevStatus.current = data.status;
      setLobby(data);

      // Editors ini hanya valid bila belum ada revisi yang lebih baru masuk
      // lewat websocket (mis. event kita sendiri yang tiba duluan).
      multiplayer.publishState(data.game_state);
    },
    [completeLevel, headers, player]
  );

  // ── Refresh data lobby ─────────────────────────────────────────────────────
  const refreshLobby = useCallback(
    async (code: string) => {
      try {
        const data = await multiplayer.fetchLobby(code);
        if (!data) return;
        handleLobbyData(data);
      } catch (err) {
        console.error('[useLobby] Failed to refresh lobby:', err);
        if (isInGame.current) {
          useGameStore.getState().showNotification('Koneksi terputus. Kembali ke menu.', 'error');
          setTimeout(() => useGameStore.getState().goTo('splash'), 2000);
        }
      }
    },
    [handleLobbyData]
  );

  // ── Event realtime ─────────────────────────────────────────────────────────
  const lobbyCodeFromState = useGameStore((s) => s.lobbyCode);
  useEffect(() => {
    if (!lobbyCodeFromState) return;

    multiplayer.subscribe(lobbyCodeFromState);

    return multiplayer.onStateEvent(({ action, state, triggeredBy }) => {
      const code = useGameStore.getState().lobbyCode;
      if (!code) return;

      // Sinkronisasi pause/resume timer antar player.
      if (action === 'timer_paused') {
        const paused = !!state?.timer_paused;
        const store = useGameStore.getState();
        const isSelf = triggeredBy === store.player?.username;
        if (paused) store.pauseTimer(); else store.resumeTimer();
        // Player lain yang pause → tampilkan pause screen & tunggu.
        if (!isSelf) {
          store.setRemotePaused(paused, paused ? triggeredBy ?? null : null);
          store.showNotification(
            paused ? `${triggeredBy} menjeda game` : `${triggeredBy} melanjutkan game`,
            'info'
          );
        } else {
          // Pauser sendiri: clear remotePaused (dia yang kontrol).
          store.setRemotePaused(false, null);
        }
        return;
      }

      // Player keluar → notifikasi nama player ke player yang masih online.
      if (action === 'player_left') {
        const store = useGameStore.getState();
        if (triggeredBy && triggeredBy !== store.player?.username) {
          store.showNotification(`${triggeredBy} telah keluar`, 'error');
        }
      }

      if (
        action === 'player_joined' ||
        action === 'player_left' ||
        action === 'game_started' ||
        action === 'level_completed' ||
        action === 'level_lost' ||
        action === 'game_reset' ||
        action === 'character_assigned' ||
        action === 'character_released' ||
        action === 'scene5_character_selected'
      ) {
        refreshLobby(code);
      }
    });
  }, [lobbyCodeFromState, refreshLobby]);

  // ── Buat lobby baru ────────────────────────────────────────────────────────
  const createLobby = async (levelKey: string, maxPlayers = 4) => {
    if (!token) {
      setError('Login terlebih dahulu!');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/lobby`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ level_key: levelKey, max_players: maxPlayers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Gagal membuat lobby');

      setLobbyCode(data.lobby_code);
      prevPlayersCount.current = data.players.length;
      prevStatus.current = data.status;
      multiplayer.subscribe(data.lobby_code);

      // Respons /lobby tidak memuat game_state, jadi state awal di-collapse manual.
      setLobby({ ...data, game_state: emptyState() } as LobbyData);
      return data;
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Join lobby dengan kode ─────────────────────────────────────────────────
  const joinLobby = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/lobby/join`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ code: code.toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Gagal join lobby');

      // Set kode dulu: applySharedGameState() menolak saat lobbyCode masih null.
      setLobbyCode(data.lobby_code);
      multiplayer.subscribe(data.lobby_code);
      handleLobbyData(data as LobbyData);
      return data;
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Host mulai game ────────────────────────────────────────────────────────
  const startGame = async () => {
    if (!lobby) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/lobby/${lobby.lobby_code}/start`, {
        method: 'POST',
        headers: headers(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data;
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Sync level selesai / gagal ──────────────────────────────────────────────
  // Kode diambil dari store (bukan dari state `lobby`) karena host sudah
  // memanggil silentExitLobby() sebelum masuk gameplay — kalau hanya memakai
  // `lobby`, sinkronisasi win/lose tidak pernah terkirim sama sekali.
  const syncLevelComplete = async () => {
    const code = lobby?.lobby_code ?? useGameStore.getState().lobbyCode;
    if (!code) return;
    await fetch(`${API_BASE}/lobby/${code}/complete`, {
      method: 'POST',
      headers: headers(),
    }).catch(() => console.warn('Gagal sync level complete'));
  };

  const syncLose = async () => {
    const code = lobby?.lobby_code ?? useGameStore.getState().lobbyCode;
    if (!code) return;
    await fetch(`${API_BASE}/lobby/${code}/lose`, {
      method: 'POST',
      headers: headers(),
    }).catch(() => {});
  };

  // ── Keluar dari lobby ──────────────────────────────────────────────────────
  // Lepaskan tampilan lobby, tapi JANGAN menyentuh isInGame / prevStatus:
  // host memakai ini sebelum masuk gameplay, dan kedua flag itu dipakai untuk
  // deteksi disconnect serta sinkron win/lose.
  const silentExitLobby = () => {
    setLobby(null);
  };

  const leaveLobby = async () => {
    const code = lobby?.lobby_code ?? useGameStore.getState().lobbyCode;
    if (!code) return;
    try {
      await fetch(`${API_BASE}/lobby/${code}/leave`, {
        method: 'POST',
        headers: headers(),
      });
      multiplayer.unsubscribe();
      setLobby(null);
      isInGame.current = false;
    } catch {
      console.warn('Gagal leave lobby');
    }
  };

  const exitLobby = async () => {
    const code = lobby?.lobby_code ?? useGameStore.getState().lobbyCode;
    if (!code) {
      setLobby(null);
      setLobbyCode(null);
      isInGame.current = false;
      return;
    }
    await fetch(`${API_BASE}/lobby/${code}/exit`, {
      method: 'POST',
      headers: headers(),
    }).catch(() => {});

    multiplayer.unsubscribe();
    setLobby(null);
    setLobbyCode(null);
    isInGame.current = false;
    prevStatus.current = 'waiting';
    prevPlayersCount.current = 0;
  };

  // Dipakai untuk pulih sesi setelah refresh / reconnect.
  const checkMyLobby = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/lobby/my`, { headers: headers() });
      if (!res.ok) return;
      const data = await res.json();
      if (!data) return;

      setLobbyCode(data.lobby_code);
      multiplayer.subscribe(data.lobby_code);
      handleLobbyData(data as LobbyData);
    } catch {
      /* diamkan */
    }
  }, [token, headers, handleLobbyData]);

  // Detect saat kembali ke menu → auto leave lobby
  useEffect(() => {
    if (screen === 'splash' && isInGame.current && useGameStore.getState().lobbyCode) {
      leaveLobby();
    }
  }, [screen]);

  useEffect(() => {
    if (screen === 'win' && isInGame.current) {
      useGameStore.getState().stopVoiceCallback?.();
      isInGame.current = false;
      syncLevelComplete().then(() => {
        exitLobby();
      });
    }
  }, [screen]);

  useEffect(() => {
    if (screen === 'lose' && isInGame.current) {
      useGameStore.getState().stopVoiceCallback?.();
      isInGame.current = false;
      syncLose().then(() => {
        exitLobby();
      });
    }
  }, [screen]);

  // ── Polling sebagai jaring pengaman Realtime ───────────────────────────────
  useEffect(() => {
    if (!lobby?.lobby_code || lobby.status === 'finished') return;

    const interval = setInterval(() => {
      refreshLobby(lobby.lobby_code);
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [lobby?.lobby_code, lobby?.status, refreshLobby]);

  useEffect(() => {
    if ((screen === 'splash' || screen === 'level_select') && isInGame.current) {
      exitLobby();
    }
  }, [screen]);

  useEffect(() => {
    return () => multiplayer.unsubscribe();
  }, []);

  // ── Auto-leave saat close tab/refresh ──────────────────────────────────────
  useEffect(() => {
    const handleUnload = () => {
      const code = lobby?.lobby_code ?? useGameStore.getState().lobbyCode;
      if (!code) return;

      const currentToken = useGameStore.getState().token;
      if (!currentToken) return;

      const blob = new Blob([JSON.stringify({ token: currentToken })], {
        type: 'application/json',
      });
      navigator.sendBeacon(`${API_BASE}/lobby/${code}/exit-beacon`, blob);
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [lobby]);

  const isHost = !!player && lobby?.host_id === player.id;

  return {
    lobby,
    loading,
    error,
    isHost,
    createLobby,
    joinLobby,
    startGame,
    syncAction: multiplayer.syncAction,
    leaveLobby,
    syncLevelComplete,
    checkMyLobby,
    exitLobby,
    syncLose,
    syncPuzzleInput: multiplayer.syncPuzzleInput,
    useSharedHint: multiplayer.useSharedHint,
    assignCharacter: multiplayer.assignCharacter,
    releaseCharacter: multiplayer.releaseCharacter,
    selectScene5Character: multiplayer.selectScene5Character,
    silentExitLobby,
    refreshLobby,
  };
}

function emptyState(): SharedGameState {
  return {
    solved_puzzles: [],
    used_hotspots: [],
    found_treasures: [],
    inventory: [],
    current_scene_id: null,
    time_elapsed: 0,
    finish_type: 'win',
    puzzle_inputs: {},
    shared_hint_tokens: 5,
    shared_hints_used: 0,
    last_input_by: null,
    released_character: null,
    scene5_character: null,
    revision: 0,
    character_inventories: {},
    discovered_clues: [],
    last_input_at: null,
    timer_paused: false,
  };
}