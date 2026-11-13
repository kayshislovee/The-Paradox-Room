import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onSolve: (releasedChar: 'char1' | 'char2') => void;  // ← ubah signature
  onClose: () => void;
  correctCode?: string;
}

// ─── Konstanta puzzle ─────────────────────────────────────────────────────────
const TARGET_AMP  = 0.68;
const TARGET_FREQ = 3.20;
const TOL_AMP     = 0.10;
const TOL_FREQ    = 0.25;

const COLOR_A = '#ec4899'; // Pink (Vania)
const COLOR_B = '#3b82f6'; // Biru (Kayshi)

const FONT_MONO = "'JetBrains Mono', 'Courier New', Courier, monospace";
const FONT_SANS = "'Inter', system-ui, -apple-system, sans-serif";

// ─── Types ────────────────────────────────────────────────────────────────────
type ReleasePhase =
  | 'idle'
  | 'confirm'
  | 'executing'
  | 'done';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function mapRange(v: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  return outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin);
}
function angleToAmp(angle: number): number {
  return mapRange((angle + 150) / 300, 0, 1, 0.05, 1.0);
}
function angleToFreq(angle: number): number {
  return mapRange((angle + 150) / 300, 0, 1, 0.5, 5.0);
}
function calcSyncPct(amp: number, freq: number): number {
  const dA    = Math.abs(amp  - TARGET_AMP)  / (TARGET_AMP  + 0.05);
  const dF    = Math.abs(freq - TARGET_FREQ) / (TARGET_FREQ + 0.5);
  const rough = (Math.max(0, 1 - dA) * 0.5 + Math.max(0, 1 - dF) * 0.5) * 100;
  const bonus = Math.abs(amp - TARGET_AMP) <= TOL_AMP && Math.abs(freq - TARGET_FREQ) <= TOL_FREQ ? 100 : 0;
  return Math.min(100, Math.round(rough * 0.4 + bonus * 0.6));
}

// ─── WaveCanvas ───────────────────────────────────────────────────────────────
interface WaveCanvasProps {
  playerAmp: number; playerFreq: number;
  refAmp: number; refFreq: number;
  color: string; refColor: string;
  tick: number; phaseScale: number;
  snapped: boolean;
}

function WaveCanvas({ playerAmp, playerFreq, refAmp, refFreq, color, refColor, tick, phaseScale, snapped }: WaveCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#02060b';
    ctx.fillRect(0, 0, W, H);
    const mid = H / 2;

    const draw = (ampN: number, freqN: number, phase: number, clr: string, alpha: number) => {
      const a = ampN * H * 0.40, f = freqN;
      ctx.beginPath();
      ctx.moveTo(0, mid);
      for (let x = 0; x <= W; x++) {
        ctx.lineTo(x, mid + Math.sin((x / W) * Math.PI * 2 * f + phase) * a);
      }
      ctx.strokeStyle = clr;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = alpha;
      ctx.shadowBlur = alpha > 0.5 ? 8 : 0;
      ctx.shadowColor = clr;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    };

    const pAmp   = snapped ? refAmp  : playerAmp;
    const pFreq  = snapped ? refFreq : playerFreq;
    const rPhase = tick * phaseScale * 0.5;
    const pPhase = snapped ? rPhase  : tick * phaseScale;

    draw(refAmp, refFreq, rPhase, refColor, snapped ? 0 : 0.4);
    draw(pAmp, pFreq, pPhase, color, 1.0);
  }, [playerAmp, playerFreq, refAmp, refFreq, color, refColor, tick, phaseScale, snapped]);

  return (
    <canvas ref={ref} width={320} height={70} // Tinggi canvas dikurangi sedikit (dari 80 ke 70)
      style={{ display: 'block', width: '100%', height: 70, borderRadius: 6 }} />
  );
}

