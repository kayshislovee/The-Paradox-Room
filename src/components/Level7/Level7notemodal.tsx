import { useGameStore } from '../../store/gameStore';

/**
 * Level7NoteModal — versi note modal khusus level 7.
 * Mendukung skill Multi Language Reader:
 * - Saat translationActive = false → tampilkan image asli (bahasa asing)
 * - Saat translationActive = true → tampilkan translatedImage (bahasa Inggris)
 */
export function Level7NoteModal() {
  const noteModal        = useGameStore((s) => s.noteModal);
  const closeNote        = useGameStore((s) => s.closeNote);
  const translationActive = useGameStore((s) => s.translationActive);
  const toggleTranslation = useGameStore((s) => s.toggleTranslation);

  if (!noteModal) return null;

  const hasTranslation = !!noteModal.translatedImage;
  const displayImage = hasTranslation && translationActive
    ? noteModal.translatedImage!
    : noteModal.image;

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
      }}
      onClick={closeNote}
    >
      <div
        style={{ position: 'relative', maxWidth: '80vw', maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gambar note */}
        <img
          src={displayImage}
          style={{
            maxWidth: '80vw', maxHeight: '75vh',
            objectFit: 'contain', borderRadius: 8,
            boxShadow: '0 8px 40px rgba(0,0,0,0.8)',
            transition: 'opacity 0.3s ease',
          }}
          alt="note"
        />

        {/* Badge bahasa */}
        {hasTranslation && (
          <div style={{
            position: 'absolute', top: 12, left: 12,
            padding: '4px 10px',
            background: translationActive ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.08)',
            border: `1px solid ${translationActive ? 'rgba(56,189,248,0.5)' : 'rgba(255,255,255,0.15)'}`,
            borderRadius: 6,
            fontFamily: 'Courier New', fontSize: 9,
            color: translationActive ? '#38bdf8' : 'rgba(255,255,255,0.4)',
            letterSpacing: 2,
          }}>
            {translationActive ? '🌐 TERJEMAHAN' : '📜 BAHASA ASLI'}
          </div>
        )}

        {/* Tombol skill translate (hanya kalau ada translatedImage) */}
        {hasTranslation && (
          <button
            onClick={toggleTranslation}
            style={{
              position: 'absolute', bottom: -48, left: '50%',
              transform: 'translateX(-50%)',
              padding: '8px 20px',
              background: translationActive ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${translationActive ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 8,
              color: translationActive ? '#38bdf8' : 'rgba(255,255,255,0.4)',
              fontFamily: 'Courier New', fontSize: 10, letterSpacing: 2,
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            🌐 {translationActive ? 'TAMPILKAN ASLI' : 'TERJEMAHKAN'}
          </button>
        )}

        {/* Tombol tutup */}
        <button
          onClick={closeNote}
          style={{
            position: 'absolute', top: 12, right: 12,
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.6)',
            fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}