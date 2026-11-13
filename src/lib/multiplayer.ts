/**
 * Klien multiplayer — satu-satunya pemilik channel Reverb untuk seluruh aplikasi.
 *
 * Kenapa modul, bukan hook?
 *useLobby() pernah diinstansiasi 4x (App, GameScene, Level7Scene, Inventory).
 * Setiap instance punya state machine sendiri dan subscribe channel yang sama,
 * sehingga sinkronisasi hotspot/item tidak pernah sampai ke peer.
 * Di sini channel, revision, dan penulisan state hidup di satu tempat; hook
 * React hanya jadi tampilan tipis atas state itu.
 */

import { echo } from '../echo';
import { useGameStore } from '../store/gameStore';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

// ─── Bentuk payload yang dikirim server ──────────────────────────────────────

export interface SharedGameState {
  solved_puzzles: string[];
  used_hotspots: string[];
  found_treasures: string[];
  inventory: string[];
  current_scene_id: string | null;
  time_elapsed: number;
  finish_type: 'win' | 'lose';
  puzzle_inputs: Record<string, any>;
  shared_hint_tokens: number;
  shared_hints_used: number;
  last_input_by: string | null;
  released_character: string | null;
  scene5_character: string | null;
  revision: number;
  character_inventories: Record<string, string[]>;
  discovered_clues: string[];
  last_input_at: string | null;
  timer_paused: boolean;
  /** Id reactor yang sedang glitch (shared antar pemain). */
  glitched_reactors?: string[];
  /** Id reactor yang glitch-nya sudah diperbaiki Katsuragi. */
  glitched_cleared?: string[];
  /** Reactor yang sedang menampilkan fake info (shared antar pemain). */
  fake_reactors?: string[];
  /** Reactor yang fake info-nya sudah teridentifikasi. */
  fake_cleared?: string[];
  /** Fake info sudah muncul (shared). */
  fake_info_active?: boolean;
  /** Ada reactor yang sudah diselesaikan (shared). */
  any_reactor_solved?: boolean;
  /** Sudah ada pemain yang login ke pod (shared). */
  pod_logged_in?: boolean;
}

export interface LobbyPlayer {
  id: number;
  username: string;
  avatar: string | null;
  role: 'host' | 'member';
  is_ready: boolean;
  character?: string | null;
  /** Karakter pilihan sendiri untuk scene 5 (per-player). */
  scene5_character?: string | null;
}

export interface LobbyData {
  lobby_code: string;
  level_key: string;
  status: 'waiting' | 'playing' | 'finished';
  max_players: number;
  host_id: number;
  players: LobbyPlayer[];
  game_state: SharedGameState;
}

export type SyncAction =
  | 'puzzle_solved'
  | 'hotspot_used'
  | 'item_collected'
  | 'item_removed'
  | 'clue_discovered'
  | 'treasure_found'
  | 'scene_changed'
  | 'character_state'
  | 'time_sync'
  | 'timer_paused'
  | 'reactor_state'
  | 'pod_login';

export interface StateEvent {
  state: SharedGameState;
  action: string;
  triggeredBy: string;
  revision: number;
}

// ─── State internal ───────────────────────────────────────────────────────────

type Listener = (event: StateEvent) => void;

let channel: any = null;
let mazeChannel: any = null;
let subscribedCode: string | null = null;
let lastRevision = -1;
const listeners = new Set<Listener>();
let reactorStateSyncQueue: Promise<void> = Promise.resolve();

// ─── Posisi realtime (whisper di channel privat) ─────────────────────────────
// Posisi karakter mini-game TIDAK dikirim lewat HTTP lagi. Setiap update dulu
// menulis DB + broadcast seluruh game state, dan API dev (php -S) hanya punya
// satu worker — antreannya menumpuk sehingga gerakan teammate tertinggal dan
// patah-patah. Whisper hanya menumpang WebSocket yang sudah terbuka.
export interface RemotePose { x: number; y: number; dir: string; frame: number }

interface PoseSample extends RemotePose { at: number }

const poseBuffers = new Map<string, PoseSample[]>();
const POSE_BUFFER_MS = 2000;

function pushPoseSample(key: string, data: any, at: number) {
  if (!key || typeof data?.x !== 'number' || typeof data?.y !== 'number') return;
  const buf = poseBuffers.get(key) ?? [];
  buf.push({
    x: data.x,
    y: data.y,
    dir: typeof data.dir === 'string' ? data.dir : 'idle',
    frame: typeof data.frame === 'number' ? data.frame : 0,
    at,
  });
  while (buf.length > 2 && at - buf[0].at > POSE_BUFFER_MS) buf.shift();
  if (buf.length > 120) buf.splice(0, buf.length - 120);
  poseBuffers.set(key, buf);
}