// ─── DialKnob ─────────────────────────────────────────────────────────────────
function DialKnob({ angle, color, label, onAngle }: {
  angle: number; color: string; label: string; onAngle: (a: number) => void;
}) {
  return (
    <div style={{ display: 'flex', width: '100%', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width: 60, height: 60, borderRadius: '50%',
          background: '#121824', border: `3px solid ${color}`,
          boxShadow: `0 4px 0 #000, 0 6px 12px rgba(0,0,0,0.6), inset 0 3px 6px #2c3445`,
          userSelect: 'none', pointerEvents: 'none',
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: `rotate(${angle}deg)`,
          transition: 'transform 0.12s ease-out, box-shadow 0.2s',
        }}
      >
        <div style={{
          position: 'absolute', top: 4, left: '50%',
          transform: 'translateX(-50%)',
          width: 6, height: 14, borderRadius: 3,
          background: color, boxShadow: `0 0 8px ${color}`,
        }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, border: '2px solid #000' }} />
      </div>
      <div style={{ fontSize: 11, letterSpacing: 1.5, color, fontWeight: 700, fontFamily: FONT_MONO, textAlign: 'center' }}>
        {label}
      </div>
      <input
        type="range"
        min={-150}
        max={150}
        step={1}
        value={angle}
        aria-label={`${label} control`}
        onChange={e => onAngle(Number(e.target.value))}
        style={{
          width: '100%', accentColor: color, cursor: 'pointer',
          height: 6, marginTop: 2,
        }}
      />
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 9, fontFamily: FONT_MONO }}>
        <span>−150</span>
        <span>{angle}°</span>
        <span>+150</span>
      </div>
    </div>
  );
}

// ─── BrainVisual ──────────────────────────────────────────────────────────────
function BrainVisual({ syncPct }: { syncPct: number }) {
  const is100       = syncPct === 100;
  const hemiColor   = is100 ? '#003a26' : '#222833';
  const hemiStroke  = is100 ? '#34d399' : '#6b7280';
  const foldColor   = is100 ? '#34d399' : '#505066';
  const foldPaths   = [
    'M40 40 Q35 50 40 60', 'M30 55 Q28 65 35 75', 'M50 30 Q48 40 52 50',
    'M100 40 Q105 50 100 60', 'M110 55 Q112 65 105 75', 'M90 30 Q92 40 88 50',
  ];
  return (
    <svg viewBox="0 0 140 120" style={{ width: 150, height: 130 }}>
      <ellipse cx="70" cy="55" rx="60" ry="50" fill={is100 ? '#34d39922' : 'none'} />
      <path d="M70 20 C50 15,30 20,20 35 C10 50,15 68,25 80 C35 90,55 95,68 90 L70 85 Z"
        fill={hemiColor} stroke={hemiStroke} strokeWidth={2} strokeLinejoin="round" />
      <path d="M70 20 C90 15,110 20,120 35 C130 50,125 68,115 80 C105 90,85 95,72 90 L70 85 Z"
        fill={hemiColor} stroke={hemiStroke} strokeWidth={2} strokeLinejoin="round" />
      <line x1="70" y1="20" x2="70" y2="85" stroke="#5a5a6e" strokeWidth={2} strokeDasharray="3 3" />
      {foldPaths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={foldColor} strokeWidth={2} strokeLinecap="round" />
      ))}
      <circle cx="45" cy="50" r="3" fill={COLOR_A} />
      <circle cx="95" cy="50" r="3" fill={COLOR_B} />
      <text x="70" y="112" textAnchor="middle" fontFamily={FONT_SANS} fontSize={12} fontWeight="bold"
          fill={is100 ? '#34d399' : '#94a3b8'} letterSpacing={1.5}>
          {is100 ? 'SYNCED' : syncPct > 55 ? 'ALIGNING...' : 'INACTIVE'}
        </text>
    </svg>
  );
}

