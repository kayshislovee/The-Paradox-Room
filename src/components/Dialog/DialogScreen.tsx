import { useState, useEffect } from 'react';
import type { DialogLine } from '../../types/game.types';
import { useMusic } from '../../hooks/useMusic';
import { resolveAssetPath } from '../../lib/assetPath';

interface Props {
  lines: DialogLine[];
  background?: string;
  music?: string;
  onDone: () => void;
}

export function DialogScreen({ lines, background, music, onDone }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  useMusic(music ?? '');

  const currentLine = lines[currentIndex];
  const isLast = currentIndex >= lines.length - 1;

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  useEffect(() => {
    setDisplayText('');
    setIsTyping(true);

    let i = 0;
    const text = currentLine.text;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [currentIndex]);

  // Maju ke baris berikutnya (atau tutup dialog bila baris terakhir)
  const advanceLine = () => {
    if (isLast) {
      setFadeOut(true);
      setTimeout(onDone, 600);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  // Klik di mana pun: kalau masih mengetik → langsung tampilkan teks penuh;
  // kalau teks sudah penuh → lanjut ke baris berikutnya.
  const handleNext = () => {
    if (isTyping) {
      setDisplayText(currentLine.text);
      setIsTyping(false);
      return;
    }
    advanceLine();
  };

  const handleSkip = () => {
    setFadeOut(true);
    setTimeout(onDone, 600);
  };

  // Tentukan avatar yang ditampilkan (resolusi path upload admin → /storage/...)
  const leftAvatar = resolveAssetPath(currentLine.avatarLeft ?? (currentLine.side === 'left' ? currentLine.avatar : undefined));
  const rightAvatar = resolveAssetPath(currentLine.avatarRight ?? (currentLine.side === 'right' ? currentLine.avatar : undefined));

  return (
    <div
      onClick={handleNext}
      style={{
        position: 'fixed', inset: 0,
        zIndex: 9999,
        cursor: 'pointer',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.6s ease',
        fontFamily: "'Georgia', serif",
      }}
    >
      {/* Background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: background
          ? `url(${background}) center/cover no-repeat`
          : 'linear-gradient(160deg, #0f0c20, #1a1530)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.45)',
      }} />

      {/* Tombol skip */}
      <button
        onClick={(e) => { e.stopPropagation(); handleSkip(); }}
        style={{
          position: 'absolute', top: 20, right: 20,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 6, color: 'rgba(255,255,255,0.5)',
          fontSize: 11, letterSpacing: 3,
          padding: '6px 14px', cursor: 'pointer',
          fontFamily: "'Georgia', serif",
          transition: 'all 0.2s',
          zIndex: 1,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#fff';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
        }}
      >
        SKIP ▶▶
      </button>

      {/* Progress dots */}
      <div style={{
        position: 'absolute', top: 20, left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', gap: 6, zIndex: 1,
      }}>
        {lines.map((_, i) => (
          <div key={i} style={{
            width: i === currentIndex ? 20 : 6,
            height: 6, borderRadius: 3,
            background: i <= currentIndex ? '#c8b89a' : 'rgba(255,255,255,0.2)',
            transition: 'all 0.3s',
          }} />
        ))}
      </div>

      {/* Avatar kiri */}
      {leftAvatar && (
        <div 
          key={leftAvatar}
          style={{
            position: 'absolute',
            bottom: currentLine.avatarLeftStyle?.
              bottom ?? -55,   // ← pakai dari line
            left: currentLine.avatarLeftStyle?.left ?? -40,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.4s ease',
            zIndex: 1,
            // Redup kalau bukan yang bicara
            filter: currentLine.side === 'right' && currentLine.avatarLeft
              ? 'brightness(0.5)'
              : 'brightness(1)',
          }}
        >
          <img
            src={leftAvatar}
            alt="avatar kiri"
            style={{
              height: currentLine.avatarLeftStyle?.height ?? 750,
              objectFit: 'contain',
              filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.8))',
              transition: 'filter 0.3s',
            }}
          />
        </div>
      )}

      {/* Avatar kanan */}
      {rightAvatar && (
        <div 
          key={rightAvatar}
          style={{
            position: 'absolute',
            bottom: currentLine.avatarRightStyle?.bottom ?? -300,  // ← pakai dari line
            right: currentLine.avatarRightStyle?.right ?? 30,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.4s ease',
            zIndex: 1,
            // Redup kalau bukan yang bicara
           
          }}
        >
          <img
            src={rightAvatar}
            alt="avatar kanan"
            style={{
              height: currentLine.avatarRightStyle?.height ?? 1000,
              objectFit: 'contain',
              filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.8))',
              transition: 'filter 0.3s',
            }}
          />
        </div>
      )}

      {/* Dialog box */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        zIndex: 2,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}>
        {/* Nama karakter */}
        <div style={{
          display: 'flex',
          justifyContent: currentLine.side === 'right' ? 'flex-end' : 'flex-start',
          paddingLeft: currentLine.side === 'right' ? 0 : 280,
          paddingRight: currentLine.side === 'right' ? 280 : 0,
        }}>
          <div style={{
            background: currentLine.isSystem
              ? 'linear-gradient(135deg, #000000ff, #175d09ff)'
              : 'linear-gradient(135deg, #c8b89a, #a09070)',
            padding: '6px 20px',
            borderRadius: currentLine.side === 'right'
              ? '6px 6px 0 6px'
              : '6px 6px 6px 0',
            fontSize: 13, fontWeight: 700,
            color: currentLine.isSystem ? '#38f84eff' : '#000000ff',
            letterSpacing: currentLine.isSystem ? 4 : 2,
            textTransform: 'uppercase',
            fontFamily: currentLine.isSystem ? 'monospace' : "'Georgia', serif",
            border: currentLine.isSystem ? '1px solid #3f8b1fff' : 'none',
          }}>
            {currentLine.character}
          </div>
        </div>

        {/* Teks dialog */}
        <div style={{
          background: currentLine.isSystem
            ? 'rgba(5,15,30,0.95)'
            : 'rgba(10,8,20,0.92)',
          borderTop: `2px solid ${currentLine.isSystem ? '#21d721ff' : '#c8b89a'}`,
          padding: '20px 40px 32px',
          minHeight: 100,
          backdropFilter: 'blur(8px)',
          position: 'relative',
          boxShadow: currentLine.isSystem
            ? 'inset 0 0 40px rgba(32, 223, 22, 0.05)'
            : 'none',
        }}>
          {currentLine.isSystem && (
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(26, 215, 32, 0.38) 3px, rgba(66, 205, 31, 0.02) 4px)',
              pointerEvents: 'none',
            }} />
          )}

          <p style={{
            color: currentLine.isSystem ? '#7dfca3ff' : '#e8d5b7',
            fontSize: currentLine.isSystem ? 15 : 18,
            lineHeight: 1.7,
            margin: 0,
            letterSpacing: currentLine.isSystem ? 1.5 : 0.5,
            textAlign: 'left',
            fontFamily: currentLine.isSystem ? '"Courier New", monospace' : 'inherit',
            textShadow: currentLine.isSystem ? '0 0 8px rgba(78, 248, 56, 0.77)' : 'none',
          }}>
            {displayText}
            {isTyping && (
              <span style={{
                display: 'inline-block',
                width: 2, height: 18,
                background: currentLine.isSystem ? '#62f838ff' : '#c8b89a',
                marginLeft: 2,
                verticalAlign: 'middle',
                animation: 'blink 0.7s infinite',
              }} />
            )}
          </p>

          {/* Tombol LANJUT — langsung lompat ke baris berikutnya (bisa saat masih mengetik) */}
          <button
            onClick={(e) => { e.stopPropagation(); advanceLine(); }}
            style={{
              position: 'absolute',
              bottom: 16, right: 40,
              background: 'transparent',
              border: 'none',
              color: currentLine.isSystem ? '#38f84eff' : '#c8b89a',
              fontSize: 12, letterSpacing: 2,
              animation: 'bounce 1s ease-in-out infinite',
              fontFamily: currentLine.isSystem ? 'monospace' : 'inherit',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            {isLast ? 'MULAI ▶' : 'LANJUT ▶'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
           @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  
      `}</style>
    </div>
  );
}