/**
 * Ambil posisi teammate yang sudah diinterpolasi pada waktu `now`.
 * `delayMs` sengaja menahan render sedikit di belakang sampel terakhir supaya
 * selalu ada dua sampel untuk diinterpolasi (mulus, bukan melompat).
 */
export function sampleRemotePose(key: string, now: number, delayMs = 100): RemotePose | null {
  const buf = poseBuffers.get(key);
  if (!buf || buf.length === 0) return null;

  const last = buf[buf.length - 1];
  // Tidak ada kabar > 1.2s → biarkan pemanggil pakai fallback.
  if (now - last.at > 1200) return null;

  const target = now - delayMs;
  let a = buf[0];
  let b = last;

  if (target <= buf[0].at) {
    a = b = buf[0];
  } else if (target >= last.at) {
    a = b = last;
  } else {
    for (let i = 0; i < buf.length - 1; i++) {
      if (buf[i].at <= target && buf[i + 1].at >= target) {
        a = buf[i];
        b = buf[i + 1];
        break;
      }
    }
  }

  const span = Math.max(1, b.at - a.at);
  const t = Math.max(0, Math.min(1, (target - a.at) / span));

  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    dir: b.dir,
    frame: b.frame,
  };
}

/** Resolve token langsung dari store agar tidak perlu terus menyinkronkan. */
function getToken(): string | null {
  return useGameStore.getState().token;
}

function getCode(): string | null {
  return useGameStore.getState().lobbyCode;
}

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

async function request(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers ?? {}) },
  });
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { ok: res.ok, status: res.status, body };
}

// ─── Publikasi state ke store ─────────────────────────────────────────────────

function emit(event: StateEvent) {
  // Buang event basi: tanpa ini, echo milik kita sendiri bisa menimpa state
  // lokal yang justru lebih baru (mis. saat 2 orang mengetik bergantian).
  if (typeof event.revision === 'number') {
    if (event.revision < lastRevision) return;
    lastRevision = event.revision;
  }

  useGameStore.getState().applySharedGameState(event.state, event.action, event.triggeredBy);
  listeners.forEach((fn) => fn(event));
}

/** Dipakai useLobby saat polling: abaiki kalau revisi sudah pernah diterima. */
function publishIfNewer(state: SharedGameState): boolean {
  const revision = typeof state?.revision === 'number' ? state.revision : 0;
  if (revision < lastRevision) return false;
  lastRevision = revision;

  useGameStore.getState().applySharedGameState(state, 'poll', null);
  return true;
}

// ─── Channel ──────────────────────────────────────────────────────────────────

function subscribeToChannel(code: string) {
  if (subscribedCode === code && channel) return;
  if (channel) unsubscribeChannel();

  subscribedCode = code;

  channel = echo.channel(`lobby.${code}`);
  channel.listen('.game.state.updated', (e: any) => {
    emit({
      state: e.state as SharedGameState,
      action: e.action,
      triggeredBy: e.triggeredBy,
      revision: typeof e.revision === 'number' ? e.revision : (e.state?.revision ?? 0),
    });
  });

  // Channel privat khusus posisi realtime (whisper, tanpa HTTP/DB).
  poseBuffers.clear();
  mazeChannel = echo.private(`maze.${code}`);
  mazeChannel.listenForWhisper('pos', (data: any) => {
    const key = data?.key;
    if (typeof key !== 'string') return;
    pushPoseSample(key, data, performance.now());
  });
}

function unsubscribeChannel() {
  if (subscribedCode) {
    echo.leaveChannel(`lobby.${subscribedCode}`);
    echo.leave(`maze.${subscribedCode}`);
  }
  channel = null;
  mazeChannel = null;
  poseBuffers.clear();
  subscribedCode = null;
  lastRevision = -1;
}

// ─── API publik ───────────────────────────────────────────────────────────────

