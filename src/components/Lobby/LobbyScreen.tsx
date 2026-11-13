import { useState, useEffect } from 'react';
import { useLobby } from '../../hooks/useLobby';
import { useGameStore } from '../../store/gameStore';
import { LEVELS } from '../../data/levels';
import { MetalButton } from '../UI/MetalButton';
import { ChatBox } from '../Chat/ChatBox';
import { useVoiceChat } from '../../hooks/useVoiceChat';
import { fetchProfile } from '../../hooks/useapi';


interface Props {
  onClose: () => void;
  lobbyState: ReturnType<typeof useLobby>;
  voiceChat: ReturnType<typeof useVoiceChat>;
}

export function LobbyScreen({ onClose, lobbyState, voiceChat }: Props) {
  const startLevel = useGameStore((s) => s.startLevel);

  const {
    lobby,
    loading,
    error,
    isHost,
    createLobby,
    joinLobby,
    startGame,
    exitLobby,
    assignCharacter,
    releaseCharacter,
    refreshLobby,
    silentExitLobby,
  } = lobbyState;

  const player = useGameStore((s) => s.player);
  const [mode, setMode] = useState<'menu' | 'create' | 'join' | 'waiting'>('menu');
  const [selectedLevel, setSelectedLevel] = useState('level_1');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const levelProgress = useGameStore((s) => s.levelProgress);

  const canAccessLevel6 = [
    'level_1',
    'level_2',
    'level_3',
    'level_4',
    'level_5',
  ].every((id) => levelProgress[id]?.completed === true);

  const handleCreate = async () => {
    if (!player) {
      alert('Login terlebih dahulu untuk membuat lobby!');
      return;
    }

    if (selectedLevel === 'level_6' && !canAccessLevel6) {
      alert('Selesaikan semua level 1-5 terlebih dahulu untuk membuka Level 6!');
      return;
    }

    const data = await createLobby(selectedLevel);

    if (data) {
      setMode('waiting');
    }
  };

  const handleJoin = async () => {
    if (joinCode.length < 6) return;

    if (!player) {
      alert('Login terlebih dahulu untuk bergabung ke lobby!');
      return;
    }

    const data = await joinLobby(joinCode);

    if (data) {
      setMode('waiting');
    }
  };

  const handleStart = async () => {
    if (!lobby) return;

    // Set playerCharacter from lobby assignment before starting level
    const myPlayer = lobby.players.find((p) => p.id === player?.id);
    if (myPlayer?.character) {
      useGameStore.getState().setPlayerCharacter(myPlayer.character);
    }

    // Start game on server FIRST (broadcasts to all players in lobby)
    await startGame();

    // Small delay to let all players receive the game_started event
    await new Promise((r) => setTimeout(r, 500));

    // Silently unsubscribe from channel (don't remove from server lobby)
    silentExitLobby();

    // Enter the level directly.
    // useLobby sudah otomatis memanggil startLevel() begitu melihat status
    // berubah ke 'playing', jadi cek dulu supaya tidak start dua kali
    // (startLevel() me-reset progress).
    if (useGameStore.getState().screen !== 'gameplay') {
      await startLevel(lobby.level_key);
    }
  };

  const copyCode = () => {
    if (!lobby) return;

    navigator.clipboard.writeText(lobby.lobby_code);
    setCopied(true);

    setTimeout(() => setCopied(false), 2000);
  };

  // ── Styles ───────────────────────────────────────────────────────────────

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(13, 13, 13, 0.9)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'safe center',
    overflowY: 'auto',
    padding: 'clamp(12px, 3vh, 28px) 16px',
    boxSizing: 'border-box',
    color: '#e8d5b7',
    fontFamily: "'Georgia', serif",
    zIndex: 999,
    backdropFilter: 'blur(8px)',
  };

  const cardStyle: React.CSSProperties = {
    position: 'relative',
    background:
      'linear-gradient(180deg, #2a2a2a 0%, #181818 40%, #0e0e0e 60%, #242424 100%)',
    border: '1px solid #444',
    boxShadow:
      'inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 40px rgba(0,0,0,0.8)',
    borderRadius: 8,
    padding: 'clamp(24px, 5vh, 48px) clamp(20px, 5vw, 56px)',
    width: 'min(520px, 100%)',
    minWidth: 0,
    maxWidth: 520,
    textAlign: 'center',
    boxSizing: 'border-box',
  };

  const innerBorderStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 4,
    borderRadius: 4,
    border: '1px solid #333',
    pointerEvents: 'none',
  };

  const titleStyle: React.CSSProperties = {
    color: '#e8d5b7',
    fontSize: '2rem',
    fontWeight: 700,
    letterSpacing: 6,
    textTransform: 'uppercase',
    textShadow: '0 4px 20px rgba(0,0,0,0.9)',
    marginBottom: 8,
    marginTop: 0,
  };

  const subtitleStyle: React.CSSProperties = {
    color: 'rgba(200,184,154,0.6)',
    fontSize: '0.9rem',
    letterSpacing: 1,
    marginBottom: 32,
    lineHeight: 1.5,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    background: '#0a0a0a',
    border: '1px solid #4a4a4a',
    borderRadius: 4,
    color: '#e8d5b7',
    fontSize: '1.2rem',
    letterSpacing: 6,
    textAlign: 'center',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: "'Georgia', serif",
    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.8)',
    textTransform: 'uppercase',
  };

  const buttonGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
    marginTop: '16px',
  };
  const token = useGameStore((s) => s.token);
  const { isActive, isMuted, startVoice, stopVoice, toggleMute,isSpeaking } = voiceChat;
  const [avatar, setAvatar] = useState<string | null>(null);

