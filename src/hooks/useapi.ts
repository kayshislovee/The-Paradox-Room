// src/hooks/useApi.ts
// Hook untuk fetch data dari Laravel API

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiHotspot {
  id: number;
  hotspot_key: string;
  label: string;
  x: number; y: number; width: number; height: number;
  cursor: string;
  image: string | null;
  z_index: number;
  action_type: string;
  action_data: Record<string, unknown> | null;
  visible_data: Record<string, unknown> | null;
  order: number;
}

export interface ApiScene {
  id: number;
  scene_key: string;
  label: string;
  background_image: string | null;
  exit_puzzle_id: string | null;
  order: number;
  hotspots: ApiHotspot[];
}

export interface ApiPuzzle {
  id: number;
  puzzle_key: string;
  type: string;
  title: string;
  description: string;
  answer: string;
  max_digits: number | null;
  pattern_size: number | null;
  clue_ids: string[] | null;
}

export interface ApiHint {
  id: number;
  text: string;
  order: number;
}

export interface ApiDialogLine {
  id: number;
  type: 'intro' | 'win' | 'lose';
  character: string;
  avatar: string | null;
  avatar_left: string | null;
  avatar_right: string | null;
  avatar_left_style: Record<string, string> | null;
  avatar_right_style: Record<string, string> | null;
  text: string;
  side: 'left' | 'right';
  is_system: boolean;
  order: number;
}

export interface ApiLevel {
  id: number;
  level_key: string;
  title: string;
  description: string;
  thumbnail: string;
  time_limit: number;
  star_thresholds: number[];
  music: string | null;
  dialog_music: string | null;
  is_locked: boolean;
  scenes: ApiScene[];
  puzzles: ApiPuzzle[];
  hints: ApiHint[];
  dialog_lines: ApiDialogLine[];
}

export interface ApiLeaderboardEntry {
  id: number;
  player_name: string;
  level_key: string;
  level_title: string;
  time_elapsed: number;
  stars: number;
  created_at: string;
}

export interface ApiHintConfig {
  max_tokens: number;
  refill_seconds: number;
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

/** Ambil semua level (untuk halaman level select) */
export async function fetchLevels(): Promise<ApiLevel[]> {
  const res = await fetch(`${API_BASE}/levels`);
  if (!res.ok) throw new Error('Gagal fetch levels');
  return res.json();
}

/** Ambil satu level lengkap berdasarkan level_key (untuk gameplay) */
export async function fetchLevel(levelKey: string): Promise<ApiLevel> {
  const res = await fetch(`${API_BASE}/levels/${levelKey}`);
  if (!res.ok) throw new Error(`Gagal fetch level: ${levelKey}`);
  return res.json();
}

/** Ambil leaderboard, opsional filter per level */
export async function fetchLeaderboard(levelKey?: string, limit = 10): Promise<ApiLeaderboardEntry[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (levelKey) params.set('level_key', levelKey);
  const res = await fetch(`${API_BASE}/leaderboard?${params}`);
  if (!res.ok) throw new Error('Gagal fetch leaderboard');
  return res.json();
}

/** Submit skor saat pemain menang */
export async function submitScore(payload: {
  level_id: number;
  player_name: string;
  time_elapsed: number;
  stars: number;
}, token?: string): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/leaderboard`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Gagal submit skor');
}

/** Ambil konfigurasi hint token dari admin */
export async function fetchHintConfig(): Promise<ApiHintConfig> {
  const res = await fetch(`${API_BASE}/hint-config`);
  if (!res.ok) throw new Error('Gagal fetch hint config');
  return res.json();
}

export interface ApiPlayer {
  id: number;
  username: string;
  email: string;
}

export async function registerPlayer(data: {
  username: string;
  email: string;
  password: string;
}): Promise<{ player: ApiPlayer; token: string }> {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? 'Gagal register');
  }
  return res.json();
}

export async function loginPlayer(data: {
  email: string;
  password: string;
}): Promise<{ player: ApiPlayer; token: string }> {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? 'Email atau password salah');
  }
  return res.json();
}

export async function logoutPlayer(token: string): Promise<void> {
  await fetch(`${API_BASE}/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
}
// Ambil progress dari server setelah login
export async function fetchProgress(token: string): Promise<Array<{
  level_key: string;
  completed: boolean;
  best_time: number;
  stars: number;
}>> {
  const res = await authFetch(`${API_BASE}/progress`, token);
  if (!res.ok) throw new Error('Gagal fetch progress');
  return res.json();

}

// Simpan progress ke server setelah level selesai
export async function saveProgress(token: string, data: {
  level_key: string;
  completed: boolean;
  best_time: number;
  stars: number;
}): Promise<void> {
  await fetch(`${API_BASE}/progress`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}
export interface ApiProfile {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  completed_levels: Array<{
    level_key: string;
    stars: number;
    best_time: number;
  }>;
}

export async function fetchProfile(token: string): Promise<ApiProfile> {
  const res = await fetch(`${API_BASE}/profile`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Gagal fetch profile');
  return res.json();
}

export async function updateProfile(token: string, data: {
  username?: string;
  bio?: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Gagal update profile');
}

export async function uploadAvatar(token: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('avatar', file);
  const res = await fetch(`${API_BASE}/profile/avatar`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new Error('Gagal upload avatar');
  const data = await res.json();
  return data.avatar;
}
export async function fetchMyAchievements(token: string): Promise<string[]> {
  const res = await fetch(`${API_BASE}/achievements/my`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

// Unlock achievement
export async function unlockAchievement(
  achievementKey: string,
  token: string
): Promise<void> {
  await fetch(`${API_BASE}/achievements/unlock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ achievement_key: achievementKey }),
  });
}

// Report treasure found
export async function reportTreasureFound(
  treasureKey: string,
  token: string
): Promise<{ achievement_unlocked: boolean; achievement_key: string | null }> {
  const res = await fetch(`${API_BASE}/treasures/found`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ treasure_key: treasureKey }),
  });
  return res.json();
}

// Ambil treasures yang sudah ditemukan player
export async function fetchMyTreasures(token: string): Promise<string[]> {
  const res = await fetch(`${API_BASE}/treasures/my`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

// Di useapi.ts — tambahkan di bagian atas, setelah API_BASE
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

async function authFetch(url: string, token: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 401) {
    onUnauthorized?.();
    throw new Error('Session expired. Silakan login ulang.');
  }

  return res;
}
  