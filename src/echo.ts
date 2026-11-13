import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

(window as any).Pusher = Pusher;

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

/**
 * Token Sanctum dibaca langsung dari localStorage (bukan import store) supaya
 * file ini tidak ikut siklus import gameStore -> multiplayer -> echo -> gameStore.
 * Zustand persist menyimpan token di key 'escape-room-game'.
 */
function currentToken(): string | null {
  try {
    const raw = localStorage.getItem('escape-room-game');
    if (!raw) return null;
    return (JSON.parse(raw)?.state?.token ?? null) as string | null;
  } catch {
    return null;
  }
}

export const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST ?? 'localhost',
  wsPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
  wssPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
  forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
  enabledTransports: ['ws', 'wss'],
  disableStats: true,
  // Channel privat (mis. maze.{code}) butuh otorisasi. Pakai endpoint API
  // dengan Bearer token, bukan session cookie seperti default Echo.
  authEndpoint: `${API_BASE}/broadcasting/auth`,
  authorizer: (channel: any) => ({
    authorize: (socketId: string, callback: (error: any, data: any) => void) => {
      const token = currentToken();
      fetch(`${API_BASE}/broadcasting/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: new URLSearchParams({
          socket_id: socketId,
          channel_name: channel.name,
        }).toString(),
      })
        .then(async (res) => {
          const body = await res.json().catch(() => null);
          if (!res.ok) {
            console.warn('[Echo] otorisasi channel gagal:', channel.name, body?.message ?? res.status);
            callback(body?.message ?? `HTTP ${res.status}`, null);
          } else {
            callback(null, body);
          }
        })
        .catch((err) => callback(err, null));
    },
  }),
});

echo.connector.pusher.connection.bind('state_change', (states: any) => {
  console.log('[Echo] Connection state changed:', states);
});

echo.connector.pusher.connection.bind('error', (err: any) => {
  console.error('[Echo] Connection error:', err);
});
