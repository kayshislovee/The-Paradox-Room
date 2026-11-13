import { useState, useEffect } from 'react';

const NOTES_KEY = 'escape-room-notes';

function Notes() {
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(NOTES_KEY);
      if (v !== null) setText(v);
    } catch { /* ignore */ }
  }, []);

  const handleChange = (v: string) => {
    setText(v);
    try { localStorage.setItem(NOTES_KEY, v); } catch { /* ignore */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#fbbf24', fontSize: 11, fontFamily: 'monospace', letterSpacing: 2, fontWeight: 700 }}>
          📝 NOTES
        </span>
        <span style={{ color: '#52525b', fontSize: 9, fontFamily: 'monospace' }}>
          {saved ? '✓ tersimpan' : 'auto-save'}
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Tulis catatan di sini..."
        style={{
          flex: 1, minHeight: 120, resize: 'vertical',
          background: '#0d0d0d', border: '1px solid #27272a',
          borderRadius: 6, padding: 10,
          color: '#e4e4e7', fontSize: 12, fontFamily: 'monospace',
          lineHeight: 1.5, outline: 'none',
        }}
      />
      <button
        onClick={() => handleChange('')}
        style={{
          alignSelf: 'flex-end', padding: '4px 10px',
          background: 'transparent', border: '1px solid #3f3f46',
          borderRadius: 4, color: '#71717a', fontSize: 10,
          fontFamily: 'monospace', cursor: 'pointer',
        }}
      >
        Hapus
      </button>
    </div>
  );
}

function Calculator() {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [resetNext, setResetNext] = useState(false);
  // Ekspresi yang ditampilkan di atas hasil (mis. "12 + 3")
  const [expr, setExpr] = useState('');

  const press = (key: string) => {
    if (key === 'C') { setDisplay('0'); setPrev(null); setOp(null); setResetNext(false); setExpr(''); return; }
    if (key === 'DEL') { setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : '0')); return; }
    if (key === '=') {
      if (op && prev !== null) {
        const a = prev, b = parseFloat(display);
        let r = 0;
        if (op === '+') r = a + b;
        else if (op === '-') r = a - b;
        else if (op === '×') r = a * b;
        else if (op === '÷') r = b !== 0 ? a / b : 0;
        setExpr(`${a} ${op} ${b} =`);
        setDisplay(String(r));
        setPrev(null); setOp(null); setResetNext(true);
      }
      return;
    }
    if (['+', '-', '×', '÷'].includes(key)) {
      // Tampilkan ekspresi sejauh ini
      if (prev !== null && op) {
        setExpr(`${prev} ${op} ${display}`);
      } else {
        setExpr(`${display} ${key}`);
      }
      setPrev(parseFloat(display));
      setOp(key);
      setResetNext(true);
      return;
    }
    // digit / dot
    if (resetNext) {
      setDisplay(key === '.' ? '0.' : key);
      // lanjutkan ekspresi kalau operator sudah dipilih
      if (op && prev !== null) setExpr(`${prev} ${op} ${key === '.' ? '0.' : key}`);
      else setExpr(key === '.' ? '0.' : key);
      setResetNext(false);
      return;
    }
    if (key === '.') {
      if (display.includes('.')) return;
      setDisplay(display + '.');
      if (op && prev !== null) setExpr(`${prev} ${op} ${display + '.'}`);
      return;
    }
    const next = display === '0' ? key : display + key;
    setDisplay(next);
    if (op && prev !== null) setExpr(`${prev} ${op} ${next}`);
    else setExpr(next);
  };

  const mainKeys = ['7','8','9','÷','4','5','6','×','1','2','3','-','0','.','=','+'];

  const btnStyle = (k: string, wide = false): React.CSSProperties => ({
    padding: '10px 0',
    gridColumn: wide ? 'span 2' : undefined,
    background: ['+', '-', '×', '÷', '='].includes(k) ? '#27272a' : '#18181b',
    border: '1px solid #3f3f46',
    borderRadius: 6,
    color: k === '=' ? '#fbbf24' : k === 'C' ? '#ef4444' : k === 'DEL' ? '#f97316' : '#e4e4e7',
    fontSize: 14, fontWeight: 700,
    fontFamily: 'monospace', cursor: 'pointer',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ color: '#fbbf24', fontSize: 11, fontFamily: 'monospace', letterSpacing: 2, fontWeight: 700 }}>
        🧮 KALKULATOR
      </span>
      <div style={{
        background: '#0d0d0d', border: '1px solid #27272a',
        borderRadius: 6, padding: '8px 12px',
        fontFamily: 'monospace', textAlign: 'right',
        minHeight: 48, wordBreak: 'break-all',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}>
        <div style={{ color: '#71717a', fontSize: 11, minHeight: 14 }}>
          {expr}
        </div>
        <div style={{ color: '#34d399', fontSize: 18, fontWeight: 700 }}>
          {display}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {mainKeys.map((k) => (
          <button key={k} onClick={() => press(k)} style={btnStyle(k)}>
            {k}
          </button>
        ))}
        <button onClick={() => press('C')} style={btnStyle('C', true)}>C</button>
        <button onClick={() => press('DEL')} style={btnStyle('DEL', true)}>DEL</button>
      </div>
    </div>
  );
}

export function ToolsPanel() {
  const [sub, setSub] = useState<'notes' | 'calc'>('notes');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => setSub('notes')}
          style={{
            flex: 1, padding: '6px 0', borderRadius: 4,
            background: sub === 'notes' ? '#27272a' : 'transparent',
            border: `1px solid ${sub === 'notes' ? '#fbbf24' : '#3f3f46'}`,
            color: sub === 'notes' ? '#fbbf24' : '#71717a',
            fontSize: 10, fontFamily: 'monospace', cursor: 'pointer', letterSpacing: 1,
          }}
        >NOTES</button>
        <button
          onClick={() => setSub('calc')}
          style={{
            flex: 1, padding: '6px 0', borderRadius: 4,
            background: sub === 'calc' ? '#27272a' : 'transparent',
            border: `1px solid ${sub === 'calc' ? '#fbbf24' : '#3f3f46'}`,
            color: sub === 'calc' ? '#fbbf24' : '#71717a',
            fontSize: 10, fontFamily: 'monospace', cursor: 'pointer', letterSpacing: 1,
          }}
        >KALKULATOR</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sub === 'notes' ? <Notes /> : <Calculator />}
      </div>
    </div>
  );
}