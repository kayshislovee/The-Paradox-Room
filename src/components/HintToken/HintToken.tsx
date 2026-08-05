import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';

const MAX_TOKENS = 5;
const REFILL_MS = 60 * 1000;

interface Props {
  compact?: boolean; // true = HUD ingame, false = menu utama
}

export function HintToken({ compact }: Props) {
  const hintTokens = useGameStore((s) => s.hintTokens);
  const lastHintRefill = useGameStore((s) => s.lastHintRefill);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (hintTokens >= MAX_TOKENS) { setCountdown(0); return; }

    const update = () => {
      const elapsed = Date.now() - lastHintRefill;
      const remaining = Math.max(0, REFILL_MS - elapsed);
      setCountdown(remaining);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [hintTokens, lastHintRefill]);

  const seconds = Math.ceil(countdown / 1000);

  if (compact) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '3px 10px',
        background: 'rgba(251,191,36,0.06)',
        border: '1px solid rgba(251,191,36,0.2)',
        borderRadius: 20,
      }}>
        {/* Token dots */}
        <div style={{ display: 'flex', gap: 3 }}>
          {Array.from({ length: MAX_TOKENS }).map((_, i) => (
            <div key={i} style={{
              width: 7, height: 7, borderRadius: '50%',
              background: i < hintTokens ? '#fbbf24' : '#2a2a2a',
              border: `1px solid ${i < hintTokens ? '#fbbf24' : '#444'}`,
              boxShadow: i < hintTokens ? '0 0 4px rgba(251,191,36,0.6)' : 'none',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        {/* Countdown */}
        {hintTokens < MAX_TOKENS && countdown > 0 && (
          <span style={{
            color: '#78716c', fontSize: 9,
            fontFamily: 'monospace', letterSpacing: 1,
          }}>
            +{seconds}s
          </span>
        )}
      </div>
    );
  }

  // Full version untuk menu utama
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 10,
      padding: '16px 24px',
      background: 'rgba(251,191,36,0.05)',
      border: '1px solid rgba(251,191,36,0.2)',
      borderRadius: 12,
      fontFamily: "'Georgia', serif",
    }}>
      <div style={{
        color: '#8a7a6a', fontSize: 9,
        letterSpacing: 4, textTransform: 'uppercase',
      }}>
        💡 Hint Tokens
      </div>

      {/* Token visual */}
      <div style={{ display: 'flex', gap: 8 }}>
        {Array.from({ length: MAX_TOKENS }).map((_, i) => (
          <div key={i} style={{
            width: 28, height: 28, borderRadius: '50%',
            background: i < hintTokens
              ? 'radial-gradient(circle at 35% 35%, #fde68a, #f59e0b)'
              : '#1a1a1a',
            border: `2px solid ${i < hintTokens ? '#fbbf24' : '#333'}`,
            boxShadow: i < hintTokens
              ? '0 0 10px rgba(251,191,36,0.5)'
              : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12,
            transition: 'all 0.3s',
          }}>
            {i < hintTokens ? '💡' : ''}
          </div>
        ))}
      </div>

      {/* Info */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#c8b89a', fontSize: 13 }}>
          {hintTokens} / {MAX_TOKENS} token tersisa
        </div>
        {hintTokens < MAX_TOKENS && countdown > 0 && (
          <div style={{
            color: '#78716c', fontSize: 11,
            fontFamily: 'monospace', marginTop: 4,
          }}>
            Isi ulang dalam {seconds} detik
          </div>
        )}
        {hintTokens >= MAX_TOKENS && (
          <div style={{ color: '#10b981', fontSize: 11, marginTop: 4 }}>
            Token penuh!
          </div>
        )}
      </div>
    </div>
  );
}