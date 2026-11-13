import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { DESKTOP_ITEMS } from '../../data/desktopData';
import type { DesktopItem } from '../../data/desktopData';

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: '#1e1e2e',
  surface: '#2a2a3e',
  surfaceHover: '#32324a',
  surfaceActive: '#3a3a52',
  border: 'rgba(255,255,255,0.08)',
  borderHover: 'rgba(255,255,255,0.16)',
  accent: '#818cf8',
  accentSoft: 'rgba(129,140,248,0.15)',
  accentGlow: 'rgba(129,140,248,0.35)',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  textFaint: '#475569',
  danger: '#f87171',
  dangerSoft: 'rgba(248,113,113,0.12)',
  success: '#34d399',
  successSoft: 'rgba(52,211,153,0.12)',
  taskbar: 'rgba(15,15,25,0.9)',
  glass: 'rgba(30,30,50,0.85)',
  shadow: '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
  shadowSm: '0 2px 8px rgba(0,0,0,0.3)',
};
function FolderUnlockModal({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = () => {
    if (code === '6417') {
      onSuccess();
    } else {
      setError(true);
      setShake(true);
      setCode('');
      setTimeout(() => { setError(false); setShake(false); }, 600);
    }
  };

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50,
    }}>
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12, padding: '24px 28px',
        width: 280,
        display: 'flex', flexDirection: 'column', gap: 16,
        animation: shake ? 'shakeForm 0.45s ease' : 'none',
        boxShadow: C.shadow,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Folder Terkunci</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Masukkan kode 4 digit untuk membuka</div>
        </div>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value.slice(0, 4))}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          maxLength={4}
          placeholder="• • • •"
          autoFocus
          style={{
            background: C.bg,
            border: `1.5px solid ${error ? C.danger : C.border}`,
            borderRadius: 8, color: C.text,
            fontFamily: 'inherit', fontSize: 22,
            letterSpacing: 12, padding: '10px 12px',
            outline: 'none', textAlign: 'center',
            transition: 'border-color 0.15s',
            caretColor: C.accent,
          }}
        />

        {error && (
          <div style={{
            background: C.dangerSoft,
            border: `1px solid rgba(248,113,113,0.25)`,
            borderRadius: 8, padding: '7px 12px',
            fontSize: 11, color: C.danger,
          }}>
            ⚠️ Kode salah. Coba lagi.
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{
            flex: 1, background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${C.border}`, borderRadius: 8,
            color: C.textMuted, fontFamily: 'inherit',
            fontSize: 12, padding: '8px 0', cursor: 'pointer',
          }}>
            Batal
          </button>
          <button onClick={handleSubmit} style={{
            flex: 2, background: C.accent, border: 'none',
            borderRadius: 8, color: '#fff',
            fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
            padding: '8px 0', cursor: 'pointer',
            boxShadow: `0 2px 8px ${C.accentGlow}`,
          }}>
            Buka →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── LoginScreen ───────────────────────────────────────────────────────────────
function LoginScreen({ username, id, error, shake, onUsernameChange, onIdChange, onSubmit }: {
  username: string; id: string; error: boolean; shake: boolean;
  onUsernameChange: (v: string) => void;
  onIdChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `radial-gradient(ellipse at 60% 40%, rgba(99,102,241,0.08) 0%, transparent 70%)`,
    }}>
      <div style={{
        width: 320,
        background: C.surface,
        borderRadius: 16,
        border: `1px solid ${C.border}`,
        boxShadow: C.shadow,
        padding: '32px 28px',
        display: 'flex', flexDirection: 'column', gap: 20,
        animation: shake ? 'shakeForm 0.45s ease' : 'none',
      }}>
        {/* Avatar / lock icon */}
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: C.accentSoft,
            border: `2px solid ${error ? C.danger : C.accent}`,
            margin: '0 auto 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
            transition: 'border-color 0.2s',
            boxShadow: error ? `0 0 16px rgba(248,113,113,0.3)` : `0 0 16px ${C.accentGlow}`,
          }}>
            🔐
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text, letterSpacing: 0.3 }}>
            Masuk ke Sistem
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
            CM-23 OS v2.4.1
          </div>
        </div>

        {/* Username */}
        <InputField
          label="Username"
          value={username}
          onChange={(v) => onUsernameChange(v.toUpperCase())}
          onEnter={onSubmit}
          error={error}
          placeholder="Masukkan username..."
        />

        {/* ID */}
        <InputField
          label="ID Karyawan"
          value={id}
          onChange={onIdChange}
          onEnter={onSubmit}
          error={error}
          placeholder="Masukkan ID..."
        />

        {/* Error */}
        {error && (
          <div style={{
            background: C.dangerSoft,
            border: `1px solid rgba(248,113,113,0.25)`,
            borderRadius: 8, padding: '8px 12px',
            fontSize: 11, color: C.danger,
            display: 'flex', alignItems: 'center', gap: 6,
            animation: 'fadeSlideIn 0.2s ease',
          }}>
            <span>⚠️</span>
            <span>Kredensial tidak valid. Coba lagi.</span>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={onSubmit}
          style={{
            background: C.accent,
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            fontSize: 13, fontWeight: 600,
            padding: '10px 0',
            cursor: 'pointer',
            letterSpacing: 0.3,
            boxShadow: `0 4px 16px ${C.accentGlow}`,
            transition: 'all 0.15s',
            marginTop: 4,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
            (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${C.accentGlow}`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${C.accentGlow}`;
          }}
        >
          Masuk →
        </button>
      </div>

      <style>{`
        @keyframes shakeForm {
          0%,100% { transform: translateX(0); }
          15% { transform: translateX(-7px); }
          30% { transform: translateX(7px); }
          50% { transform: translateX(-4px); }
          70% { transform: translateX(4px); }
          90% { transform: translateX(-2px); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── InputField (reusable) ─────────────────────────────────────────────────────
function InputField({ label, value, onChange, onEnter, error, placeholder }: {
  label: string; value: string; error: boolean; placeholder?: string;
  onChange: (v: string) => void; onEnter: () => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
        color: error ? C.danger : focused ? C.accent : C.textMuted,
        transition: 'color 0.15s',
      }}>
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onEnter()}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        autoComplete="off" spellCheck={false}
        style={{
          background: C.bg,
          border: `1.5px solid ${error ? C.danger : focused ? C.accent : C.border}`,
          borderRadius: 8,
          color: C.text,
          fontFamily: 'inherit',
          fontSize: 13,
          padding: '9px 12px',
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box' as const,
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: focused ? `0 0 0 3px ${C.accentSoft}` : 'none',
          caretColor: C.accent,
        }}
      />
    </div>
  );
}

// ── DesktopIcon ───────────────────────────────────────────────────────────────
function DesktopIcon({ item, isOpen, isRepaired, isRepairing, repairProgress, onClick }: {
  item: DesktopItem; isOpen: boolean; isRepaired: boolean;
  isRepairing: boolean; repairProgress: number; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isCorrupted = item.corrupted && !isRepaired;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isOpen
          ? C.accentSoft
          : hovered ? 'rgba(255,255,255,0.05)' : 'transparent',
        border: `1.5px solid ${isOpen ? C.accent : hovered ? C.borderHover : 'transparent'}`,
        borderRadius: 10,
        color: C.text,
        fontFamily: 'inherit',
        padding: '10px 8px 8px',
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        width: 72,
        transition: 'all 0.15s',
        opacity: isCorrupted ? 0.55 : 1,
        position: 'relative',
        boxShadow: isOpen ? `0 0 0 3px ${C.accentSoft}` : 'none',
      }}
    >
      {/* Icon */}
      <span style={{
        fontSize: 26,
        filter: isCorrupted ? 'grayscale(1) brightness(0.4)' : 'none',
        animation: isCorrupted ? 'glitch 2.5s infinite' : 'none',
        transition: 'transform 0.1s',
        transform: hovered && !isCorrupted ? 'scale(1.1)' : 'scale(1)',
      }}>
        {isCorrupted ? '📁' : item.icon}
      </span>

      {/* Label */}
      <span style={{
        fontSize: 9, fontWeight: 500, letterSpacing: 0.2,
        textAlign: 'center', lineHeight: 1.4,
        wordBreak: 'break-all',
        color: isCorrupted ? C.danger : C.textMuted,
        maxWidth: 64,
      }}>
        {isCorrupted ? 'corrupt' : item.name}
      </span>

      {/* Repair progress */}
      {isRepairing && (
        <div style={{
          position: 'absolute', bottom: 0, left: 6, right: 6,
          height: 2, background: 'rgba(255,255,255,0.1)',
          borderRadius: 99,
        }}>
          <div style={{
            height: '100%', width: `${repairProgress}%`,
            background: C.accent,
            borderRadius: 99,
            transition: 'width 0.04s linear',
            boxShadow: `0 0 6px ${C.accentGlow}`,
          }} />
        </div>
      )}

      {/* Corrupt badge */}
      {isCorrupted && (
        <div style={{
          position: 'absolute', top: 5, right: 5,
          fontSize: 8, color: C.danger,
          background: C.dangerSoft,
          borderRadius: 99, width: 14, height: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>!</div>
      )}
    </button>
  );
}

// ── WindowFrame (shared window chrome) ────────────────────────────────────────
function WindowFrame({ title, icon, onClose, children }: {
  title: string; icon?: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: C.glass,
      backdropFilter: 'blur(12px)',
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      zIndex: 20, display: 'flex', flexDirection: 'column',
      animation: 'winOpen 0.18s cubic-bezier(0.34,1.3,0.64,1)',
      boxShadow: C.shadow,
      overflow: 'hidden',
    }}>
      {/* Title bar — macOS style */}
      <div style={{
        height: 38,
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center',
        padding: '0 14px',
        flexShrink: 0, gap: 8,
      }}>
        {/* Traffic lights */}
        <div style={{ display: 'flex', gap: 6, marginRight: 8 }}>
          {[C.danger, '#fbbf24', C.success].map((color, i) => (
            <div
              key={i}
              onClick={i === 0 ? onClose : undefined}
              style={{
                width: 12, height: 12, borderRadius: '50%',
                background: color, opacity: 0.85,
                cursor: i === 0 ? 'pointer' : 'default',
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: 12, fontWeight: 500, color: C.text, flex: 1, textAlign: 'center' }}>
          {icon && `${icon} `}{title}
        </span>
        <div style={{ width: 54 }} /> {/* spacer untuk balance */}
      </div>

      {children}
    </div>
  );
}

// ── DocWindow ─────────────────────────────────────────────────────────────────
function DocWindow({ item, onClose }: { item: DesktopItem; onClose: () => void }) {
  const [showHand, setShowHand] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const uvFlashlightActive = useGameStore((s) => s.uvFlashlightActive);
  const FLASHLIGHT_RADIUS = 80;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <WindowFrame title={item.name} icon={item.icon} onClose={onClose}>
      <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
        {item.type === 'image' ? (
          <div style={{ position: 'relative' }}>
            <img
              src={item.imageSrc}
              style={{ width: '100%', borderRadius: 8, display: 'block' }}
              alt={item.name}
            />

            {/* Fingerprint clickable area */}
            {item.fingerprintArea && !showHand && (
              <div
onClick={() => {
  useGameStore.getState().setDesktopOpen(false);
  useGameStore.getState().setUvFlashlightActive(true);
  useGameStore.getState().setHandInspectOpen(true);
  useGameStore.getState().setSceneDialogOverlay({
    lines: [
      { character: 'Vania', text: 'I-i ini kan aku? kenapa aku ada disini, bentar apakah aku punya tanda di tanganku, mari coba aku perika', side: 'right' as const, avatarRight: '/avatars/vania4.png' },
      { character: 'Vania', text: 'tekan area fingerprint di gambar tsb', side: 'right' as const, avatarRight: '/avatars/vania4.png' },
    ],
    position: 'bottom',
  });
}}                style={{
                  position: 'absolute',
                  left: item.fingerprintArea.x,
                  top: item.fingerprintArea.y,
                  width: item.fingerprintArea.width,
                  height: item.fingerprintArea.height,
                  cursor: 'zoom-in',
                  border: '2px dashed rgba(129,140,248,0.4)',
                  borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(129,140,248,0.05)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(129,140,248,0.12)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(129,140,248,0.7)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(129,140,248,0.05)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(129,140,248,0.4)';
                }}
              >
                <span style={{ fontSize: 9, color: 'rgba(129,140,248,0.7)', letterSpacing: 1 }}>
                  🔍 INSPECT
                </span>
              </div>
            )}

            {/* Hand inspect overlay - fullscreen dalam window */}
            {showHand && item.fingerprintArea && (
              <div
                style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(10,10,20,0.95)',
                  borderRadius: 8,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 12,
                }}
                onMouseMove={handleMouseMove}
              >
                {/* Back button */}
                <button
                  onClick={() => setShowHand(false)}
                  style={{
                    position: 'absolute', top: 12, left: 12,
                    background: 'rgba(255,255,255,0.08)',
                    border: `1px solid ${C.border}`,
                    borderRadius: 6, color: C.textMuted,
                    fontSize: 11, padding: '4px 10px',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  ← Kembali
                </button>

                {/* Label */}
                <div style={{
                  fontSize: 10, color: C.textFaint,
                  letterSpacing: 2, textTransform: 'uppercase',
                  position: 'absolute', top: 14, right: 14,
                }}>
                  {uvFlashlightActive ? '🔦 UV ACTIVE' : 'FINGERPRINT SCAN'}
                </div>

                {/* Gambar tangan */}
                <div style={{ position: 'relative', width: '70%' }}>
                  {/* Base image tangan */}
                  <img
                    src={item.fingerprintArea.handImage}
                    style={{ width: '100%', display: 'block', borderRadius: 8 }}
                    alt="hand"
                    draggable={false}
                  />

                  {/* UV overlay dengan mask flashlight */}
                  {uvFlashlightActive && (
                    <img
                      src={item.fingerprintArea.uvImage}
                      style={{
                        position: 'absolute', inset: 0,
                        width: '100%', height: '100%',
                        objectFit: 'cover',
                        borderRadius: 8,
                        WebkitMaskImage: `radial-gradient(circle ${FLASHLIGHT_RADIUS}px at ${mousePos.x}px ${mousePos.y}px, black 0%, black 50%, transparent 100%)`,
                        maskImage: `radial-gradient(circle ${FLASHLIGHT_RADIUS}px at ${mousePos.x}px ${mousePos.y}px, black 0%, black 50%, transparent 100%)`,
                        pointerEvents: 'none',
                      }}
                      alt="hand uv"
                      draggable={false}
                    />
                  )}

                  {/* Glow ring flashlight */}
                  {uvFlashlightActive && (
                    <div style={{
                      position: 'absolute',
                      left: mousePos.x - FLASHLIGHT_RADIUS,
                      top: mousePos.y - FLASHLIGHT_RADIUS,
                      width: FLASHLIGHT_RADIUS * 2,
                      height: FLASHLIGHT_RADIUS * 2,
                      borderRadius: '50%',
                      border: '2px solid rgba(179,0,255,0.3)',
                      boxShadow: '0 0 20px rgba(179,0,255,0.15)',
                      pointerEvents: 'none',
                    }} />
                  )}
                </div>

                {/* Hint UV */}
                {!uvFlashlightActive && (
                  <div style={{
                    fontSize: 10, color: C.textFaint,
                    letterSpacing: 1, textAlign: 'center',
                    animation: 'fadeSlideIn 0.3s ease',
                  }}>
                    💡 Aktifkan UV Flashlight untuk reveal fingerprint
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // render doc text seperti biasa
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {item.content?.map((row, i) => (
              <div key={i} style={{ fontSize: 12, lineHeight: 1.7 }}>
                {row.label === '──────────────────' ? (
                  <div style={{ borderTop: `1px solid ${C.border}`, margin: '8px 0' }} />
                ) : row.label === '' ? (
                  <span style={{ color: C.textMuted, paddingLeft: 4 }}>{row.value}</span>
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ color: C.textFaint, minWidth: 90, fontSize: 11 }}>{row.label}</span>
                    {row.value && <span style={{ color: C.text, fontWeight: 500 }}>{row.value}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </WindowFrame>
  );
}

// ── CctvWindow ────────────────────────────────────────────────────────────────
function CctvWindow({ onClose, onUnlock }: { onClose: () => void; onUnlock: () => void }) {
  const cctvUnlocked = useGameStore((s) => s.cctvUnlocked);
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = () => {
    if (code === '4725') {
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => { setError(false); setShake(false); }, 600);
      setCode('');
    }
  };

  return (
    <WindowFrame title="CCTV — Pintu Utama" icon="📹" onClose={onClose}>
      {/* Feed */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <img
          src={cctvUnlocked ? '/backgrounds/escape2.jpg' : '/backgrounds/escape1.jpg'}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          alt="cctv"
        />
        {/* Scanline overlay — subtle */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 4px)',
          pointerEvents: 'none',
        }} />
        {/* Chip kiri atas */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          borderRadius: 6, padding: '4px 8px',
          fontSize: 10, color: '#ef4444',
          fontWeight: 600, letterSpacing: 1,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ animation: 'blink 1s step-start infinite' }}>●</span> REC 02:17:44
        </div>
        {/* Status kanan bawah */}
        <div style={{
          position: 'absolute', bottom: 10, right: 10,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          borderRadius: 6, padding: '4px 10px',
          fontSize: 10, fontWeight: 600,
          color: cctvUnlocked ? C.success : C.danger,
        }}>
          {cctvUnlocked ? '🔓 Terbuka' : '🔒 Terkunci'}
        </div>
      </div>

      {/* Keypad */}
      {!cctvUnlocked && (
        <div style={{
          padding: '14px 16px',
          borderTop: `1px solid ${C.border}`,
          background: C.surface,
          animation: shake ? 'shakeForm 0.45s ease' : 'none',
        }}>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>
            Masukkan kode akses (3 digit)
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.slice(0, 4))}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              maxLength={4}
              placeholder="• • • •"
              style={{
                flex: 1, background: C.bg,
                border: `1.5px solid ${error ? C.danger : C.border}`,
                borderRadius: 8, color: C.text,
                fontFamily: 'inherit', fontSize: 18,
                letterSpacing: 10, padding: '7px 12px',
                outline: 'none', caretColor: C.accent,
                textAlign: 'center',
                transition: 'border-color 0.15s',
              }}
            />
            <button
              onClick={handleSubmit}
              style={{
                background: C.accent, border: 'none',
                borderRadius: 8, color: '#fff',
                fontFamily: 'inherit', fontSize: 12,
                fontWeight: 600, padding: '0 16px',
                cursor: 'pointer',
                boxShadow: `0 2px 8px ${C.accentGlow}`,
              }}
            >
              OK
            </button>
          </div>
          {error && (
            <div style={{
              marginTop: 8, fontSize: 11, color: C.danger,
              background: C.dangerSoft,
              borderRadius: 6, padding: '6px 10px',
            }}>
              ⚠️ Kode salah. Coba lagi.
            </div>
          )}
        </div>
      )}

      {cctvUnlocked && (
        <div style={{
          padding: '12px 16px', borderTop: `1px solid ${C.border}`,
          background: C.successSoft, fontSize: 11,
          color: C.success, fontWeight: 500,
          animation: 'fadeSlideIn 0.4s ease',
        }}>
          ✅ Pintu utama berhasil dibuka — mendeteksi pergerakan...
        </div>
      )}

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </WindowFrame>
  );
}

// ── DesktopOS (Main) ──────────────────────────────────────────────────────────
interface Props { onClose: () => void; }

type ActiveWindow =
  | { type: 'doc' | 'image' | 'folder_content'; item: DesktopItem }
  | { type: 'cctv' }
  | null;

export function DesktopOS({ onClose }: Props) {
  const [time] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  const loggedIn = useGameStore((s) => s.desktopLoggedIn);
  const setLoggedIn = useGameStore((s) => s.setDesktopLoggedIn);
  const username = useGameStore((s) => s.desktopUsername);
  const id = useGameStore((s) => s.desktopId);
  const setUsername = useGameStore((s) => s.setDesktopUsername);
  const setId = useGameStore((s) => s.setDesktopId);

  const repairedFiles = useGameStore((s) => s.desktopRepairedFiles);
  const repairFile = useGameStore((s) => s.repairFile);
  const setCctvUnlocked = useGameStore((s) => s.setCctvUnlocked);
  const char1Inventory = useGameStore((s) => s.char1Inventory);
  const hasHackingDevice = char1Inventory.some((i) => i.id === 'hacking_device');

  const [currentFolder, setCurrentFolder] = useState<DesktopItem | null>(null);
  const [repairingId, setRepairingId] = useState<string | null>(null);
  const [repairProgress, setRepairProgress] = useState(0);
  const [activeWindow, setActiveWindow] = useState<ActiveWindow>(null);
  const [loginError, setLoginError] = useState(false);
  const [shake, setShake] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sidePanel, setSidePanel] = useState<'hint' | 'tools' | 'chat' | null>(null);
  const folderLocked = useGameStore((s) => s.desktopFolderLocked);
  const setFolderLocked = useGameStore((s) => s.setDesktopFolderLocked);
  const [showFolderUnlock, setShowFolderUnlock] = useState(false);
  const [pendingFolder, setPendingFolder] = useState<DesktopItem | null>(null);
  const handleLogin = () => {
    if (username === 'KATSURAGI_TAKUMI' && id === '23191012') {
      setLoggedIn(true);
    } else {
      setLoginError(true);
      setShake(true);
      setTimeout(() => { setLoginError(false); setShake(false); }, 600);
    }
  };

  const startRepair = (fileId: string) => {
    setRepairingId(fileId);
    setRepairProgress(0);
    const interval = setInterval(() => {
      setRepairProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          repairFile(fileId);
          setRepairingId(null);
          setRepairProgress(0);
          return 100;
        }
        return prev + 2;
      });
    }, 40);
  };

  const handleItemClick = (item: DesktopItem) => {
    // Cek akses folder ? hanya char2
    if (item.id === 'folder_mystery') {
      const activeChar = useGameStore.getState().activeCharacter;
      if (activeChar !== 'char2') {
        setActiveWindow({
          type: 'doc',
          item: {
            ...item,
            type: 'doc',
            content: [
              { label: 'ACCESS DENIED', value: '' },
              { label: '──────────────────', value: '' },
              { label: '', value: 'Folder ini hanya bisa diakses oleh Vania' },
            ]
          }
        });
        return;
      }
    }

    if (item.type === 'folder') {
      // Hanya folder_mystery yang dikunci dengan kode
      if (item.id === 'folder_mystery' && folderLocked) {
        setPendingFolder(item);
        setShowFolderUnlock(true);
        return;
      }
      setCurrentFolder(item);
      setActiveWindow(null);
      return;
    }
    if (item.type === 'exe' && item.appType === 'cctv') {
      setActiveWindow({ type: 'cctv' });
      return;
    }
    if (item.corrupted && !repairedFiles.includes(item.id)) {
      if (!hasHackingDevice) {
        setActiveWindow({
          type: 'doc',
          item: {
            ...item,
            content: [{ label: 'ERROR', value: 'File rusak — Hacking Device diperlukan' }]
          }
        });
        return;
      }
      startRepair(item.id);
      return;
    }
    if (activeWindow && 'item' in activeWindow && activeWindow.item.id === item.id) {
      setActiveWindow(null);
    } else {
      setActiveWindow({ type: item.type === 'image' ? 'image' : 'doc', item });
    }
  };

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const items = currentFolder ? currentFolder.children ?? [] : DESKTOP_ITEMS;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'url(/backgrounds/kuy.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Backdrop */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(2px)',
      }} />

      {/* Monitor frame */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative', zIndex: 1,
          width: '60vw', height: '75vh',
          marginTop: '-1vh', marginLeft: '1.2vw',
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          color: C.text,
          overflow: 'hidden',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'scale(1)' : 'scale(0.94)',
          transition: 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.34,1.2,0.64,1)',
        }}
        
      >
        {/* Taskbar atas */}
        <div style={{
          height: 34,
          background: C.taskbar,
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 14px',
          fontSize: 11, zIndex: 10, flexShrink: 0,
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>💻</span>
            <span style={{ color: C.textMuted, fontWeight: 500 }}>
              {currentFolder ? currentFolder.name : 'Desktop'}
            </span>
            {currentFolder && (
              <>
                <span style={{ color: C.textFaint }}>›</span>
                <span style={{ color: C.text }}>{currentFolder.name}</span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', color: C.textMuted }}>
            <span style={{ fontSize: 10 }}>{loggedIn ? '🟢 Online' : '🔴 Terkunci'}</span>
            <span style={{ fontWeight: 600, color: C.text }}>{time}</span>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${C.border}`,
                color: C.textMuted, fontSize: 11,
                padding: '2px 8px', cursor: 'pointer',
                fontFamily: 'inherit', borderRadius: 6,
                transition: 'all 0.1s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = C.dangerSoft;
                (e.currentTarget as HTMLElement).style.color = C.danger;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                (e.currentTarget as HTMLElement).style.color = C.textMuted;
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Desktop area + sidebar */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
          {/* Sidebar (hint/tools/chat) */}
          {loggedIn && (
            <div style={{
              width: 44, flexShrink: 0,
              background: 'rgba(15,15,25,0.6)',
              borderLeft: `1px solid ${C.border}`,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 8,
              padding: '10px 0', zIndex: 5,
            }}>
              {[
                { id: 'hint', icon: '💡', label: 'Hint' },
                { id: 'tools', icon: '🛠', label: 'Tools' },
                { id: 'chat', icon: '💬', label: 'Chat' },
              ].map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSidePanel(sidePanel === b.id ? null : (b.id as any))}
                  title={b.label}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: sidePanel === b.id ? C.accentSoft : 'transparent',
                    border: `1px solid ${sidePanel === b.id ? C.accent : 'transparent'}`,
                    color: sidePanel === b.id ? C.accent : C.textMuted,
                    fontSize: 14, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {b.icon}
                </button>
              ))}
            </div>
          )}
          {/* Side panel content */}
          {loggedIn && sidePanel && (
            <div style={{
              position: 'absolute', right: 44, top: 0, bottom: 0,
              width: 260, background: C.surface,
              borderLeft: `1px solid ${C.border}`,
              padding: 12, overflowY: 'auto', zIndex: 4,
              boxShadow: '-4px 0 12px rgba(0,0,0,0.3)',
            }}>
              <div style={{ color: C.textMuted, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>
                {sidePanel === 'hint' ? '💡 Hint' : sidePanel === 'tools' ? '🛠 Tools' : '💬 Chat'}
              </div>
              {sidePanel === 'hint' && <div style={{ color: C.text, fontSize: 12 }}>Hint panel (placeholder)</div>}
              {sidePanel === 'tools' && <div style={{ color: C.text, fontSize: 12 }}>Tools: Notes + Kalkulator (placeholder)</div>}
              {sidePanel === 'chat' && <div style={{ color: C.text, fontSize: 12 }}>Chat (placeholder)</div>}
            </div>
          )}
          {!loggedIn ? (
            <LoginScreen
              username={username} id={id}
              error={loginError} shake={shake}
              onUsernameChange={setUsername}
              onIdChange={setId}
              onSubmit={handleLogin}
            />
          ) : (
            <>
              {/* Wallpaper subtle pattern */}
<div style={{
  position: 'absolute', inset: 0,
  background: `radial-gradient(ellipse at 70% 30%, rgba(99,102,241,0.06) 0%, transparent 60%)`,
  pointerEvents: 'none',
}}>
  {/* Segitiga SVG wallpaper */}
  <svg
    width="100%" height="100%"
    viewBox="0 0 400 400"
    xmlns="http://www.w3.org/2000/svg"
    style={{ opacity: 0.08 }}
  >
    <polygon
      points="200,30 370,340 30,340"
      fill="#1ae44dff"
    />
  </svg>
</div>

              {/* Icon grid */}
              <div style={{
                padding: '16px 14px',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 72px)',
                gridAutoRows: 'auto',
                alignContent: 'flex-start',
                gap: 12, zIndex: 2,
                overflowY: 'auto',
                minWidth: 0,
              }}>
                {currentFolder && (
                  <button
                    onClick={() => setCurrentFolder(null)}
                    style={{
                      gridColumn: 'span 2',
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      color: C.textMuted, fontFamily: 'inherit',
                      fontSize: 11, cursor: 'pointer',
                      padding: '5px 10px', textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    ← Kembali
                  </button>
                )}

                {items.map((item) => (
                  <DesktopIcon
                    key={item.id}
                    item={item}
                    isOpen={
                      activeWindow && 'item' in activeWindow
                        ? activeWindow.item.id === item.id
                        : activeWindow?.type === 'cctv' && item.appType === 'cctv'
                    }
                    isRepaired={repairedFiles.includes(item.id)}
                    isRepairing={repairingId === item.id}
                    repairProgress={repairProgress}
                    onClick={() => handleItemClick(item)}
                  />
                ))}
              </div>
{showFolderUnlock && (
  <FolderUnlockModal
    onSuccess={() => {
      setFolderLocked(false);
      setShowFolderUnlock(false);
      // Trigger scene7_3_folder dialog when Kayshi (char2/Vania) opens the folder
      useGameStore.getState().triggerSceneDialog('scene7_3_folder');
      if (pendingFolder) {
        setCurrentFolder(pendingFolder);
        setPendingFolder(null);
      }
    }}
    onClose={() => {
      setShowFolderUnlock(false);
      setPendingFolder(null);
    }}
  />
)}
              {/* Window aktif */}
              {activeWindow?.type === 'cctv' && (
                <CctvWindow
                  onClose={() => setActiveWindow(null)}
                  onUnlock={() => {
                    setCctvUnlocked(true);
                    setTimeout(() => {
                      setActiveWindow(null);
                      useGameStore.getState().solvePuzzle('puzzle_scene3');
                    }, 1500);
                  }}
                />
              )}
              {activeWindow && activeWindow.type !== 'cctv' && 'item' in activeWindow && (
                <DocWindow item={activeWindow.item} onClose={() => setActiveWindow(null)} />
              )}
            </>
          )}
        </div>

        {/* Status bar bawah */}
        <div style={{
          height: 26,
          background: C.taskbar,
          borderTop: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center',
          padding: '0 14px', gap: 20,
          fontSize: 10, color: C.textFaint,
          zIndex: 10, flexShrink: 0,
          backdropFilter: 'blur(8px)',
        }}>
          <span>{items.length} item</span>
          <span>Pengguna: {loggedIn ? 'Terautentikasi' : 'Terbatas'}</span>
          <span>Sektor 03</span>
          {activeWindow && 'item' in activeWindow && (
            <span style={{ color: C.accent, marginLeft: 'auto' }}>
              📄 {activeWindow.item.name}
            </span>
          )}
          {activeWindow?.type === 'cctv' && (
            <span style={{ color: C.accent, marginLeft: 'auto' }}>📹 cctv.exe</span>
          )}
        </div>

        {/* Animations */}
        <style>{`
          @keyframes glitch {
            0%,100% { transform: translate(0); filter: grayscale(1) brightness(0.4); }
            20% { transform: translate(-2px,1px); filter: grayscale(1) brightness(0.6) hue-rotate(30deg); }
            40% { transform: translate(2px,-1px); filter: grayscale(1) brightness(0.3); }
            60% { transform: translate(-1px,2px); filter: grayscale(1) brightness(0.55); }
            80% { transform: translate(1px,-1px); filter: grayscale(1) brightness(0.4); }
          }
          @keyframes winOpen {
            from { opacity: 0; transform: scale(0.97) translateY(-6px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(-4px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes shakeForm {
            0%,100% { transform: translateX(0); }
            15% { transform: translateX(-7px); }
            30% { transform: translateX(7px); }
            50% { transform: translateX(-4px); }
            70% { transform: translateX(4px); }
            90% { transform: translateX(-2px); }
          }
        `}</style>
      </div>
    </div>
  );
}