useEffect(() => {
  if (!token) return;
  fetchProfile(token).then((p) => setAvatar(p.avatar)).catch(() => {});
}, [token]);

  useEffect(() => {
    const code = useGameStore.getState().lobbyCode;

    if (lobby && code && mode === 'menu') {
      setMode('waiting');
    }
  }, [lobby, mode]);

  useEffect(() => {
    // Transisi waiting → playing ditangani useLobby (memanggil startLevel),
    // yang berlaku untuk host maupun guest. Effect ini sudah tidak diperlukan.
  }, [lobby?.status]);

  useEffect(() => {
    return () => setMode('menu');
  }, []);

  // ── Menu utama ─────────────────────────────────────────────────────────────

  if (mode === 'menu') {
    return (
      <div style={containerStyle}>

        <div style={cardStyle}>
          <div style={innerBorderStyle} />

          <div
            style={{
              color: '#c8b89a',
              fontSize: 11,
              letterSpacing: 6,
              textTransform: 'uppercase',
              marginBottom: 6,
              opacity: 0.6,
            }}
          >
            Co-op Mode
          </div>

          <h2 style={titleStyle}>MULTIPLAYER</h2>

          <p style={subtitleStyle}>
            Main bersama teman dan selesaikan puzzle teka-teki bersama-sama.
          </p>

          <div style={buttonGroupStyle}>
            <MetalButton
              onClick={() => setMode('create')}
              label="BUAT LOBBY"
            />

            <MetalButton
              onClick={() => setMode('join')}
              label="JOIN LOBBY"
            />
          </div>

          <div style={{ marginTop: 32, display: 'inline-block' }}>
            <MetalButton
              onClick={() => onClose()}
              label="← KEMBALI"
              small
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Buat lobby ─────────────────────────────────────────────────────────────

  if (mode === 'create') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={innerBorderStyle} />

          <h2
            style={{
              ...titleStyle,
              fontSize: '1.6rem',
              marginBottom: 24,
            }}
          >
            BUAT LOBBY
          </h2>

          <label
            style={{
              color: 'rgba(200,184,154,0.6)',
              fontSize: '0.75rem',
              letterSpacing: 4,
              textTransform: 'uppercase',
            }}
          >
            PILIH LEVEL
          </label>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            style={{
              ...inputStyle,
              marginTop: 12,
              marginBottom: 24,
              letterSpacing: 2,
              padding: '12px',
            }}
          >
            {LEVELS.map((l) => {
              const isLocked = l.id === 'level_6' && !canAccessLevel6;

              return (
                <option
                  key={l.id}
                  value={l.id}
                  disabled={isLocked}
                  style={{
                    background: '#0e0e0e',
                    color: isLocked ? '#555' : '#e8d5b7',
                  }}
                >
                  {l.title}
                  {isLocked ? ' 🔒 (Terkunci)' : ''}
                  {l.id === 'level_7' ? ' 👥 2P' : ''}
                </option>
              );
            })}
          </select>

          {error && (
            <p
              style={{
                color: '#ff6b6b',
                fontSize: '0.85rem',
                marginBottom: 16,
              }}
            >
              {error}
            </p>
          )}

          <div style={buttonGroupStyle}>
            <div
              style={{
                opacity: loading ? 0.5 : 1,
                pointerEvents: loading ? 'none' : 'auto',
              }}
            >
              <MetalButton
                onClick={handleCreate}
                label={loading ? 'MEMBUAT...' : 'BUAT LOBBY'}
              />
            </div>

            <MetalButton
              onClick={() => setMode('menu')}
              label="BATAL"
              small
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Join lobby ─────────────────────────────────────────────────────────────

  if (mode === 'join') {
    const isJoinDisabled = loading || joinCode.length < 6;

    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={innerBorderStyle} />

          <h2
            style={{
              ...titleStyle,
              fontSize: '1.6rem',
              marginBottom: 24,
            }}
          >
            JOIN LOBBY
          </h2>

          <label
            style={{
              color: 'rgba(200,184,154,0.6)',
              fontSize: '0.75rem',
              letterSpacing: 4,
              textTransform: 'uppercase',
            }}
          >
            KODE LOBBY
          </label>

          <input
            style={{
              ...inputStyle,
              marginTop: 12,
              marginBottom: 24,
            }}
            placeholder="XXXXXX"
            maxLength={6}
            value={joinCode}
            onChange={(e) =>
              setJoinCode(e.target.value.toUpperCase())
            }
          />

          {error && (
            <p
              style={{
                color: '#ff6b6b',
                fontSize: '0.85rem',
                marginBottom: 16,
              }}
            >
              {error}
            </p>
          )}

          <div style={buttonGroupStyle}>
            <div
              style={{
                opacity: isJoinDisabled ? 0.5 : 1,
                pointerEvents: isJoinDisabled ? 'none' : 'auto',
              }}
            >
              <MetalButton
                onClick={handleJoin}
                label={
                  loading
                    ? 'MENCARI...'
                    : 'GABUNG SEKARANG'
                }
              />
            </div>

            <MetalButton
              onClick={() => setMode('menu')}
              label="BATAL"
              small
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Waiting room ───────────────────────────────────────────────────────────

  if (mode === 'waiting' && lobby) {
    const isLevel7 = lobby.level_key === 'level_7';
    const myPlayer = lobby.players.find((p) => p.id === player?.id);
    const myCharacter = myPlayer?.character ?? null;
    const allPlayersHaveCharacters = isLevel7 && lobby.players.length >= 2 && lobby.players.every((p) => p.character);
    const isStartDisabled = isLevel7
      ? (lobby.players.length < 2 || !allPlayersHaveCharacters || loading)
      : (lobby.players.length < 2 || loading);

    const handleSelectCharacter = async (char: 'char1' | 'char2') => {
      // Lepas karakter lama dulu (biar server tidak menolak karena karakter
      // itu masih terikat ke pemain ini).
      if (myCharacter) {
        await releaseCharacter(myCharacter);
      }
      const res = await assignCharacter(char);
      if (res !== true) {
        const message =
          (res && typeof res === 'object' && (res as any).message) ||
          'Karakter sudah dipilih pemain lain.';
        useGameStore.getState().showNotification(message, 'error');
        await refreshLobby(lobby?.lobby_code ?? '');
        return;
      }
      // scene5Character TIDAK di-set di sini. Karakter untuk scene 5 baru dipilih
      // setelah pod membebaskan salah satu orang — menebakkannya di lobby
      // membuat pilihan player lain tertimpa.
    };

    const handleReleaseCharacter = async () => {
      if (myCharacter) {
        await releaseCharacter(myCharacter);
      }
    };

    return (
      <div style={containerStyle}>
        {/* Container card + chat */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
            width: '100%',
            maxWidth: 1120,
            flexWrap: 'wrap',
            padding: 0,
            boxSizing: 'border-box',
          }}
        >
          {/* CARD UTAMA */}
          <div
            style={{
              ...cardStyle,
              width: 'min(520px, 100%)',
              minWidth: 0,
              maxWidth: 520,
              padding: 'clamp(20px, 3vh, 36px) clamp(20px, 3vw, 40px)',
              flexShrink: 0,
            }}
          >
            <div style={innerBorderStyle} />

            {/* Kode lobby */}
            <div
              style={{
                textAlign: 'center',
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  color: 'rgba(200,184,154,0.6)',
                  letterSpacing: 4,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                }}
              >
                KODE LOBBY
              </div>

              <div
                onClick={copyCode}
                style={{
                  fontSize: 'clamp(2rem, 5vh, 3rem)',
                  fontWeight: 700,
                  letterSpacing: 16,
                  color: '#c8b89a',
                  cursor: 'pointer',
                  marginTop: 8,
                  textShadow:
                    '0 2px 15px rgba(200,184,154,0.3)',
                  paddingLeft: 16,
                }}
              >
                {lobby.lobby_code}
              </div>

              <div
                style={{
                  color: copied
                    ? '#c8b89a'
                    : 'rgba(200,184,154,0.4)',
                  fontSize: '0.8rem',
                  marginTop: 8,
                  fontStyle: 'italic',
                }}
              >
                {copied
                  ? '✓ Kode tersalin ke clipboard!'
                  : 'Klik kode di atas untuk menyalin'}
              </div>
            </div>

            {/* Level Info */}
            <div
              style={{
                background: 'rgba(0,0,0,0.3)',
                borderTop: '1px solid #333',
                borderBottom: '1px solid #333',
                padding: '12px 0',
                marginBottom: 24,
              }}
            >
              <p
                style={{
                  color: 'rgba(200,184,154,0.7)',
                  fontSize: '0.9rem',
                  margin: 0,
                  letterSpacing: 2,
                }}
              >
                TARGET:{' '}
                <span
                  style={{
                    color: '#e8d5b7',
                    fontWeight: 700,
                  }}
                >
                  {LEVELS.find(
                    (l) => l.id === lobby.level_key
                  )?.title ?? lobby.level_key}
                </span>
              </p>
            </div>

            {/* Daftar player */}
            <div
              style={{
                marginBottom: 20,
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  color: '#c8b89a',
                  fontSize: '0.75rem',
                  letterSpacing: 4,
                  marginBottom: 12,
                  textTransform: 'uppercase',
                }}
              >
                TIM EKSPLORASI (
                {lobby.players?.length ?? 0}/
                {lobby.max_players})
              </div>

              {(lobby.players ?? []).map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '12px 16px',
                    background:
                      'linear-gradient(180deg, #3a3a3a 0%, #181818 40%, #0e0e0e 60%, #242424 100%)',
                    border: '1px solid #444',
                    boxShadow:
                      'inset 0 1px 0 rgba(255,255,255,0.05)',
                    borderRadius: 4,
                    marginBottom: 8,
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      background: '#222',
                      border: '1px solid #555',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      color: '#c8b89a',
                    }}
                  >
                    {p.avatar ? (
                      <img
                        src={p.avatar}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                        alt="Avatar"
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: '1.2rem',
                          fontWeight: 700,
                        }}
                      >
                        {p.username[0].toUpperCase()}
                      </span>
                    )}
                  </div>

                  <span
                    style={{
                      flex: 1,
                      color: '#e8d5b7',
                      letterSpacing: 1,
                      fontSize: '1.1rem',
                    }}
                  >
                    {p.username}
                  </span>

                  {p.role === 'host' && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        padding: '4px 10px',
                        background: '#c8b89a',
                        color: '#0d0d0d',
                        borderRadius: 2,
                        letterSpacing: 2,
                        fontWeight: 700,
                      }}
                    >
                      HOST
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Level 7: Character Selection */}
            {isLevel7 && (
              <div
                style={{
                  marginBottom: 20,
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    color: '#c8b89a',
                    fontSize: '0.75rem',
                    letterSpacing: 4,
                    marginBottom: 12,
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <span>PILIH KARAKTER</span>
                  <span
                    style={{
                      fontSize: '0.6rem',
                      padding: '2px 8px',
                      background: 'rgba(200,184,154,0.15)',
                      borderRadius: 2,
                      letterSpacing: 1,
                      textTransform: 'none',
                    }}
                  >
                    2 Players Only
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                  }}
                >
                  {/* Kayshi Card */}
                  {(() => {
                    const assignedPlayer = lobby.players.find((p) => p.character === 'char1');
                    const isAssigned = !!assignedPlayer;
                    const isMe = assignedPlayer?.id === player?.id;

                    return (
                      <div
                        onClick={() => {
                          if (!isAssigned || isMe) handleSelectCharacter('char1');
                        }}
                        style={{
                          position: 'relative',
                          padding: 'clamp(12px, 2vh, 20px) 12px',
                          background: isAssigned
                            ? isMe
                              ? 'linear-gradient(180deg, #2a2a1a 0%, #181810 40%, #0e0e08 60%, #242418 100%)'
                              : 'linear-gradient(180deg, #1a1a1a 0%, #101010 40%, #080808 60%, #141414 100%)'
                            : 'linear-gradient(180deg, #2a2a2a 0%, #181818 40%, #0e0e0e 60%, #242424 100%)',
                          border: isAssigned && isMe
                            ? '2px solid #c8b89a'
                            : '1px solid #444',
                          borderRadius: 8,
                          cursor: isAssigned && !isMe ? 'default' : 'pointer',
                          opacity: isAssigned && !isMe ? 0.5 : 1,
                          transition: 'all 0.2s ease',
                          boxShadow: isAssigned && isMe
                            ? '0 0 20px rgba(200,184,154,0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
                            : 'inset 0 1px 0 rgba(255,255,255,0.05)',
                        }}
                        onMouseEnter={(e) => {
                          if (!isAssigned || isMe) {
                            (e.currentTarget as HTMLDivElement).style.border = '2px solid rgba(200,184,154,0.5)';
                            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.border = isAssigned && isMe
                            ? '2px solid #c8b89a'
                            : '1px solid #444';
                          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                        }}
                      >
                        {/* Avatar */}
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 4,
                            background: '#222',
                            border: '1px solid #555',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            margin: '0 auto 12px',
                          }}
                        >
                          <img
                            src="/avatars/zkayshi6.png"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            alt="Ethan"
                          />
                        </div>

                        <div
                          style={{
                            color: '#e8d5b7',
                            fontSize: '1rem',
                            fontWeight: 700,
                            letterSpacing: 2,
                            textAlign: 'center',
                            marginBottom: 4,
                          }}
                        >
                          ETHAN
                        </div>

                        <div
                          style={{
                            color: 'rgba(200,184,154,0.6)',
                            fontSize: '0.7rem',
                            letterSpacing: 2,
                            textAlign: 'center',
                            textTransform: 'uppercase',
                            marginBottom: 8,
                          }}
                        >
                          Skill: TRANSLATE
                        </div>

                        {isAssigned && (
                          <div
                            style={{
                              fontSize: '0.65rem',
                              padding: '4px 10px',
                              background: isMe ? '#c8b89a' : 'rgba(200,184,154,0.2)',
                              color: isMe ? '#0d0d0d' : '#c8b89a',
                              borderRadius: 2,
                              letterSpacing: 2,
                              fontWeight: 700,
                              textAlign: 'center',
                            }}
                          >
                            {isMe ? 'KAMU' : assignedPlayer?.username.toUpperCase()}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Vania Card */}
                  {(() => {
                    const assignedPlayer = lobby.players.find((p) => p.character === 'char2');
                    const isAssigned = !!assignedPlayer;
                    const isMe = assignedPlayer?.id === player?.id;

                    return (
                      <div
                        onClick={() => {
                          if (!isAssigned || isMe) handleSelectCharacter('char2');
                        }}
                        style={{
                          position: 'relative',
                          padding: 'clamp(12px, 2vh, 20px) 12px',
                          background: isAssigned
                            ? isMe
                              ? 'linear-gradient(180deg, #2a2a1a 0%, #181810 40%, #0e0e08 60%, #242418 100%)'
                              : 'linear-gradient(180deg, #1a1a1a 0%, #101010 40%, #080808 60%, #141414 100%)'
                            : 'linear-gradient(180deg, #2a2a2a 0%, #181818 40%, #0e0e0e 60%, #242424 100%)',
                          border: isAssigned && isMe
                            ? '2px solid #c8b89a'
                            : '1px solid #444',
                          borderRadius: 8,
                          cursor: isAssigned && !isMe ? 'default' : 'pointer',
                          opacity: isAssigned && !isMe ? 0.5 : 1,
                          transition: 'all 0.2s ease',
                          boxShadow: isAssigned && isMe
                            ? '0 0 20px rgba(200,184,154,0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
                            : 'inset 0 1px 0 rgba(255,255,255,0.05)',
                        }}
                        onMouseEnter={(e) => {
                          if (!isAssigned || isMe) {
                            (e.currentTarget as HTMLDivElement).style.border = '2px solid rgba(200,184,154,0.5)';
                            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.border = isAssigned && isMe
                            ? '2px solid #c8b89a'
                            : '1px solid #444';
                          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                        }}
                      >
                        {/* Avatar */}
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 4,
                            background: '#222',
                            border: '1px solid #555',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            margin: '0 auto 12px',
                          }}
                        >
                          <img
                            src="/avatars/perpus4.png"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            alt="Vania"
                          />
                        </div>

                        <div
                          style={{
                            color: '#e8d5b7',
                            fontSize: '1rem',
                            fontWeight: 700,
                            letterSpacing: 2,
                            textAlign: 'center',
                            marginBottom: 4,
                          }}
                        >
                          VANIA
                        </div>

                        <div
                          style={{
                            color: 'rgba(200,184,154,0.6)',
                            fontSize: '0.7rem',
                            letterSpacing: 2,
                            textAlign: 'center',
                            textTransform: 'uppercase',
                            marginBottom: 8,
                          }}
                        >
                          Skill: X VISION
                        </div>

                        {isAssigned && (
                          <div
                            style={{
                              fontSize: '0.65rem',
                              padding: '4px 10px',
                              background: isMe ? '#c8b89a' : 'rgba(200,184,154,0.2)',
                              color: isMe ? '#0d0d0d' : '#c8b89a',
                              borderRadius: 2,
                              letterSpacing: 2,
                              fontWeight: 700,
                              textAlign: 'center',
                            }}
                          >
                            {isMe ? 'KAMU' : assignedPlayer?.username.toUpperCase()}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {myCharacter && (
                  <button
                    onClick={handleReleaseCharacter}
                    style={{
                      marginTop: 12,
                      padding: '6px 16px',
                      background: 'transparent',
                      border: '1px solid #444',
                      borderRadius: 4,
                      color: 'rgba(200,184,154,0.6)',
                      fontSize: '0.75rem',
                      letterSpacing: 2,
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                    }}
                  >
                    Lepas Karakter
                  </button>
                )}
              </div>
            )}

            {/* Tombol Aksi */}
            {isHost ? (
              <div
                style={{
                  opacity: isStartDisabled ? 0.5 : 1,
                  pointerEvents: isStartDisabled
                    ? 'none'
                    : 'auto',
                  marginBottom: 16,
                }}
              >
                <MetalButton
                  onClick={handleStart}
                  label={
                    lobby.players.length < 2
                      ? 'MENUNGGU PEMAIN...'
                      : isLevel7 && !allPlayersHaveCharacters
                        ? 'PILIH KARAKTER DULU...'
                        : 'MULAI GAME SEKARANG'
                  }
                />
              </div>
            ) : (
              <p
                style={{
                  color: '#c8b89a',
                  fontSize: '0.9rem',
                  fontStyle: 'italic',
                  marginBottom: 24,
                  letterSpacing: 1,
                }}
              >
                Menunggu instruksi dari Host...
              </p>
            )}

            <div style={{ marginTop: 8 }}>
              <MetalButton
                onClick={(e) => {
                  e.stopPropagation();
                  exitLobby();
                  onClose();
                }}
                label="KEMBALI"
                small
              />
            </div>
          </div>



          {/* CHAT */}
          <div
            style={{
              width: 'min(340px, 100%)',
              minWidth: 0,
              maxWidth: 340,
              flexShrink: 0,
              alignSelf: 'center',
            }}
          >
            <ChatBox
              lobbyCode={lobby.lobby_code}
            />
            {/* VOICE + PROFILE */}
<div style={{
  width: '100%', flexShrink: 0,
  display: 'flex', flexDirection: 'column', gap: 8,
}}>
  {/* Voice card */}
  <div style={{
    background: '#111', border: '1px solid #222',
    borderRadius: 8, overflow: 'hidden',
  }}>
    <div style={{
      padding: '8px 12px',
      borderBottom: '1px solid #1e1e1e',
      color: '#52525b', fontSize: 10,
      fontFamily: 'monospace', letterSpacing: 2,
    }}>
      VOICE CHANNEL
    </div>

    {/* Profile bar */}
    <div style={{
      display: 'flex', alignItems: 'center',
      gap: 8, padding: '10px 12px',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 700, color: '#fff',
        border: isSpeaking && !isMuted ? '2px solid #22c55e' : '2px solid #3f3f46',
        overflow: 'hidden', flexShrink: 0,
      }}>
        {avatar
          ? <img src={avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span>{player?.username?.[0]?.toUpperCase() ?? '?'}</span>
        }
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: '#f4f4f5', fontSize: 12, fontWeight: 600,
          fontFamily: 'sans-serif',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{player?.username ?? 'Player'}</div>
        <div style={{
          fontSize: 10, fontFamily: 'sans-serif',
          color: isActive ? (isMuted ? '#ef4444' : '#22c55e') : '#52525b',
        }}>
          {isActive ? (isMuted ? 'Muted' : 'Speaking') : 'Voice off'}
        </div>
      </div>

      {/* Tombol mic */}
      {isActive && (
        <button onClick={toggleMute} style={{
          width: 28, height: 28, borderRadius: '50%',
          background: isMuted ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.1)',
          border: `1px solid ${isMuted ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.3)'}`,
          color: isMuted ? '#ef4444' : '#22c55e',
          cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {isMuted
            ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6"/><path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          }
        </button>
      )}

      {/* Join/Leave */}
      <button onClick={isActive ? stopVoice : startVoice} style={{
        width: 28, height: 28, borderRadius: '50%',
        background: isActive ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.1)',
        border: `1px solid ${isActive ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.3)'}`,
        color: isActive ? '#ef4444' : '#22c55e',
        cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {isActive
          ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7 2 2 0 011.72 2v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.42 19.42 0 013.07 8.63 19.79 19.79 0 01.1 4a2 2 0 012-2.18h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.07 9.9"/><line x1="23" y1="1" x2="1" y2="23"/></svg>
          : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.13 19.13 0 013.07 8.63 19.79 19.79 0 01.1 4a2 2 0 012-2.18h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.07 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
        }
      </button>
    </div>

    {/* List players yang sedang voice */}
    {isActive && (
      <div style={{ padding: '0 12px 10px' }}>
        {lobby.players.map((p) => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center',
            gap: 8, padding: '4px 0',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: '#27272a', border: '1px solid #3f3f46',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, color: '#a1a1aa', overflow: 'hidden',
            }}>
              {p.avatar
                ? <img src={p.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : p.username[0].toUpperCase()
              }
            </div>
            <span style={{ color: '#a1a1aa', fontSize: 11, fontFamily: 'sans-serif' }}>
              {p.username}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
</div>
          </div>
          
        </div>
      </div>
    );
  }

  return null;
}