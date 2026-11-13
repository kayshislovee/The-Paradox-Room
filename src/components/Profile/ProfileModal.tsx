import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { fetchProfile, updateProfile, uploadAvatar, ApiProfile } from '../../hooks/useapi';
import { formatTime } from '../../hooks/useTimer';
import { MetalButton } from '../UI/MetalButton';
const LEVEL_LABELS: Record<string, string> = {
  level_1: 'Lab Misterius',
  level_2: 'Koridor Sekolah',
  level_3: 'Perpustakaan',
  level_4: 'Minimarket',
  level_5: 'Toko Mainan',
  level_6: 'Comeback'
};

interface Props {
  onClose: () => void;
}

export function ProfileModal({ onClose }: Props) {
  const token = useGameStore((s) => s.token);
  const logout = useGameStore((s) => s.logout);
  const setPlayer = useGameStore((s) => s.setPlayer);
  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetchProfile(token)
      .then((p) => {
        setProfile(p);
        setUsername(p.username);
        setBio(p.bio ?? '');
      })
      .catch(() => setError('Gagal memuat profil'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setError('');
    try {
      await updateProfile(token, { username, bio });
      setProfile((p) => p ? { ...p, username, bio } : p);
      setPlayer({ id: profile!.id, username, email: profile!.email }, token);
      setEditMode(false);
    } catch {
      setError('Gagal menyimpan perubahan');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    try {
      const url = await uploadAvatar(token, file);
      setProfile((p) => p ? { ...p, avatar: url } : p);
    } catch {
      setError('Gagal upload foto');
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Georgia', serif",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 440, maxHeight: '85vh',
          background: 'linear-gradient(160deg, #0f0c20, #1a1530)',
          border: '1px solid rgba(200,184,154,0.2)',
          borderRadius: 16, padding: '28px 28px',
          overflowY: 'auto', position: 'relative',
        }}
      >
        {/* Tombol close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'transparent', border: 'none',
            color: '#8a7a6a', fontSize: 18, cursor: 'pointer',
          }}
        >✕</button>

        {loading ? (
          <div style={{ color: '#c8b89a', textAlign: 'center', padding: 40 }}>Memuat...</div>
        ) : !token ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: '#c8b89a', marginBottom: 20 }}>
              Login untuk melihat profil
            </p>
            <MetalButton
              onClick={() => { logout(); onClose(); }}
              label="LOGIN"
            />
          </div>
        ) : profile ? (
          <>
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: '#1a1530',
                  border: '2px solid rgba(200,184,154,0.3)',
                  overflow: 'hidden', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32, flexShrink: 0, position: 'relative',
                }}
              >
                {profile.avatar
                  ? <img src={profile.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : '👤'
                }
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transition: 'opacity 0.2s',
                  fontSize: 18, color: '#fff',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                >📷</div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />

              <div style={{ flex: 1 }}>
                {editMode ? (
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(200,184,154,0.4)',
                      borderRadius: 6, padding: '6px 10px',
                      color: '#e8d5b7', fontSize: 18, fontWeight: 700,
                      fontFamily: "'Georgia', serif",
                      width: '100%', letterSpacing: 2,
                    }}
                  />
                ) : (
                  <div style={{ color: '#e8d5b7', fontSize: 20, fontWeight: 700, letterSpacing: 2 }}>
                    {profile.username}
                  </div>
                )}
                <div style={{ color: '#6a6a6a', fontSize: 11, marginTop: 4, fontFamily: 'sans-serif' }}>
                  {profile.email}
                </div>
              </div>
            </div>

            {/* Bio */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: '#8a7a6a', fontSize: 9, letterSpacing: 3, marginBottom: 6, textTransform: 'uppercase' }}>
                Bio
              </div>
              {editMode ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={200}
                  rows={3}
                  style={{
                    width: '100%', background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(200,184,154,0.4)',
                    borderRadius: 6, padding: '8px 10px',
                    color: '#e8d5b7', fontSize: 13,
                    fontFamily: 'sans-serif', resize: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              ) : (
                <div style={{ color: bio ? '#c8b89a' : '#4a4a4a', fontSize: 13, fontFamily: 'sans-serif', lineHeight: 1.6 }}>
                  {bio || 'Belum ada bio...'}
                </div>
              )}
            </div>

            {/* Error */}
            {error && <div style={{ color: '#f87171', fontSize: 12, marginBottom: 12, fontFamily: 'sans-serif' }}>{error}</div>}

            {/* Tombol edit/save */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
              {editMode ? (
                <>
                  <button onClick={handleSave} disabled={saving} style={btnStyle('#c8b89a', '#0f0c20')}>
                    {saving ? 'Menyimpan...' : '✓ Simpan'}
                  </button>
                  <button onClick={() => { setEditMode(false); setError(''); }} style={btnStyle('transparent', '#8a7a6a', true)}>
                    Batal
                  </button>
                </>
              ) : (
                <button onClick={() => setEditMode(true)} style={btnStyle('transparent', '#c8b89a', true)}>
                  ✎ Edit Profil
                </button>
              )}
            </div>

            {/* Level selesai */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                color: '#8a7a6a', fontSize: 9, letterSpacing: 3,
                textTransform: 'uppercase', marginBottom: 12,
              }}>
                Level Selesai ({profile.completed_levels.length})
              </div>
              {profile.completed_levels.length === 0 ? (
                <div style={{ color: '#4a4a4a', fontSize: 12, fontFamily: 'sans-serif' }}>
                  Belum ada level yang diselesaikan.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {profile.completed_levels.map((lv) => (
                    <div key={lv.level_key} style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(200,184,154,0.1)',
                      borderRadius: 8, padding: '10px 14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <div>
                        <div style={{ color: '#e8d5b7', fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>
                          {LEVEL_LABELS[lv.level_key] ?? lv.level_key}
                        </div>
                        <div style={{ color: '#6a6a6a', fontSize: 11, fontFamily: 'sans-serif', marginTop: 2 }}>
                          Best: {formatTime(lv.best_time)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[1, 2, 3].map((n) => (
                          <span key={n} style={{
                            fontSize: 16,
                            color: n <= lv.stars ? '#c8a84a' : '#2a2a2a',
                            textShadow: n <= lv.stars ? '0 0 8px rgba(200,168,74,0.6)' : 'none',
                          }}>★</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={() => { logout(); onClose(); }}
              style={{
                width: '100%', background: 'transparent',
                border: '1px solid rgba(248,113,113,0.3)',
                borderRadius: 6, padding: '10px 0',
                color: '#f87171', cursor: 'pointer',
                fontSize: 12, letterSpacing: 3,
                textTransform: 'uppercase',
                fontFamily: "'Georgia', serif",
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(248,113,113,0.7)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'}
            >
              ⏻ Logout
            </button>
          </>
        ) : (
          <div style={{ color: '#f87171', textAlign: 'center' }}>Gagal memuat profil.</div>
        )}
      </div>
    </div>
  );
}

function btnStyle(bg: string, color: string, outline = false): React.CSSProperties {
  return {
    flex: 1, padding: '8px 0',
    background: bg,
    border: outline ? `1px solid ${color}` : 'none',
    borderRadius: 6, color,
    cursor: 'pointer', fontSize: 12,
    letterSpacing: 2, textTransform: 'uppercase',
    fontFamily: "'Georgia', serif",
  };
}