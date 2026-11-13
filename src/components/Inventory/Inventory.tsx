import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { LEVELS } from '../../data/levels';
import styles from './Inventory.module.css';
import { useHintRefill } from '../../hooks/useHintRefill';
import { HintToken } from '../HintToken/HintToken';
import { useSFX } from '../../hooks/useSFX';
import { useChat } from '../../hooks/useChat';
import { useVoiceChat } from '../../hooks/useVoiceChat';
import { fetchProfile } from '../../hooks/useapi';
import { ToolsPanel } from './ToolsPanel';

interface Props {
  voiceChat: ReturnType<typeof useVoiceChat>;
}

// Tambahan interface untuk Item agar tidak terjadi error TypeScript
export interface Item {
  id: string;
  name?: string;
  [key: string]: any;
}

export function Inventory({ voiceChat }: Props) {
  const { isActive, isMuted, startVoice, stopVoice, toggleMute, isSpeaking } = voiceChat;
  useHintRefill();

  // --- STATE DARI GAME STORE ---
  
  const currentLevelId = useGameStore((s) => s.currentLevelId);
  const currentSceneId = useGameStore((s) => s.currentSceneId);
  const playerCharacter = useGameStore((s) => s.playerCharacter);
  const activeCharacter = useGameStore((s) => s.activeCharacter);
  const hintsUsed = useGameStore((s) => s.hintsUsed);
  const hintTokens = useGameStore((s) => s.hintTokens);
  
  // (TAMBAHAN) State UV Flashlight dan Inventory (Items)
 
  
  
  const [tab, setTab] = useState<'tools' | 'hint' | 'chat'>('hint');
  const [showWarning, setShowWarning] = useState(false);
  const sfx = useSFX();

  const lobbyCode = useGameStore((s) => s.lobbyCode);
  const { messages, sendMessage } = useChat(lobbyCode);

  const [chatInput, setChatInput] = useState('');
  const [unreadChat, setUnreadChat] = useState(0);
  const prevMsgLen = useRef(0);

  const level = LEVELS.find((l) => l.id === currentLevelId);
  // Level 7 punya hint per scene & per karakter (sceneHints). Kalau ada,
  // pakai itu; kalau tidak, fallback ke hints biasa.
  const sceneHints = (level as any)?.sceneHints as
    | Record<string, Record<string, { text: string; cost: number }[]>>
    | undefined;
  const charKey = (playerCharacter ?? activeCharacter ?? 'char1') as string;
  const hintsForScene = sceneHints?.[currentSceneId ?? '']?.[charKey] ?? [];
  const hints: { text: string; cost: number }[] =
    hintsForScene.length > 0
      ? hintsForScene
      : (level?.hints ?? []).map((t) => ({ text: t, cost: 1 }));
  const usedHints = hints.slice(0, hintsUsed);
  const token = useGameStore((s) => s.token);
  const player = useGameStore((s) => s.player);
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchProfile(token).then((p: { avatar: string | null }) => setAvatar(p.avatar)).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (tab !== 'chat' && messages.length > prevMsgLen.current) {
      setUnreadChat((u) => u + (messages.length - prevMsgLen.current));
    }
    prevMsgLen.current = messages.length;
  }, [messages, tab]);

  useEffect(() => {
    if (tab === 'chat') setUnreadChat(0);
  }, [tab]);

  const handleUseHint = () => {
    const nextHint = hints[hintsUsed];
    const cost = nextHint?.cost ?? 1;
    if (hintTokens < cost || hintsUsed >= hints.length) {
      return;
    }
    setShowWarning(true);
  };

  const useHint = useGameStore((s) => s.useHint);

  const handleConfirmHint = () => {
    const nextHint = hints[hintsUsed];
    const cost = nextHint?.cost ?? 1;
    if (hintTokens < cost) { setShowWarning(false); return; }
    // Decrement token sesuai biaya hint (bukan selalu 1). Hint bersifat
    // per-player (tidak di-share ke pemain lain), jadi tidak ada sync server.
    useGameStore.setState({ hintTokens: hintTokens - cost });
    sfx.playHint();
    useHint();
    setShowWarning(false);
  };

  

  return (
    <aside className={styles.panel} style={{ background: '#0a0a0a', borderLeft: '1px solid #262626' }}>
      {/* Tabs */}
      <div className={styles.tabs} style={{ borderBottom: '1px solid #262626', background: '#111' }}>
        <button
          className={`${styles.tab} ${tab === 'tools' ? styles.active : ''}`}
          onClick={() => setTab('tools')}
          style={{ color: tab === 'tools' ? '#fbbf24' : '#a1a1aa' }}
        >
          🛠 Tools
        </button>

        <button
          className={`${styles.tab} ${tab === 'hint' ? styles.active : ''}`}
          onClick={() => setTab('hint')}
          style={{ color: tab === 'hint' ? '#fbbf24' : '#a1a1aa' }}
        >
          💡 Hint
        </button>

        {lobbyCode && (
          <button
            className={`${styles.tab} ${tab === 'chat' ? styles.active : ''}`}
            onClick={() => setTab('chat')}
            style={{ position: 'relative', color: tab === 'chat' ? '#fbbf24' : '#a1a1aa' }}
          >
            💬 Chat
            {unreadChat > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: '#ef4444', color: '#fff',
                fontSize: 9, fontWeight: 700,
                borderRadius: '50%', width: 16, height: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
              }}>{unreadChat}</span>
            )}
          </button>
        )}
      </div>

      {/* Tools tab (Notes + Kalkulator) */}
      {tab === 'tools' && (
        <div style={{ padding: '12px', overflowY: 'auto', flex: 1 }}>
          <ToolsPanel />
        </div>
      )}

      {/* Hint tab */}
      {tab === 'hint' && (
      <div style={{ padding: '12px', overflowY: 'auto', flex: 1 }}>
            <div style={{
              color: '#52525b', fontSize: 10,
              letterSpacing: 3, textTransform: 'uppercase',
              marginBottom: 12, fontFamily: 'monospace',
              textAlign: 'center', fontWeight: 600
            }}>
              — Data Bantuan —
            </div>

            <div style={{ marginBottom: 12 }}>
              <HintToken compact />
            </div>

            {usedHints.map((hint, i) => (
              <div key={i} style={{
                background: 'rgba(251,191,36,0.05)',
                border: '1px solid rgba(251,191,36,0.15)',
                borderLeft: '3px solid #fbbf24',
                borderRadius: '0 6px 6px 0', padding: '10px 12px',
                marginBottom: 8,
              }}>
                <div style={{
                  color: '#fbbf24', fontSize: 10, fontWeight: 700,
                  letterSpacing: 1, marginBottom: 6,
                  fontFamily: 'monospace',
                }}>
                  &gt; HINT {i + 1}
                </div>
                <div style={{
                  color: '#d4d4d8', fontSize: 12,
                  lineHeight: 1.5, fontFamily: 'sans-serif',
                }}>
                  {hint.text}
                </div>
              </div>
            ))}

            {hintsUsed < hints.length && (
              <button
                onClick={handleUseHint}
                disabled={hintTokens < (hints[hintsUsed]?.cost ?? 1)}
                style={{
                  width: '100%', padding: '10px 0',
                  background: hintTokens > 0
                    ? 'linear-gradient(to bottom, #27272a, #18181b)'
                    : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${hintTokens > 0 ? '#52525b' : '#27272a'}`,
                  borderRadius: 6,
                  color: hintTokens > 0 ? '#fbbf24' : '#52525b',
                  fontSize: 11, fontWeight: 600,
                  cursor: hintTokens > 0 ? 'pointer' : 'not-allowed',
                  fontFamily: 'monospace', letterSpacing: 1,
                  marginTop: 8, transition: 'all 0.2s ease',
                  boxShadow: hintTokens > 0 ? '0 2px 4px rgba(0,0,0,0.5)' : 'none'
                }}
              >
                {hintTokens > 0
                  ? `[ GUNAKAN HINT: ${hintTokens} TERSISA ]`
                  : '[ TOKEN HABIS ]'}
              </button>
            )}

            {hintsUsed >= hints.length && hints.length > 0 && (
              <div style={{
                color: '#52525b', fontSize: 11,
                textAlign: 'center', padding: '12px 0',
                fontFamily: 'monospace', letterSpacing: 1,
                background: '#111', borderRadius: 6, marginTop: 8
              }}>
                [ SEMUA HINT DIBUKA ]
              </div>
            )}
          </div>
      )}

      {/* Chat tab */}
      {tab === 'chat' && lobbyCode && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>
          <div style={{
            flex: 1, overflowY: 'auto', padding: '10px 8px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {messages.length === 0 && (
              <p style={{
                color: '#52525b', fontSize: 11, textAlign: 'center',
                fontFamily: 'monospace', marginTop: 16,
              }}>Belum ada jejak pesan...</p>
            )}
            {messages.map((m, i) => {
              const isSelf = m.username === useGameStore.getState().player?.username;
              return (
                <div key={i} style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: isSelf ? 'flex-end' : 'flex-start',
                }}>
                  {!isSelf && (
                    <span style={{
                      fontSize: 10, color: '#eab308', fontWeight: 700,
                      fontFamily: 'Courier New, monospace', marginBottom: 3,
                    }}>{m.username}</span>
                  )}
                  <div style={{
                    maxWidth: '85%', padding: '6px 10px',
                    borderRadius: isSelf ? '8px 8px 2px 8px' : '8px 8px 8px 2px',
                    background: isSelf ? '#27272a' : '#18181b',
                    border: `1px solid ${isSelf ? '#3f3f46' : '#27272a'}`,
                    color: '#c8b89a', fontSize: 12,
                    fontFamily: 'sans-serif', lineHeight: 1.4,
                    wordBreak: 'break-word',
                  }}>{m.message}</div>
                </div>
              );
            })}
          </div>

          <div style={{
            display: 'flex', gap: 6, padding: '8px',
            borderTop: '1px solid #262626', background: '#0d0d0d',
          }}>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && chatInput.trim()) {
                  sendMessage(chatInput.trim());
                  setChatInput('');
                }
              }}
              placeholder="Ketik pesan..."
              maxLength={200}
              style={{
                flex: 1, background: '#18181b',
                border: '1px solid #3f3f46',
                borderRadius: 6, padding: '6px 10px',
                color: '#f4f4f5', fontSize: 12,
                fontFamily: 'monospace', outline: 'none',
              }}
            />
            <button
              onClick={() => {
                if (chatInput.trim()) {
                  sendMessage(chatInput.trim());
                  setChatInput('');
                }
              }}
              disabled={!chatInput.trim()}
              style={{
                padding: '6px 12px', borderRadius: 6,
                background: chatInput.trim() ? '#27272a' : '#141417',
                border: `1px solid ${chatInput.trim() ? '#eab308' : '#27272a'}`,
                color: chatInput.trim() ? '#eab308' : '#3f3f46',
                fontSize: 14, cursor: chatInput.trim() ? 'pointer' : 'not-allowed',
              }}
            >➤</button>
          </div>
        </div>
      )}

      {lobbyCode && (
        <div style={{
          borderTop: '1px solid #1e1e1e',
          background: '#111',
          padding: '8px 10px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
              border: isSpeaking && !isMuted ? '2px solid #22c55e' : '2px solid #3f3f46',
              overflow: 'hidden',
            }}>
              {avatar
                ? <img src={avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span>{player?.username?.[0]?.toUpperCase() ?? '?'}</span>
              }
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: '#f4f4f5', fontSize: 12, fontWeight: 600,
                fontFamily: 'sans-serif', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {useGameStore.getState().player?.username ?? 'Player'}
              </div>
            </div>

            {isActive && (
              <button
                onClick={toggleMute}
                title={isMuted ? 'Unmute' : 'Mute'}
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: isMuted ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.1)',
                  border: `1px solid ${isMuted ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.3)'}`,
                  color: isMuted ? '#ef4444' : '#22c55e',
                  fontSize: 14, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
              {isMuted
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6"/><path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              }
              </button>
            )}

            <button
              onClick={isActive ? stopVoice : startVoice}
              title={isActive ? 'Leave Voice' : 'Join Voice'}
              style={{
                width: 30, height: 30, borderRadius: '50%',
                background: isActive ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.1)',
                border: `1px solid ${isActive ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.3)'}`,
                color: isActive ? '#ef4444' : '#22c55e',
                fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
            {isActive
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7 2 2 0 011.72 2v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.42 19.42 0 013.07 8.63 19.79 19.79 0 01.1 4a2 2 0 012-2.18h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.07 9.9"/><line x1="23" y1="1" x2="1" y2="23"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.13 19.13 0 013.07 8.63 19.79 19.79 0 01.1 4a2 2 0 012-2.18h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.07 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
            }
            </button>
          </div>
        </div>
      )}

      {/* Settings dipindahkan ke menu utama (Settings screen). */}

      {/* Modal peringatan */}
      {showWarning && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 99999,
            pointerEvents: 'all',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#18181b',
              border: '1px solid #fbbf24',
              borderRadius: 12, padding: '32px 24px',
              width: 320, textAlign: 'center',
              display: 'flex', flexDirection: 'column', gap: 16,
              boxShadow: '0 0 40px rgba(251,191,36,0.1), 0 20px 60px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ fontSize: 40 }}>⚠️</div>
            <div style={{
              color: '#fbbf24', fontSize: 14, fontWeight: 800,
              fontFamily: 'monospace', letterSpacing: 2,
            }}>
              AKSES DATA BANTUAN
            </div>
            <p style={{
              color: '#d4d4d8', fontSize: 13,
              fontFamily: 'sans-serif', lineHeight: 1.6, margin: 0,
            }}>
              Membuka bantuan akan menghabiskan{' '}
              <strong style={{ color: '#fbbf24' }}>{hints[hintsUsed]?.cost ?? 1} Token</strong>.<br /><br />
              <span style={{ fontSize: 11, color: '#a1a1aa' }}>
                Sisa token: <strong style={{ color: '#fbbf24' }}>{hintTokens}</strong><br />
                Sistem me-reset token setiap <strong>5 menit</strong>.
              </span>
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                onClick={() => setShowWarning(false)}
                style={{
                  flex: 1, padding: '10px 0',
                  background: 'transparent',
                  border: '1px solid #52525b',
                  borderRadius: 6, color: '#a1a1aa',
                  fontSize: 12, cursor: 'pointer', fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#27272a';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#a1a1aa';
                }}
              >
                BATAL
              </button>
              <button
                onClick={handleConfirmHint}
                style={{
                  flex: 1, padding: '10px 0',
                  background: '#fbbf24',
                  border: '1px solid #fbbf24',
                  borderRadius: 6, color: '#18181b',
                  fontSize: 12, cursor: 'pointer', fontWeight: 700,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 0 15px rgba(251,191,36,0.3)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f59e0b'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#fbbf24'}
              >
                KONFIRMASI
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}