export const multiplayer = {
  subscribe(code: string) {
    subscribeToChannel(code);
  },

  unsubscribe() {
    unsubscribeChannel();
  },

  isSubscribed: () => subscribedCode !== null,

  onStateEvent(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  publishState: publishIfNewer,

  /** Ambil data lobby terbaru; dipakai polling dan oleh useLobby. */
  async fetchLobby(code?: string): Promise<LobbyData | null> {
    const target = code ?? getCode();
    if (!target) return null;

    const { ok, body } = await request(`/lobby/${target}`);
    if (!ok || !body) return null;
    return body as LobbyData;
  },

  /** Kirim aksi gameplay. Optimistic: state lokal sudah berubah, ini hanya menyiarkan. */
  async syncAction(action: SyncAction, payload: Record<string, any> = {}) {
    const code = getCode();
    if (!code || !getToken()) return;

    try {
      await request(`/lobby/${code}/sync`, {
        method: 'POST',
        body: JSON.stringify({ action, payload }),
      });
    } catch (e) {
      console.warn(`[multiplayer] gagal sync ${action}:`, e);
    }
  },

  async syncPuzzleInput(puzzleId: string, input: any) {
    const code = getCode();
    if (!code || !getToken()) return;

    try {
      await request(`/lobby/${code}/input`, {
        method: 'POST',
        body: JSON.stringify({ puzzle_id: puzzleId, input }),
      });
    } catch {
      /* diamkan — kegagalan sync input tidak boleh mengganggu input lokal */
    }
  },

  /**
   * Kirim posisi karakter lewat WebSocket (whisper) — jalur cepat untuk
   * mini-game yang butuh update puluhan kali per detik.
   * Mengembalikan false kalau channel privat belum siap, supaya pemanggil
   * bisa jatuh ke sync HTTP biasa.
   */
  whisperPosition(
    key: string,
    payload: { x: number; y: number; dir: string; frame: number },
  ): boolean {
    if (!mazeChannel?.subscribed) return false;
    try {
      mazeChannel.whisper('pos', { key, ...payload });
      return true;
    } catch {
      return false;
    }
  },

  /** Siap atau belum channel privat posisi realtime. */
  isPoseRealtimeReady(): boolean {
    return !!mazeChannel?.subscribed;
  },

  sampleRemotePose,

  /**
   * Kirim state glitch reactor + fake info ke server supaya SEMUA pemain
   * melihat efek yang sama pada saat yang sama.
   *
   * Pemisahan add/clear penting: kalau hanya mengirim daftar penuh, server
   * tidak bisa membedakan "tambah gangguan" dan "gangguan sudah diperbaiki",
   * sehingga glitch/fake info muncul kembali di kedua pemain.
   */
  async syncReactorState(
    payload: {
      /** Reactor yang baru ikut glitch. */
      glitchAdd?: string[];
      /** Reactor yang glitch-nya baru saja diperbaiki. */
      glitchClear?: string[];
      /** Reactor yang baru menampilkan fake info. */
      fakeAdd?: string[];
      /** Reactor yang fake info-nya baru saja teridentifikasi. */
      fakeClear?: string[];
      fakeInfoActive?: boolean;
      anyReactorSolved?: boolean;
    },
  ) {
    const code = getCode();
    if (!code || !getToken()) return;
    const sync = async () => {
      await request(`/lobby/${code}/sync`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'reactor_state',
          payload,
        }),
      }).catch(() => {});
    };
    reactorStateSyncQueue = reactorStateSyncQueue.then(sync, sync);
    await reactorStateSyncQueue;
  },

  /** Tandai pod sudah di-login oleh salah satu pemain (shared ke semua pemain). */
  async syncPodLogin() {
    const code = getCode();
    if (!code || !getToken()) return;
    await request(`/lobby/${code}/sync`, {
      method: 'POST',
      body: JSON.stringify({ action: 'pod_login', payload: {} }),
    }).catch(() => {});
  },

  async useSharedHint() {
    const code = getCode();
    if (!code || !getToken()) return false;

    try {
      const { ok } = await request(`/lobby/${code}/hint`, { method: 'POST' });
      return ok;
    } catch {
      return false;
    }
  },

  async assignCharacter(character: string) {
    const code = getCode();
    if (!code) return false;
    const { ok, body } = await request(`/lobby/${code}/character`, {
      method: 'POST',
      body: JSON.stringify({ character }),
    }).catch(() => ({ ok: false, status: 0, body: null }));
    return ok ? true : { ok: false, message: (body as any)?.message };
  },

  /** Lepas karakter PILIHAN di lobby (bukan karakter pembebasan pod). */
  async releaseCharacter(character: string) {
    const code = getCode();
    if (!code) return;
    await request(`/lobby/${code}/release`, {
      method: 'POST',
      body: JSON.stringify({ character }),
    }).catch(() => {});
  },

  /**
   * Karakter yang BENAR-BENAR dibebaskan pod (setelah puzzle frekuensi
   * solved). Endpoint terpisah dari "release" supaya sekadar ganti karakter
   * di lobby tidak pernah membuat pod terlihat sudah dibebaskan.
   */
  async podReleaseCharacter(character: string) {
    const code = getCode();
    if (!code) return false;
    const { ok } = await request(`/lobby/${code}/pod-release`, {
      method: 'POST',
      body: JSON.stringify({ character }),
    }).catch(() => ({ ok: false, status: 0, body: null }));
    return ok;
  },

  async selectScene5Character(character: string) {
    const code = getCode();
    if (!code) return false;
    const { ok, body } = await request(`/lobby/${code}/select-scene5-char`, {
      method: 'POST',
      body: JSON.stringify({ character }),
    }).catch(() => ({ ok: false, status: 0, body: null }));
    return ok ? true : { ok: false, message: (body as any)?.message };
  },
};