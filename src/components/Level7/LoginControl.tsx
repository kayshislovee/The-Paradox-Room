// PodLoginGate.tsx
// Gate sebelum PodControlPuzzle: login username+ID karyawan + face unlock (1 Fase)
import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';

// ─── Kredensial ───────────────────────────────────────────────────────────────
const VALID_USERNAME = 'REN_SINCLAIR';
const VALID_EMPLOYEE_ID = '1574';
const PHOTOCARD_ITEM_ID = 'photo_card';

// ─── Warna Tema ───────────────────────────────────────────────────────────────
const G = {
  bg:         '#050a05',
  panel:      '#080f08',
  border:     '#1a3a1a',
  borderBright:'#22c55e',
  green:      '#22c55e',
  greenDim:   '#166534',
  greenGlow:  '#22c55e33',
  text:       '#d1fae5',
  textMuted:  '#4b7a55',
  textDim:    '#2d4a30',
  inputBg:    '#060d06',
  error:      '#f87171',
  scanBg:     '#030703',
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onSuccess: () => void;
  onClose:   () => void;
}

// ─── Komponen Input Field ─────────────────────────────────────────────────────
function LoginInput({
  label, value, onChange, type = 'text', placeholder, error, onEnter,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; error?: boolean; onEnter?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: 10, letterSpacing: 2, fontFamily: 'Courier New',
        color: error ? G.error : focused ? G.green : G.textMuted,
        fontWeight: 700, transition: 'color 0.2s',
      }}>
        {label}
      </label>
      <input
        name="pod-control-field"
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onEnter?.()}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        autoComplete="new-password"
        data-lpignore="true"
        style={{
          background: G.inputBg,
          border: `1px solid ${error ? G.error : focused ? G.borderBright : G.border}`,
          borderRadius: 6,
          padding: '12px 14px',
          fontFamily: 'Courier New',
          fontSize: 14,
          color: G.text,
          outline: 'none',
          letterSpacing: 1,
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxShadow: focused ? `0 0 0 2px ${G.greenGlow}` : 'none',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

// ─── Main: PodLoginGate (Satu Fase) ───────────────────────────────────────────
export function PodLoginGate({ onSuccess, onClose }: Props) {
  // Store
  const podFaceUnlocked    = useGameStore(s => (s as any).podFaceUnlocked ?? false);
  const setPodFaceUnlocked = useGameStore(s => (s as any).setPodFaceUnlocked);
  const username           = useGameStore(s => (s as any).podLoginUsername ?? '');
  const employeeId         = useGameStore(s => (s as any).podLoginEmployeeId ?? '');
  const setUsername        = useGameStore(s => (s as any).setPodLoginUsername);
  const setEmployeeId      = useGameStore(s => (s as any).setPodLoginEmployeeId);
  const setSavedLoginDone  = useGameStore(s => (s as any).setPodLoginDone);
  
  const char3Inventory           = useGameStore(s => s.char3Inventory ?? []);
  const removeFromChar3Inventory = useGameStore(s => s.removeFromChar3Inventory);
  const showNotification         = useGameStore(s => s.showNotification);

  // Local State
  const [mounted, setMounted]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [shake, setShake]       = useState(false);

  // Drag & Scan State
  const [dragging, setDragging] = useState(false);
  const [overZone, setOverZone] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanPct, setScanPct]   = useState(0);
  const [dragPos, setDragPos]   = useState({ x: 0, y: 0 });
  
  const zoneRef = useRef<HTMLDivElement>(null);
  
  const photocard = char3Inventory.find(i => i.id === PHOTOCARD_ITEM_ID);
  const hasCard   = !!photocard;

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setUsername('');
    setEmployeeId('');
  }, []);

  // ─── Drag Logic ──────────────────────────────────────────────
  const onMouseDownCard = (e: React.MouseEvent) => {
    if (!hasCard || scanning || podFaceUnlocked) return;
    setDragPos({ x: e.clientX - 32, y: e.clientY - 40 });
    setDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      setDragPos({ x: e.clientX - 32, y: e.clientY - 40 });
      if (zoneRef.current) {
        const r = zoneRef.current.getBoundingClientRect();
        setOverZone(
          e.clientX >= r.left && e.clientX <= r.right &&
          e.clientY >= r.top  && e.clientY <= r.bottom
        );
      }
    };
    const onUp = () => {
      setDragging(false);
      if (overZone) {
        setOverZone(false);
        startScan();
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, overZone]);

  const startScan = () => {
    setScanning(true);
    setError('');
    let p = 0;
    const iv = setInterval(() => {
      p += 2.5 + Math.random() * 3;
      if (p >= 100) {
        p = 100;
        setScanPct(100);
        clearInterval(iv);
        setTimeout(() => {
          setScanning(false);
          if (setPodFaceUnlocked) setPodFaceUnlocked(true);
          if (removeFromChar3Inventory) removeFromChar3Inventory(PHOTOCARD_ITEM_ID);
          showNotification('🪪 Biometrik dikonfirmasi.', 'success');
        }, 500);
      } else {
        setScanPct(Math.round(p));
      }
    }, 40);
  };

  // ─── Submit Logic ────────────────────────────────────────────
  const handleSubmit = () => {
    if (!username || !employeeId) {
      triggerError('Lengkapi Username dan ID Karyawan.');
      return;
    }
    if (!podFaceUnlocked) {
      triggerError('Otorisasi Biometrik (Face Unlock) diperlukan.');
      return;
    }

    setLoading(true);
    setError('');

    setTimeout(() => {
      if (username === VALID_USERNAME && employeeId === VALID_EMPLOYEE_ID) {
        setSavedLoginDone(true);
        onSuccess();
      } else {
        setLoading(false);
        triggerError('Kredensial tidak valid. Akses ditolak.');
      }
    }, 1200);
  };

  const triggerError = (msg: string) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 9998,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 590,
          
          background: G.panel,
          border: `1px solid ${G.border}`,
          borderRadius: 15,
          overflow: 'hidden',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'scale(1)' : 'scale(0.95)',
          transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.34,1.2,0.64,1)',
          boxShadow: `0 0 80px rgba(0,0,0,0.9), 0 0 0 1px ${G.border}`,
          display: 'flex', flexDirection: 'column',
          animation: shake ? 'shake 0.4s ease' : 'none',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          background: '#040804',
          borderBottom: `1px solid ${G.border}`,
          padding: '16px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: G.green, boxShadow: `0 0 8px ${G.green}`,
              animation: 'blink 1.2s step-start infinite',
            }} />
            <span style={{ fontFamily: 'Courier New', fontSize: 13, fontWeight: 700, letterSpacing: 3, color: G.text }}>
              SUBJECT CONTROL INTEGRATED SYSTEM
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: `1px solid ${G.border}`,
              borderRadius: 4, color: G.textMuted,
              fontSize: 12, padding: '4px 10px', cursor: 'pointer',
              fontFamily: 'Courier New', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = G.error; (e.currentTarget as HTMLElement).style.borderColor = G.error; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = G.textMuted; (e.currentTarget as HTMLElement).style.borderColor = G.border; }}
          >
            TUTUP
          </button>
        </div>

        {/* ── Body (2 Kolom) ── */}
        <div style={{ display: 'flex', padding: '28px', gap: '32px' }}>
          
          {/* Kiri: Kredensial */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            

            <LoginInput
              label="USERNAME"
              value={username}
              onChange={v => setUsername(v.toUpperCase())}
              onEnter={handleSubmit}
              placeholder="Input Username..."
              error={!!error && (!username || username !== VALID_USERNAME)}
            />
            
            <LoginInput
              label="ID KARYAWAN"
              value={employeeId}
              onChange={setEmployeeId}
              onEnter={handleSubmit}
              placeholder="Input ID Karyawan..."
              type="password"
              error={!!error && (!employeeId || employeeId !== VALID_EMPLOYEE_ID)}
            />
          </div>

          {/* Kanan: Face Unlock */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 10, color: G.textMuted, fontFamily: 'Courier New', letterSpacing: 2, fontWeight: 700 }}>
              BIOMETRIC SCAN
            </div>

            <div style={{ display: 'flex', gap: 16, height: '100%' }}>
              {/* Drop Zone Kamera */}
              <div
                ref={zoneRef}
                style={{
                  flex: 1,
                  background: podFaceUnlocked ? '#061a08' : G.scanBg,
                  border: `2px solid ${podFaceUnlocked ? G.green : overZone || scanning ? G.borderBright : G.border}`,
                  borderRadius: 8,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 10,
                  position: 'relative', overflow: 'hidden',
                  transition: 'all 0.3s',
                  boxShadow: overZone || scanning || podFaceUnlocked ? `0 0 20px ${G.greenGlow}` : 'none',
                }}
              >
                {scanning && (
                  <div style={{
                    position: 'absolute', left: 0, right: 0, height: 2,
                    background: `linear-gradient(to right, transparent, ${G.green}, transparent)`,
                    boxShadow: `0 0 10px ${G.green}`,
                    animation: 'scanLine 1s linear infinite',
                  }} />
                )}

                {/* Brackets */}
                {['tl','tr','bl','br'].map(c => (
                  <div key={c} style={{
                    position: 'absolute',
                    top: c.startsWith('t') ? 10 : undefined, bottom: c.startsWith('b') ? 10 : undefined,
                    left: c.endsWith('l') ? 10 : undefined, right: c.endsWith('r') ? 10 : undefined,
                    width: 16, height: 16,
                    borderTop: c.startsWith('t') ? `2px solid ${G.border}` : 'none',
                    borderBottom: c.startsWith('b') ? `2px solid ${G.border}` : 'none',
                    borderLeft: c.endsWith('l') ? `2px solid ${G.border}` : 'none',
                    borderRight: c.endsWith('r') ? `2px solid ${G.border}` : 'none',
                  }} />
                ))}

                {podFaceUnlocked ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, animation: 'fadeIn 0.4s ease' }}>
                    <div style={{ fontSize: 36, color: G.green, textShadow: `0 0 16px ${G.green}` }}>✓</div>
                    <div style={{ fontSize: 10, color: G.green, fontFamily: 'Courier New', letterSpacing: 2, fontWeight: 700 }}>TERVERIFIKASI</div>
                  </div>
                ) : scanning ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 10, color: G.green, fontFamily: 'Courier New', letterSpacing: 2, animation: 'blink 0.8s step-start infinite' }}>
                      MEMINDAI WAJAH...
                    </div>
                    <div style={{ width: 120, height: 4, background: G.greenDim, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${scanPct}%`, background: G.green, transition: 'width 0.05s linear' }} />
                    </div>
                    <div style={{ fontSize: 10, color: G.green, fontFamily: 'Courier New' }}>{scanPct}%</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: overZone ? 1 : 0.5 }}>
                    <img
                      src="/objects/photocard.png"
                      alt="Photocard"
                      style={{ width: 48, height: 48, objectFit: 'contain', imageRendering: 'pixelated', filter: 'grayscale(1)' }}
                    />
                    <div style={{ fontSize: 9, color: G.textMuted, fontFamily: 'Courier New', letterSpacing: 1.5, textAlign: 'center', padding: '0 20px' }}>
                      {overZone ? 'LEPASKAN KARTU' : 'DRAG PHOTOCARD KE SINI'}
                    </div>
                  </div>
                )}
              </div>

              {/* Slot Inventory */}
              {!podFaceUnlocked && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                  <div style={{ fontSize: 9, color: G.textMuted, fontFamily: 'Courier New', letterSpacing: 1 }}>INV</div>
                  <div
                    onMouseDown={onMouseDownCard}
                    style={{
                      width: 60, height: 80,
                      background: hasCard ? '#061a08' : G.scanBg,
                      border: `2px dashed ${hasCard ? G.borderBright : G.border}`,
                      borderRadius: 6,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                      cursor: hasCard && !scanning ? 'grab' : 'default',
                      position: 'relative',
                      boxShadow: hasCard ? `0 0 12px ${G.greenGlow}` : 'none',
                    }}
                  >
                    {hasCard ? (
                      <>
                        <div style={{ fontSize: 24 }}><img src={photocard.image} alt={photocard.name} style={{ width: 40, height: 40, objectFit: 'contain', imageRendering: 'pixelated' }} /></div>
                        <div style={{ fontSize: 7, color: G.green, fontFamily: 'Courier New', textAlign: 'center' }}>Face Unlock</div>
                      </>
                    ) : (
                      <div style={{ fontSize: 10, color: G.textDim }}>✕</div>
                    )}
                  </div>
                  {!hasCard && <div style={{ fontSize: 8, color: G.error, fontFamily: 'Courier New', textAlign: 'center' }}>KOSONG</div>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer / Submit Area ── */}
        <div style={{ 
          padding: '0 28px 28px 28px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 16 
        }}>
          {error && (
            <div style={{
              padding: '10px 14px', background: 'rgba(248, 113, 113, 0.1)',
              border: `1px solid ${G.error}`, borderRadius: 6,
              fontSize: 11, color: G.error, fontFamily: 'Courier New', letterSpacing: 1,
              display: 'flex', alignItems: 'center', gap: 8, animation: 'fadeIn 0.2s ease',
            }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || scanning}
            style={{
              width: '100%',
              background: loading ? G.greenDim : G.green,
              border: 'none', borderRadius: 6,
              padding: '16px 0',
              fontFamily: 'Courier New', fontSize: 14,
              fontWeight: 700, letterSpacing: 4,
              color: loading ? '#86efac' : '#000',
              cursor: loading || scanning ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: loading ? 'none' : `0 0 20px ${G.greenGlow}`,
            }}
            onMouseEnter={e => { if (!loading && !scanning) (e.currentTarget as HTMLElement).style.boxShadow = `0 0 32px ${G.green}66`; }}
            onMouseLeave={e => { if (!loading && !scanning) (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${G.greenGlow}`; }}
          >
            {loading ? 'MENGOTENTIKASI...' : 'VERIFIKASI & AKSES SISTEM'}
          </button>
        </div>
      </div>

      {/* ── Dragging Ghost Card ── */}
      {dragging && (
        <div style={{
          position: 'fixed',
          left: dragPos.x, top: dragPos.y,
          width: 64, height: 80,
          background: '#061a08',
          border: `2px solid ${G.borderBright}`,
          borderRadius: 6,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
          pointerEvents: 'none', zIndex: 99999,
          boxShadow: `0 0 20px ${G.green}66`,
          transform: 'rotate(-5deg) scale(1.05)',
        }}>
          <div style={{ fontSize: 24 }}></div>
          <div style={{ fontSize: 7, color: G.green, fontFamily: 'Courier New', textAlign: 'center' }}>ID CARD</div>
        </div>
      )}

      {/* ── Global Styles ── */}
      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          15% { transform: translateX(-8px); } 35% { transform: translateX(8px); }
          55% { transform: translateX(-4px); } 75% { transform: translateX(4px); }
        }
        @keyframes scanLine {
          0% { top: 5%; opacity: 1; } 50% { top: 90%; opacity: 0.6; } 100% { top: 5%; opacity: 1; }
        }
      `}</style>
    </div>
  );
}