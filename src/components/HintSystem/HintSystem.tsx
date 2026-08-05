import { useGameStore } from '../../store/gameStore';

export function HintSystem() {
  const { hintsRemaining, useHint } = useGameStore();

  const handleHint = () => {
    if (hintsRemaining <= 0) return;
    useHint();
  };

  return (
    <button
      onClick={handleHint}
      disabled={hintsRemaining <= 0}
      style={{
        padding: '4px 12px',
        background: hintsRemaining <= 0 ? 'rgba(255,255,255,0.02)' : 'rgba(251,191,36,0.08)',
        border: `1px solid ${hintsRemaining <= 0 ? 'rgba(255,255,255,0.05)' : 'rgba(251,191,36,0.3)'}`,
        borderRadius: 4,
        color: hintsRemaining <= 0 ? '#334155' : '#fbbf24',
        fontSize: '0.8rem',
        fontFamily: "'Georgia', serif",
        letterSpacing: 2,
        cursor: hintsRemaining <= 0 ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
      }}
    >
      💡 HINT ({hintsRemaining})
    </button>
  );
}