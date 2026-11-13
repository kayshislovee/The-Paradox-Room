import { useGameStore } from '../../store/gameStore';
import type { CharacterId } from '../../types/game.types';

interface CharacterOption {
  id: CharacterId;
  name: string;
  avatar: string;
  skillName: string;
  skillDescription: string;
  skillIcon: string;
}

const CHARACTER_OPTIONS: CharacterOption[] = [
  {
    id: 'char3',
    name: 'Katsuragi',
    avatar: '/avatars/katsuragi2.png',
    skillName: 'HACKING',
    skillDescription: 'Menggunakan Hacking Device+ untuk memperbaiki reactor',
    skillIcon: '💻',
  },
  {
    id: 'char1',
    name: 'Ethan',
    avatar: '/avatars/zkayshi6.png',
    skillName: 'TRANSLATE',
    skillDescription: 'Menerjemahkan teks asing menjadi bahasa Inggris',
    skillIcon: '🌐',
  },
  {
    id: 'char2',
    name: 'Vania',
    avatar: '/avatars/perpus4.png',
    skillName: 'TRANSLATE',
    skillDescription: 'Menerjemahkan teks asing menjadi bahasa Inggris',
    skillIcon: '🌐',
  },
];

interface Props {
  onSelect: (char: CharacterId) => void;
  onClose: () => void;
}

export function CharacterSelectModal({ onSelect, onClose }: Props) {
  const releasedCharacter = useGameStore((s) => s.releasedCharacter);
  // Pilihan karakter scene 5 milik tiap pemain (playerId -> character).
  // Dipakai untuk menonaktifkan karakter yang sudah dipakai pemain lain.
  const scene5Choices = useGameStore((s) => s.scene5Choices);
  const myPlayerId = useGameStore((s) => s.player?.id);

  // Hanya dua pilihan: Katsuragi (selalu tersedia, badannya di dalam pod)
  // dan orang yang barusan dibebaskan. Orang lain tidak bisa "dipakai" di
  // scene 5 karena consciousness-nya masih terkunci di pod.
  const options: CharacterOption[] = [];
  options.push(CHARACTER_OPTIONS.find((c) => c.id === 'char3')!);

  if (releasedCharacter) {
    const released = CHARACTER_OPTIONS.find((c) => c.id === releasedCharacter);
    if (released) options.push(released);
  } else {
    // Fallback bila karakter pembebasan belum diketahui: tampilkan keduanya.
    for (const id of ['char1', 'char2'] as const) {
      const opt = CHARACTER_OPTIONS.find((c) => c.id === id);
      if (opt) options.push(opt);
    }
  }

  // Karakter yang sudah dipilih pemain lain pada scene 5 (kecuali pilihan
  // sendiri) tidak boleh dipilih lagi — dua orang tidak bisa jadi karakter
  // yang sama.
  const takenByOthers = new Set(
    Object.entries(scene5Choices ?? {})
      .filter(([playerId]) => String(playerId) !== String(myPlayerId))
      .map(([, character]) => character),
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.82)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1c1f26',
          border: '1px solid #2a2e3a',
          borderRadius: 8,
          padding: '28px 32px',
          maxWidth: 520,
          width: '90%',
          boxShadow: '0 24px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04)',
          animation: 'charSelectAppear 0.2s cubic-bezier(0.2,1,0.4,1)',
          userSelect: 'none',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            fontFamily: '"Courier New", monospace',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 3,
            color: '#55596a',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            Pilih Karakter
          </div>
          <div style={{
            fontFamily: '"Courier New", monospace',
            fontSize: 18,
            fontWeight: 700,
            color: '#e2e8f0',
            letterSpacing: 1,
          }}>
            Siapa yang akan masuk ke Reactor?
          </div>
        </div>

        {/* Character options */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {options.map((char) => {
            const isReleased = releasedCharacter === char.id;
            const isTaken = takenByOthers.has(char.id);
            return (
            <button
              key={char.id}
              onClick={() => { if (!isTaken) onSelect(char.id); }}
              disabled={isTaken}
              style={{
                flex: 1,
                minWidth: 170,
                maxWidth: 200,
                background: isTaken ? '#0f1116' : '#14171e',
                border: `2px solid ${isTaken ? '#3a3f4d' : isReleased ? '#34d399' : '#2a2e3a'}`,
                borderRadius: 8,
                padding: '20px 16px',
                cursor: isTaken ? 'not-allowed' : 'pointer',
                opacity: isTaken ? 0.45 : 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                transition: 'all 0.15s ease',
                fontFamily: '"Courier New", monospace',
              }}
              onMouseEnter={(e) => {
                if (isTaken) return;
                e.currentTarget.style.borderColor = '#4f6ef7';
                e.currentTarget.style.background = '#1a1d25';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(79,110,247,0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isTaken ? '#3a3f4d' : isReleased ? '#34d399' : '#2a2e3a';
                e.currentTarget.style.background = isTaken ? '#0f1116' : '#14171e';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {isTaken ? (
                <div style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  color: '#94a3b8',
                  background: 'rgba(148,163,184,0.12)',
                  border: '1px solid rgba(148,163,184,0.3)',
                  borderRadius: 4,
                  padding: '3px 8px',
                }}>
                  SUDAH DIPILIH PEMAIN LAIN
                </div>
              ) : isReleased ? (
                <div style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  color: '#34d399',
                  background: 'rgba(52,211,153,0.12)',
                  border: '1px solid rgba(52,211,153,0.35)',
                  borderRadius: 4,
                  padding: '3px 8px',
                }}>
                  BARU DIBEBASKAN
                </div>
              ) : null}
              {/* Avatar */}
              <div style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '3px solid #4f6ef7',
                boxShadow: '0 0 16px rgba(79,110,247,0.4)',
                flexShrink: 0,
              }}>
                <img
                  src={char.avatar}
                  alt={char.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  draggable={false}
                />
              </div>

              {/* Name */}
              <div style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#e2e8f0',
                letterSpacing: 1,
              }}>
                {char.name}
              </div>

              {/* Skill */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                background: 'rgba(79,110,247,0.12)',
                border: '1px solid rgba(79,110,247,0.3)',
                borderRadius: 4,
              }}>
                <span style={{ fontSize: 14 }}>{char.skillIcon}</span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  color: '#7b8099',
                  textTransform: 'uppercase',
                }}>
                  {char.skillName}
                </span>
              </div>

              {/* Skill description */}
              <div style={{
                fontSize: 11,
                color: '#55596a',
                textAlign: 'center',
                lineHeight: 1.5,
                maxWidth: 160,
              }}>
                {char.skillDescription}
              </div>
            </button>
            );
          })}
        </div>

        {/* Footer hint */}
        <div style={{
          marginTop: 20,
          textAlign: 'center',
          fontSize: 10,
          color: '#3a3d4a',
          fontFamily: '"Courier New", monospace',
          letterSpacing: 1,
        }}>
          Pilih karakter untuk melanjutkan ke reactor
        </div>
      </div>

      <style>{`
        @keyframes charSelectAppear {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