// ─── ConfirmDialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ target, targetColor, onConfirm, onCancel }: {
  target: string; targetColor: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div style={{
      width: '100%',
      background: '#0d1520',
      border: `2px solid ${targetColor}`,
      borderRadius: 8,
      padding: '16px',
      display: 'flex', flexDirection: 'column', gap: 12,
      fontFamily: FONT_MONO,
      animation: 'fadeSlideIn 0.22s ease',
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', letterSpacing: 1.5 }}>
        CONFIRM RELEASE?
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'inline-flex' }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 1, padding: '4px 10px',
            background: `${targetColor}22`, border: `1px solid ${targetColor}66`,
            borderRadius: 6, color: targetColor, fontFamily: FONT_SANS,
          }}>
            SUBJECT: {target.toUpperCase()}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', letterSpacing: 1, fontFamily: FONT_SANS }}>
          ⚠ WARNING:
        </div>
        <div style={{
          fontSize: 12, color: '#cbd5e1', letterSpacing: 0.5, lineHeight: 1.5,
          background: 'rgba(255,255,255,0.03)', border: '1px solid #1e293b',
          borderRadius: 6, padding: '10px', fontFamily: FONT_SANS,
        }}>
          You can only free one person. Are you sure you want to free <strong>{target}</strong>?
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          onClick={onConfirm}
          style={{
            flex: 1, padding: '10px 0',
            background: `${targetColor}22`, border: `1.5px solid ${targetColor}`,
            borderRadius: 6, color: targetColor,
            fontFamily: FONT_SANS, fontSize: 12, fontWeight: 700, letterSpacing: 1,
            cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = `${targetColor}44`)}
          onMouseLeave={e => (e.currentTarget.style.background = `${targetColor}22`)}
        >
          [ CONFIRM ]
        </button>
        <button
          onClick={onCancel}
          style={{
            flex: 1, padding: '10px 0',
            background: 'rgba(255,255,255,0.03)', border: '1.5px solid #475569',
            borderRadius: 6, color: '#94a3b8',
            fontFamily: FONT_SANS, fontSize: 12, fontWeight: 700, letterSpacing: 1,
            cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.color = '#f8fafc';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          [ CANCEL ]
        </button>
      </div>
    </div>
  );
}

