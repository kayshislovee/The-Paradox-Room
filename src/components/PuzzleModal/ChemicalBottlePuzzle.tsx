import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';

const COLORS = ['biru', 'kuning', 'pink', 'merah', 'hijau', 'ungu', 'putih', 'orange'];
const COLOR_MAP: Record<string, string> = {
  biru: '#2980b9', kuning: '#f1c40f', pink: '#e91e8c',
  merah: '#e74c3c', hijau: '#27ae60', ungu: '#8e44ad',
  putih: '#ecf0f1', orange: '#e67e22',
};
const ANSWER = ['biru', 'kuning', 'biru', 'pink'];

interface Props {
  onSolve: () => void;
  onClose: () => void;
  onInputChange?: (input: string[]) => void;
  sharedInput?: string[];
  sharedBy?: string;
}

export function ChemicalBottlePuzzle({ onSolve, onClose, onInputChange, sharedInput, sharedBy }: Props) {
  const setPuzzleInputState = useGameStore((s) => s.setPuzzleInputState);
  const savedState = useGameStore((s) => s.puzzleInputStates['puzzle_chemical_bottles']);
  const [bottles, setBottles] = useState<string[]>(savedState ?? ['putih', 'putih', 'putih', 'putih']);
  const [selectedBottle, setSelectedBottle] = useState<number | null>(0); // Default memilih botol pertama
  const [solved, setSolved] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (sharedInput && Array.isArray(sharedInput) && sharedInput.length === 4) setBottles(sharedInput);
  }, [sharedInput]);

  const handleSelectColor = (color: string) => {
    if (solved || selectedBottle === null) return;
    setBottles((prev) => {
      const next = [...prev];
      next[selectedBottle] = color;
      onInputChange?.(next);
      setPuzzleInputState('puzzle_chemical_bottles', next);
      return next;
    });
  };

  const handleSubmit = () => {
    const correct = ANSWER.every((c, i) => bottles[i] === c);
    if (correct) { setSolved(true); setTimeout(onSolve, 1000); }
    else { setShake(true); setTimeout(() => setShake(false), 600); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Georgia', serif" }}>
      <div style={{ background: 'linear-gradient(160deg, #0a0a1a, #1a1a2e)', border: '2px solid rgba(0,200,255,0.3)', borderRadius: 16, padding: '28px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, boxShadow: '0 0 40px rgba(0,200,255,0.15)', animation: shake ? 'shake 0.5s ease' : 'none', maxWidth: 680, width: '100%' }}>
        <style>{`
          @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-8px)}80%{transform:translateX(8px)}}
          @keyframes bubble{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
        `}</style>
        
        {/* Header Judul */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#00c8ff', fontSize: 11, letterSpacing: 4, marginBottom: 4 }}>LABORATORIUM KIMIA</div>
          <div style={{ color: '#e8d5b7', fontSize: 20, fontWeight: 700, letterSpacing: 2 }}>Rak Tabung Reaksi Eksperimen</div>
          <div style={{ color: '#6a6a8a', fontSize: 11, marginTop: 4, fontFamily: 'sans-serif' }}>Pilih botol di rak, lalu pilih warna di sidebar kiri untuk mengisi cairan</div>
        </div>

        {sharedBy && (
          <div style={{ padding: '6px 16px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.35)', borderRadius: 7, fontFamily: 'monospace', fontSize: 11, color: '#a78bfa', letterSpacing: 2, textAlign: 'center', width: '100%' }}>
            ✏ {sharedBy} sedang mengubah botol...
          </div>
        )}

        {/* Konten Utama: Sidebar Kiri + Rak Tabung Reaksi */}
        <div style={{ display: 'flex', gap: 28, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
          
          {/* Sidebar: Palet Warna */}
          <div style={{ background: 'rgba(15,15,30,0.85)', border: '1px solid rgba(0,200,255,0.25)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 8, width: 170 }}>
            <div style={{ color: '#00c8ff', fontSize: 10, letterSpacing: 2, textAlign: 'center', marginBottom: 4, fontFamily: 'sans-serif', fontWeight: 'bold' }}>PALET WARNA</div>
            {COLORS.map((col) => (
              <button
                key={col}
                onClick={() => handleSelectColor(col)}
                disabled={solved || selectedBottle === null}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 10px',
                  background: selectedBottle === null ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)',
                  border: `1px solid ${COLOR_MAP[col]}`,
                  borderRadius: 6,
                  cursor: selectedBottle === null ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: selectedBottle === null ? 0.5 : 1
                }}
              >
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: COLOR_MAP[col], boxShadow: `0 0 6px ${COLOR_MAP[col]}` }} />
                <span style={{ color: '#e8d5b7', fontSize: 11, fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: 1 }}>{col}</span>
              </button>
            ))}
          </div>

          {/* Rak Tabung Reaksi Kayu dengan Tabung di dalamnya */}
          <div style={{ position: 'relative', background: 'linear-gradient(135deg, #3d2314, #26150a)', border: '3px solid #5c3a21', borderRadius: 14, padding: '30px 24px 20px 24px', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            {/* Bilah kayu penyangga atas */}
            
            {/* Deretan Tabung Reaksi */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', zIndex: 2, position: 'relative' }}>
              {bottles.map((color, idx) => {
                const isSelected = selectedBottle === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => { if (!solved) setSelectedBottle(idx); }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      transform: isSelected ? 'translateY(-6px)' : 'translateY(0)',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    {/* Visual Tabung */}
                    <div style={{ position: 'relative', width: 44, height: 130 }}>
                      
                      {/* Indikator pilihan */}
                      {isSelected && (
                        <div style={{ position: 'absolute', inset: -4, border: '2px dashed #00c8ff', borderRadius: '22px 22px 24px 24px', pointerEvents: 'none' }} />
                      )}

                      {/* Sumbat Tabung (Kabus/Cork) */}
                     
                      {/* Badan Tabung Kaca */}
                      <div style={{ position: 'absolute', top: 10, left: 0, width: 44, height: 115, background: 'linear-gradient(90deg, rgba(200,230,255,0.05), rgba(255,255,255,0.15) 50%, rgba(150,200,255,0.05))', border: '2px solid rgba(180,220,255,0.5)', borderTop: 'none', borderRadius: '0 0 22px 22px', overflow: 'hidden' }}>
                        
                        {/* Cairan di dalam tabung */}
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80%', background: COLOR_MAP[color], opacity: 0.9, transition: 'background 0.3s ease', animation: 'bubble 2s ease-in-out infinite', boxShadow: `inset 0 0 10px rgba(0,0,0,0.3)` }}>
                          {/* Permukaan Cairan (Meniskus) */}
                          <div style={{ position: 'absolute', top: -3, left: 0, right: 0, height: 6, background: 'rgba(255,255,255,0.4)', borderRadius: '50%' }} />
                        </div>

                        {/* Refleksi kilau kaca */}
                        <div style={{ position: 'absolute', top: 12, left: 4, width: 5, height: 70, background: 'rgba(255,255,255,0.25)', borderRadius: 3, pointerEvents: 'none' }} />
                      </div>

                      {/* Label Nomor Tabung */}
                      <div style={{ position: 'absolute', bottom: -28, left: '50%', transform: 'translateX(-50%)', color: isSelected ? '#00c8ff' : '#a0a0c0', fontSize: 11, fontFamily: 'sans-serif', fontWeight: isSelected ? 'bold' : 'normal' }}>
                        #{idx + 1}
                      </div>
                    </div>

                    {/* Nama Warna di bawah */}
                    <div style={{ marginTop: 24, color: COLOR_MAP[color], fontSize: 10, letterSpacing: 1, fontFamily: 'sans-serif', textShadow: `0 0 8px ${COLOR_MAP[color]}` }}>
                      {color.toUpperCase()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Platform Dasar Kayu */}
           
          </div>

        </div>

        {selectedBottle !== null && (
          <div style={{ color: '#00c8ff', fontSize: 11, fontFamily: 'sans-serif', letterSpacing: 1 }}>
            Tabung terpilih: <strong style={{ color: '#fff' }}>#{selectedBottle + 1}</strong> (Pilih warna dari palet di sebelah kiri)
          </div>
        )}

        {solved && <div style={{ color: '#00ff88', fontSize: 14, letterSpacing: 2, marginTop: 4 }}>✓ KOMBINASI BENAR!</div>}

        {/* Tombol Aksi */}
        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
          <button onClick={handleSubmit} disabled={solved} style={{ padding: '10px 28px', background: 'linear-gradient(135deg, #00c8ff22, #00c8ff44)', border: '1px solid #00c8ff', borderRadius: 8, color: '#00c8ff', cursor: 'pointer', fontSize: 12, letterSpacing: 3, fontFamily: "'Georgia', serif" }}>KONFIRMASI</button>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid rgba(200,184,154,0.3)', borderRadius: 8, color: '#6a6a8a', cursor: 'pointer', fontSize: 12, letterSpacing: 2, fontFamily: "'Georgia', serif" }}>TUTUP</button>
        </div>
      </div>
    </div>
  );
}