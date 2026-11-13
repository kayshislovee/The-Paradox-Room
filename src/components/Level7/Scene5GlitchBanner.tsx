interface Props {
  glitchActive: boolean;
  fakeInfoActive: boolean;
}

/**
 * Banner notifikasi gangguan di scene 5 (Code Master Core).
 * Ditampilkan di atas layer scene, background = bg scene 5.
 * Dua pesan: glitch (saat reaktor glitch) dan fake info (saat info palsu muncul).
 */
export function Scene5GlitchBanner({ glitchActive, fakeInfoActive }: Props) {
  const message = glitchActive
    ? 'HAHAHAHA. Menyerahlah kalian, aku sudah membuat mesin ini mengalami gangguan'
    : fakeInfoActive
      ? 'Heii, aku harap kalian lebih sering menggunakan hacking device+'
      : null;

  if (!message) return null;

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      zIndex: 50,
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 16px',
      background: 'linear-gradient(180deg, rgba(20,0,0,0.85), rgba(0,0,0,0.6))',
      borderBottom: '1px solid rgba(239,68,68,0.4)',
      backdropFilter: 'blur(4px)',
    }}>
      <img
        src="/avatars/villain1.png"
        alt="Code Master"
        style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #ef4444' }}
      />
      <div style={{
        flex: 1, color: '#fca5a5', fontSize: 12,
        fontFamily: "'Georgia', serif", lineHeight: 1.4,
        textShadow: '0 1px 4px rgba(0,0,0,0.8)',
      }}>
        <span style={{ fontWeight: 700, color: '#ef4444', marginRight: 6 }}>Code Master:</span>
        {message}
      </div>
    </div>
  );
}