// ─── TransferProgress ─────────────────────────────────────────────────────────
function TransferProgress({ name, nameColor, podCode: _podCode, onComplete, autoComplete = true }: {
  name: string; nameColor: string; podCode: string; onComplete: () => void;
  /**
   * false = hanya menampilkan hasil (state di-restore), tidak menjalankan
   * animasi transfer lagi (dan tidak memicu onSolve untuk kedua kali).
   */
  autoComplete?: boolean;
}) {
  const [progress, setProgress] = useState(0);
  const [done,     setDone]     = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Restore state (pod sudah dibebaskan sebelumnya): tampilkan hasilnya saja,
    // jangan jalankan animasi transfer lagi (dan jangan memicu onSolve dua kali).
    if (!autoComplete) {
      setProgress(100);
      setDone(true);
      return;
    }

    let p = 0;
    const iv = setInterval(() => {
      p += 2 + Math.random() * 3;
      if (p >= 100) {
        p = 100;
        setDone(true);
        clearInterval(iv);
        onCompleteRef.current();
      }
      setProgress(Math.round(p));
    }, 40);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{
      width: '100%',
      background: '#0d1520', border: '2px solid #1e293b',
      borderRadius: 8, padding: '16px',
      display: 'flex', flexDirection: 'column', gap: 12,
      fontFamily: FONT_MONO,
      animation: 'fadeSlideIn 0.22s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc', letterSpacing: 1.5, fontFamily: FONT_SANS }}>
          RELEASE PROTOCOL
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: '3px 8px',
          background: done ? '#16a34a22' : '#0f4c7522',
          border: `1px solid ${done ? '#16a34a' : '#0ea5e9'}`,
          borderRadius: 4, color: done ? '#34d399' : '#38bdf8',
          fontFamily: FONT_SANS,
        }}>
           {done ? 'COMPLETE' : 'EXECUTING'}
        </span>
      </div>

      <div style={{
        background: '#060d18', border: '1px solid #1e293b',
        borderRadius: 8, padding: '12px', display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, letterSpacing: 1.5, color: nameColor, fontWeight: 700 }}>
            TRANSFERRING {name.toUpperCase()}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 8, background: '#1e293b', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4, width: `${progress}%`,
                background: done ? '#34d399' : nameColor, transition: 'width 0.08s linear',
              }} />
            </div>
            <span style={{ fontSize: 11, color: done ? '#34d399' : '#f8fafc', fontWeight: 700, minWidth: 36 }}>
              {progress}%
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 10, letterSpacing: 1, color: progress >= 40 ? '#34d399' : '#64748b' }}>
            NEURAL LINK → {progress >= 40 ? 'DISCONNECTED' : 'DISCONNECTING...'}
          </span>
          <span style={{ fontSize: 10, letterSpacing: 1, color: progress >= 80 ? '#34d399' : '#64748b' }}>
            {name.toUpperCase()} → {progress >= 80 ? 'OPEN' : 'UNLOCKING...'}
          </span>
        </div>

        <div style={{ borderTop: '1px solid #1e293b', paddingTop: 8 }}>
          <span style={{ fontSize: 11, letterSpacing: 1, color: '#94a3b8', fontFamily: FONT_SANS, fontWeight: 600 }}>TRANSFER SLOT</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <div style={{ width: 60, height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3, width: done ? '100%' : '0%',
                background: '#ef4444', transition: 'width 0.4s ease',
              }} />
            </div>
            <span style={{ fontSize: 10, color: done ? '#ef4444' : '#64748b', fontWeight: 700, letterSpacing: 1, fontFamily: FONT_SANS }}>
              {done ? '1 / 1 — CONSUMED' : '0 / 1'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CenterPanel ──────────────────────────────────────────────────────────────
function CenterPanel({ amp, freq, onRelease, onSolve, initialPhase, initialTarget }: {
  amp: number; freq: number;
  onRelease: (pod: 'A' | 'B') => void;
  onSolve: (releasedChar: 'char1' | 'char2') => void;   // ← tambah parameter
  initialPhase?: ReleasePhase;
  initialTarget?: 'A' | 'B' | null;
}) {
  
  const [phase, setPhase] = useState<ReleasePhase>(initialPhase ?? 'idle');
  const [target, setTarget] = useState<'A' | 'B' | null>(initialTarget ?? null);
  const syncPct   = calcSyncPct(amp, freq);
  const is100     = syncPct === 100;
  const tick      = useRef(0);
  const [, fu]    = useState(0);
  const rafRef    = useRef<number>();

  

  const targetName  = target === 'A' ? 'Vania'  : 'ETHAN';
  const targetColor = target === 'A' ? COLOR_A  : COLOR_B;
  const targetCode  = target === 'A' ? '01'     : '02';
  const lockedName  = target === 'A' ? 'ETHAN' : 'Vania';
  const lockedColor = target === 'A' ? COLOR_B  : COLOR_A;
  useEffect(() => {
    const animate = () => { tick.current += 0.024; fu(n => n + 1); rafRef.current = requestAnimationFrame(animate); };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current!);
  }, []);

  const handlePick = (pod: 'A' | 'B') => {
    if (!is100 || phase !== 'idle') return;
    setTarget(pod);
    setPhase('confirm');
  };

  const handleConfirm = () => {
    setPhase('executing');
  };

  const handleCancel = () => {
    setPhase('idle');
    setTarget(null);
  };

  return (
    <div style={{
      width: 340, height: 540, boxSizing: 'border-box', flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
      background: '#0b111a', border: '2px solid #1e293b',
      borderRadius: 12, padding: '16px 20px', overflowY: 'auto',
    }}>
      <div style={{ fontSize: 13, letterSpacing: 2, color: '#cbd5e1', fontFamily: FONT_SANS, fontWeight: 700 }}>
        SYNC STATUS
      </div>

      <BrainVisual syncPct={syncPct} />

      <div style={{
        fontSize: 14, letterSpacing: 1.5, textAlign: 'center', fontFamily: FONT_MONO,
        color: is100 ? '#34d399' : '#64748b', fontWeight: 'bold', lineHeight: 1.4
      }}>
        {is100 ? 'NEURAL SYNC\nACHIEVED' : 'AWAITING\nSYNC'}
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ width: '100%', height: 10, background: '#1e293b', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${syncPct}%`,
            background: is100 ? '#34d399' : `linear-gradient(to right, ${COLOR_A}, ${COLOR_B})`,
            transition: 'width 0.2s ease-out',
          }} />
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, fontFamily: FONT_MONO, color: is100 ? '#34d399' : '#f8fafc', textAlign: 'center' }}>
          {syncPct}%
        </div>
      </div>

      <div style={{ width: '100%', borderTop: '2px solid #1e293b', paddingTop: 16, marginTop: 4 }}>
        {phase === 'idle' && (
          <>
            {is100 && (
              <div style={{
                marginBottom: 16, padding: '10px', background: 'rgba(52,211,153,0.08)',
                border: '1px solid rgba(52,211,153,0.3)', borderRadius: 8,
                display: 'flex', flexDirection: 'column', gap: 4, animation: 'fadeSlideIn 0.25s ease',
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1.5, fontFamily: FONT_SANS }}>
                  TRANSFER CHANNEL
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: 1, padding: '3px 8px',
                  background: 'rgba(52,211,153,0.15)', border: '1px solid #34d39988',
                  borderRadius: 4, color: '#34d399', fontFamily: FONT_MONO,
                  display: 'inline-block', width: 'fit-content',
                }}>
                  1 SLOT AVAILABLE
                </span>
                <span style={{ fontSize: 10, color: '#f59e0b', letterSpacing: 0.5, fontFamily: FONT_SANS, marginTop: 4, lineHeight: 1.4 }}>
                  ⚠ ONE-TIME TRANSFER — ONLY ONE SUBJECT CAN BE RELEASED
                </span>
              </div>
            )}

            <div style={{ fontSize: 11, letterSpacing: 1.5, textAlign: 'center', color: '#94a3b8', fontFamily: FONT_SANS, fontWeight: 600, marginBottom: 12 }}>
              RELEASE PROTOCOL
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', gap: 10, width: '100%' }}>
              {(['A', 'B'] as const).map(pod => {
                const nm  = pod === 'A' ? 'VANIA'  : 'ETHAN';
                const clr = pod === 'A' ? COLOR_A  : COLOR_B;
                return (
                  <ReleaseBtn
                    key={pod} label={nm} color={clr} unlocked={is100}
                    onClick={() => handlePick(pod)}
                  />
                );
              })}
            </div>
          </>
        )}

        {phase === 'confirm' && target && (
          <ConfirmDialog
            target={targetName} targetColor={targetColor}
            onConfirm={handleConfirm} onCancel={handleCancel}
          />
        )}

        {(phase === 'executing' || phase === 'done') && target && (
          <>
            <TransferProgress
              autoComplete={initialPhase !== 'done'}
              name={targetName}
              nameColor={targetColor}
              podCode={targetCode}
              onComplete={() => {
                const releasedChar = target === 'A' ? 'char2' : 'char1';
                setPhase('done');
                onRelease(target);
                useGameStore.getState().setReleasedCharacter(releasedChar);
                onSolve(releasedChar);
              }}
            />
            <div style={{ marginTop: 12 }}>
              <LockedBtn label={lockedName} color={lockedColor} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── ReleaseBtn ───────────────────────────────────────────────────────────────
function ReleaseBtn({ label, color, unlocked, onClick }: {
  label: string; color: string; unlocked: boolean; onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={unlocked ? onClick : undefined}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, padding: '12px 6px', borderRadius: 6,
        fontFamily: FONT_SANS, fontSize: 12, fontWeight: 700, letterSpacing: 1,
        cursor: unlocked ? 'pointer' : 'not-allowed',
        border: `2px solid ${unlocked ? color : '#334155'}`,
        background: unlocked && hov ? color : unlocked ? '#111824' : '#0a0f16',
        color: unlocked && hov ? '#fff' : unlocked ? color : '#64748b',
        transition: 'all 0.2s ease', textTransform: 'uppercase',
      }}
    >
      {label}
    </button>
  );
}

// ─── LockedBtn ────────────────────────────────────────────────────────────────
function LockedBtn({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
      <div style={{
        width: '100%', padding: '10px 6px', borderRadius: 6,
        fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, letterSpacing: 1,
        border: `2px solid ${color}44`,
        background: '#0a0f16', color: `${color}88`,
        textAlign: 'center', textTransform: 'uppercase',
      }}>
        {label.toUpperCase()} — LOCKED
      </div>
      <span style={{ fontSize: 10, letterSpacing: 1, color: '#ef4444', fontFamily: FONT_SANS, fontWeight: 700 }}>
        TRANSFER SLOT CONSUMED
      </span>
    </div>
  );
}

// ─── PodPanel ─────────────────────────────────────────────────────────────────
interface PodPanelProps {
  imgSrc: string; name: string; code: string; color: string;
  dialAngle: number; onDialAngle: (a: number) => void;
  dialLabel: string; screenLabel: string;
  playerAmp: number; playerFreq: number;
  refAmp: number; refFreq: number; refColor: string;
  tick: number; phaseScale: number; snapped: boolean;
}

function PodPanel({
  imgSrc, name, code, color, dialAngle, onDialAngle, dialLabel, screenLabel,
  playerAmp, playerFreq, refAmp, refFreq, refColor, tick, phaseScale, snapped,
}: PodPanelProps) {
  return (
    <div style={{
      flex: '1 1 0', minWidth: 0, height: 540, boxSizing: 'border-box',
      border: `2px solid ${color}`, borderRadius: 12,
      padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12,
      background: '#0b111a', position: 'relative', zIndex: 2,
    }}>
      <div style={{ fontSize: 14, letterSpacing: 3, fontWeight: 700, fontFamily: FONT_SANS, textAlign: 'center', color }}>
        POD-{code}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <img src={imgSrc} alt={name} draggable={false}
          style={{ height: 120, objectFit: 'contain', display: 'block' }} /> {/* Ukuran tinggi dikurangi */}
      </div>
      <div style={{ background: '#040910', border: '2px solid #1a2a3a', borderRadius: 8, padding: '12px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ border: `2px solid ${color}`, borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
          <WaveCanvas
            playerAmp={playerAmp} playerFreq={playerFreq} refAmp={refAmp} refFreq={refFreq}
            color={color} refColor={refColor} tick={tick} phaseScale={phaseScale} snapped={snapped}
          />
          <div style={{ position: 'absolute', top: 6, right: 8, fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5, color, fontFamily: FONT_MONO }}>
            {screenLabel}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 4 }}>
          <DialKnob angle={dialAngle} color={color} label={dialLabel} onAngle={onDialAngle} />
        </div>
      </div>
      <div style={{ textAlign: 'center', fontSize: 16, fontFamily: FONT_SANS, color, letterSpacing: 4, fontWeight: 'bold', borderTop: `2px solid ${color}44`, paddingTop: 14 }}>
        {name.toUpperCase()}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function PodControlPuzzle({ onSolve, onClose }: Props) {
  // Di PodControlPuzzle main component, sebelu
const storedReleased = useGameStore((s) => s.releasedCharacter);
const initialTarget = storedReleased === 'char2' ? 'A' : storedReleased === 'char1' ? 'B' : null;
const initialPhase: ReleasePhase = storedReleased ? 'done' : 'idle';
  const [angleA,   setAngleA]   = useState(-90);
  const [angleB,   setAngleB]   = useState(-90);
const [released, setReleased] = useState<null | { pod: 'A' | 'B'; name: string; color: string }>(
  // Restore state dari store jika sudah pernah release
  storedReleased === 'char2'
    ? { pod: 'A', name: 'VANIA', color: COLOR_A }
    : storedReleased === 'char1'
      ? { pod: 'B', name: 'Ethan', color: COLOR_B }
      : null
);
  const tick   = useRef(0);
  const rafRef = useRef<number>();
  const releaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, fu] = useState(0);
// Di PodControlPuzzle, setelah deklarasi state:
// PENTING: JANGAN auto-trigger onSolve di sini.
// Dulu ada efek "kalau releasedCharacter terisi -> langsung onSolve", dan itu
// membuat pod terlihat solved tanpa pernah mencocokkan frekuensi/amplitude.
// Pod hanya bisa solved lewat tombol konfirmasi di CenterPanel.
  useEffect(() => {
    const animate = () => { tick.current += 0.022; fu(n => n + 1); rafRef.current = requestAnimationFrame(animate); };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafRef.current!);
      if (releaseTimerRef.current) clearTimeout(releaseTimerRef.current);
    };
  }, []);

  const ampVal  = angleToAmp(angleA);
  const freqVal = angleToFreq(angleB);
  const is100   = calcSyncPct(ampVal, freqVal) === 100;

  const [syncLocked, setSyncLocked] = useState(false);
  useEffect(() => {
    if (is100 && !syncLocked) setSyncLocked(true);
  }, [is100, syncLocked]);

// SESUDAH:
// handleRelease — cukup set local state saja
const handleRelease = useCallback((pod: 'A' | 'B') => {
  const info = pod === 'A'
    ? { pod, name: 'VANIA',  color: COLOR_A }
    : { pod, name: 'Ethan', color: COLOR_B };
  setReleased(info);
  // ✅ Hapus setReleasedCharacter dari sini
}, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(2, 4, 8, 0.9)', backdropFilter: 'blur(4px)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', boxSizing: 'border-box' // Ditambahkan padding pelindung viewport
    }}>
      <div style={{
        width: 1024, maxWidth: '100%', maxHeight: '95vh', overflowY: 'auto', // Scrollable safegaurd!
        background: '#060a12', border: '2px solid #334155',
        borderRadius: 16, padding: '24px 32px 30px', // Spasi disusutkan sedikit
        display: 'flex', flexDirection: 'column', gap: 20, // Gap container disusutkan
        boxShadow: '0 0 80px rgba(0,0,0,0.8), inset 0 0 40px rgba(0,0,0,0.5)', position: 'relative',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #1e293b', paddingBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
            <span style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 700, letterSpacing: 3, color: '#f8fafc' }}>
                SUBJECT CONTROL SYSTEM
            </span>
          </div>
          {/* Sembunyikan CLOSE saat release sudah terjadi — user harus menunggu auto-close */}
          {!released && (
            <button onClick={onClose} style={{
              background: '#1e293b', border: 'none', borderRadius: 6, color: '#cbd5e1',
              fontSize: 13, padding: '8px 14px', cursor: 'pointer', fontFamily: FONT_MONO, fontWeight: 600,
              transition: 'background 0.2s', flexShrink: 0
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#334155'}
            onMouseLeave={e => e.currentTarget.style.background = '#1e293b'}
            >
              CLOSE [X]
            </button>
          )}
        </div>

        {/* Neural Lines */}
        <div style={{ position: 'absolute', top: 120, left: 0, width: '100%', height: '300px', zIndex: 1, pointerEvents: 'none' }}>
          <svg width="100%" height="100%">
            <path d="M 220 180 L 512 180" stroke={COLOR_A} strokeWidth="4" strokeDasharray="8 6" opacity="0.6"/>
            <circle cx="220" cy="180" r="8" fill={COLOR_A} />
            <path d="M 800 180 L 512 180" stroke={COLOR_B} strokeWidth="4" strokeDasharray="8 6" opacity="0.6"/>
            <circle cx="800" cy="180" r="8" fill={COLOR_B} />
          </svg>
        </div>

        {/* 3 Columns */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', height: 540, position: 'relative', zIndex: 2 }}>
          <PodPanel
            imgSrc="/avatars/anatomi1.png" name="Vania" code="01" color={COLOR_A}
            dialAngle={angleA} onDialAngle={syncLocked ? () => {} : setAngleA} dialLabel="AMPLITUDE" screenLabel="AMP"
            playerAmp={ampVal} playerFreq={TARGET_FREQ} refAmp={TARGET_AMP} refFreq={TARGET_FREQ} refColor={COLOR_B}
            tick={tick.current} phaseScale={1} snapped={is100}
          />

<CenterPanel
  amp={ampVal}
  freq={freqVal}
  onRelease={handleRelease}
  onSolve={onSolve}
  initialPhase={initialPhase}
  initialTarget={initialTarget}
/>
          <PodPanel
            imgSrc="/avatars/anatomi2.png" name="Ethan" code="02" color={COLOR_B}
            dialAngle={angleB} onDialAngle={syncLocked ? () => {} : setAngleB} dialLabel="FREQUENCY" screenLabel="FREQ"
            playerAmp={TARGET_AMP} playerFreq={freqVal} refAmp={TARGET_AMP} refFreq={TARGET_FREQ} refColor={COLOR_A}
            tick={tick.current} phaseScale={0.82} snapped={is100}
          />
        </div>

        {/* Final overlay after done */}
        {released && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(2, 4, 8, 0.95)', zIndex: 10, borderRadius: 16,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
            animation: 'fadeSlideIn 0.35s ease', backdropFilter: 'blur(8px)'
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: FONT_MONO, letterSpacing: 4, color: released.color, textShadow: `0 0 16px ${released.color}` }}>
              [ {released.name} DIBEBASKAN ]
            </div>
            <div style={{ fontSize: 14, letterSpacing: 3, fontFamily: FONT_MONO, color: '#cbd5e1' }}>
              POD-{released.pod === 'A' ? '01' : '02'} ONLINE · SYNC COMPLETE
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}