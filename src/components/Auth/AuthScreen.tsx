import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { loginPlayer, registerPlayer } from '../../hooks/useapi';
import { MetalButton } from '../UI/MetalButton';

export function AuthScreen() {
  const { setPlayer, setGuest } = useGameStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      let result;
      if (mode === 'login') {
        result = await loginPlayer({ email: form.email, password: form.password });
      } else {
        result = await registerPlayer(form);
      }
      setPlayer(result.player, result.token);
      await useGameStore.getState().syncProgress();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'url(/backgrounds/splash_bg.png) center/cover no-repeat',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Georgia', serif", zIndex: 9999,
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)' }} />

      <div style={{
        position: 'relative', zIndex: 1,
        width: 360,
        background: 'linear-gradient(160deg, #0f0c20, #1a1530)',
        border: '1px solid rgba(200,184,154,0.2)',
        borderRadius: 16, padding: '36px 32px',
        display: 'flex', flexDirection: 'column', gap: 0,
      }}>
        {/* Judul */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            color: '#e8d5b7', fontSize: 28, fontWeight: 700,
            letterSpacing: 6, textTransform: 'uppercase',
          }}>
            {mode === 'login' ? 'LOGIN' : 'REGISTER'}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 12, marginTop: 10,
          }}>
            <div style={{ width: 40, height: 1, background: '#c8b89a', opacity: 0.3 }} />
            <div style={{
              width: 5, height: 5,
              border: '1px solid #c8b89a',
              transform: 'rotate(45deg)', opacity: 0.5,
            }} />
            <div style={{ width: 40, height: 1, background: '#c8b89a', opacity: 0.3 }} />
          </div>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {mode === 'register' && (
            <InputField
              label="Username"
              value={form.username}
              onChange={(v) => setForm((f) => ({ ...f, username: v }))}
            />
          )}
          <InputField
            label="Email"
            type="email"
            value={form.email}
            onChange={(v) => setForm((f) => ({ ...f, email: v }))}
          />
          <InputField
            label="Password"
            type="password"
            value={form.password}
            onChange={(v) => setForm((f) => ({ ...f, password: v }))}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            color: '#f87171', fontSize: 12,
            textAlign: 'center', marginBottom: 12,
            fontFamily: 'sans-serif',
          }}>
            {error}
          </div>
        )}

        {/* Tombol submit */}
        <MetalButton
          onClick={(e) => { e.stopPropagation(); handleSubmit(); }}
          label={loading ? 'Loading...' : mode === 'login' ? 'MASUK' : 'DAFTAR'}
        />

        {/* Switch mode */}
        <div style={{
          textAlign: 'center', marginTop: 16,
          color: '#8a7a6a', fontSize: 12,
          borderTop: '1px solid rgba(200,184,154,0.1)',
          paddingTop: 16,
        }}>
          {mode === 'login' ? (
            <>
              Belum punya akun?{' '}
              <span
                onClick={() => { setMode('register'); setError(''); }}
                style={{ color: '#c8b89a', cursor: 'pointer', letterSpacing: 1 }}
              >
                DAFTAR
              </span>
            </>
          ) : (
            <>
              Sudah punya akun?{' '}
              <span
                onClick={() => { setMode('login'); setError(''); }}
                style={{ color: '#c8b89a', cursor: 'pointer', letterSpacing: 1 }}
              >
                LOGIN
              </span>
            </>
          )}
        </div>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 12, margin: '16px 0',
        }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(200,184,154,0.15)' }} />
          <span style={{ color: '#4a4a4a', fontSize: 11, letterSpacing: 2 }}>ATAU</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(200,184,154,0.15)' }} />
        </div>

        {/* Lanjut sebagai guest */}
        <button
          onClick={setGuest}
          style={{
            background: 'transparent',
            border: '1px solid rgba(200,184,154,0.15)',
            borderRadius: 4, color: '#6a6a6a',
            padding: '12px 0', cursor: 'pointer',
            fontSize: 12, letterSpacing: 3,
            textTransform: 'uppercase',
            fontFamily: "'Georgia', serif",
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#c8b89a';
            e.currentTarget.style.borderColor = 'rgba(200,184,154,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#6a6a6a';
            e.currentTarget.style.borderColor = 'rgba(200,184,154,0.15)';
          }}
        >
          🎮 Lanjut sebagai Guest
        </button>

        <p style={{
          color: '#4a4a4a', fontSize: 10,
          textAlign: 'center', marginTop: 8,
          fontFamily: 'sans-serif',
        }}>
          Skor guest tidak masuk leaderboard
        </p>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text' }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        color: '#8a7a6a', fontSize: 9,
        letterSpacing: 3, textTransform: 'uppercase',
      }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        style={{
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(200,184,154,0.2)',
          borderRadius: 6, padding: '10px 14px',
          color: '#e8d5b7', fontSize: 14,
          fontFamily: 'sans-serif', outline: 'none',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(200,184,154,0.6)'}
        onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(200,184,154,0.2)'}
      />
    </div>
  );
}