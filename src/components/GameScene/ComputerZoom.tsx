import { useState, useEffect } from 'react';

interface Props {
  onClose: () => void;
}

const TERMINAL_LINES = [
  '> CONNECTION ESTABLISHED...',
  '> USER: DR.Subianto',

  '',
  
  '',
  '> LEVER 01: ONLINE',
  '> LEVER 02: *****',
  '> LEVER 03: ERROR',
  '> LEVER 04: ONLINE',
  '> LEVER 05: *****',
  '> LEVER 06: ERROR',
  '> LEVER 07: *****',
  '> LEVER 08: ONLINE',
  '',
  '> ERROR FOUND:10011001',
  '> CLUE: BOOLEAN PATTERN',
  
  
];

export function ComputerZoom({ onClose }: Props) {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (visibleLines >= TERMINAL_LINES.length) return;
    const delay = TERMINAL_LINES[visibleLines] === '' ? 80 : 120;
    const t = setTimeout(() => setVisibleLines((v) => v + 1), delay);
    return () => clearTimeout(t);
  }, [visibleLines]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
    >
      {/* Monitor bezel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1a1a1a',
          border: '6px solid #2d2d2d',
          borderRadius: 12,
          padding: 8,
          boxShadow: '0 0 60px rgba(0,255,0,0.15), 0 20px 60px rgba(0,0,0,0.8)',
          maxWidth: 560,
          width: '90%',
        }}
      >
        {/* Monitor top bar */}
        <div style={{
          background: '#111',
          borderRadius: '6px 6px 0 0',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 4,
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
          <span style={{ color: '#4b5563', fontSize: 11, marginLeft: 8, fontFamily: 'monospace' }}>
            terminal — RESEARCHER_07@LAB-SECURE
          </span>
        </div>

        {/* Screen */}
        <div style={{
          background: '#020c02',
          borderRadius: '0 0 4px 4px',
          padding: '16px 20px',
          minHeight: 340,
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: 13,
          lineHeight: 1.7,
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Scanline overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
            pointerEvents: 'none',
          }} />

          {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => {
            const isPattern = line.includes('1 0 0 1 1 0 0 1');
            const isSeparator = line.includes('████');
            const isImportant = line.includes('LEVER PATTERN CODE') || line.includes('1 = ON');

            return (
              <div key={i} style={{
                color: isPattern ? '#00ff88'
                  : isSeparator ? '#1a4a1a'
                  : isImportant ? '#ffdd00'
                  : line.startsWith('>') ? '#00cc44'
                  : '#005500',
                fontWeight: isPattern || isImportant ? 800 : 400,
                fontSize: isPattern ? 17 : 13,
                letterSpacing: isPattern ? 4 : 0,
                textShadow: isPattern ? '0 0 10px #00ff88' : undefined,
                minHeight: line === '' ? 10 : undefined,
              }}>
                {line}
              </div>
            );
          })}

          {/* Blinking cursor */}
          {visibleLines >= TERMINAL_LINES.length && (
            <span style={{
              display: 'inline-block',
              width: 8, height: 15,
              background: '#00cc44',
              animation: 'blink 1s step-end infinite',
              verticalAlign: 'middle',
            }} />
          )}
        </div>

        {/* Close instruction */}
        <div style={{
          textAlign: 'center', padding: '10px 0 4px',
          color: '#4b5563', fontSize: 12,
        }}>
          Klik di luar atau tekan tombol untuk menutup
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 20, right: 20,
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff', borderRadius: 8,
          padding: '8px 16px', cursor: 'pointer', fontSize: 14,
        }}
      >
        ✕ Tutup
      </button>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
