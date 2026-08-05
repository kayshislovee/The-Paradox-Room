import { useGameStore } from '../../store/gameStore';
import type { Treasure } from '../../types/game.types';
import { useSFX } from '../../hooks/useSFX';

interface Props {
  treasures: Treasure[];
}

export function TreasureLayer({ treasures }: Props) {
  const foundTreasures = useGameStore((s) => s.foundTreasures);
  const findTreasure = useGameStore((s) => s.findTreasure);
  const sfx = useSFX();

  return (
    <>
      {treasures.map((t) => {
        const isFound = foundTreasures.includes(t.id);
        if (isFound) return null; // sembunyikan setelah ditemukan

        return (
          <button
            key={t.id}
            onClick={() => {
              sfx.playSuccess();
              findTreasure(t.id);
            }}
            style={{
              position: 'absolute',
              left: `${t.x}%`,
              top: `${t.y}%`,
              width: `${t.width}%`,
              height: `${t.height}%`,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              zIndex: 5,
              padding: 0,
            }}
            title="???"
          >
            {t.image && (
              <img
                src={t.image}
                alt="treasure"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  // Tidak ada animasi glow — berbeda dari hotspot biasa
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))',
                }}
                draggable={false}
              />
            )}
          </button>
        );
      })}
    </>
  );
}