import { useState, useEffect } from 'react';
import type { DialogLine } from '../../types/game.types';
import { resolveAssetPath } from '../../lib/assetPath';

interface Props {
  lines: DialogLine[];
  onDone: () => void;
  isOpen: boolean;
  position?: 'bottom' | 'left' | 'right';
}

export function SceneDialogOverlay({ lines, onDone, isOpen, position = 'bottom' }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [visible, setVisible] = useState(false);

  const currentLine = lines[currentIndex];
  const isLast = currentIndex >= lines.length - 1;

  // Reset when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setDisplayText('');
      setIsTyping(false);
      setVisible(false);
      setTimeout(() => setVisible(true), 100);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // Typing effect
  useEffect(() => {
    if (!isOpen) return;
    
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
  }, [currentIndex, isOpen]);

  const handleNext = () => {
    if (isTyping) {
      setDisplayText(currentLine.text);
      setIsTyping(false);
      return;
    }
    if (isLast) {
      onDone();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  // Avatar determination (resolusi path upload admin → /storage/...)
  const leftAvatar = resolveAssetPath(currentLine.avatarLeft ?? (currentLine.side === 'left' ? currentLine.avatar : undefined));
  const rightAvatar = resolveAssetPath(currentLine.avatarRight ?? (currentLine.side === 'right' ? currentLine.avatar : undefined));

  if (!isOpen || !visible) return null;

  const containerStyles: Record<string, React.CSSProperties> = {
    bottom: {
      position: 'fixed',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'clamp(300px, 70vw, 600px)',
      maxWidth: 'calc(100vw - 40px)',
      borderRadius: 16,
      zIndex: 9999,
    },
    left: {
      position: 'fixed',
      top: '50%',
      left: 20,
      transform: 'translateY(-50%)',
      width: 'clamp(280px, 35vw, 400px)',
      maxHeight: '70vh',
      borderRadius: 16,
      zIndex: 9999,
    },
    right: {
      position: 'fixed',
      top: '50%',
      right: 20,
      transform: 'translateY(-50%)',
      width: 'clamp(280px, 35vw, 400px)',
      maxHeight: '70vh',
      borderRadius: 16,
      zIndex: 9999,
    },
  };

  const characterColor = currentLine.side === 'left' ? '#38bdf8' : '#a78bfa';
  const characterName = currentLine.character;

  return (
    <div
      onClick={handleNext}
      style={{
        ...containerStyles[position],
        background: 'rgba(15, 12, 10, 0.97)',
        border: '1px solid rgba(180, 160, 130, 0.3)',
        borderRadius: 4,
        boxShadow: '0 8px 32px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(12px)',
        padding: '16px 20px',
        fontFamily: "'Georgia', serif",
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        animation: 'slideUp 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}
    >
      {/* Avatar kecil di atas namanya */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 8,
        borderBottom: '1px solid rgba(180, 160, 130, 0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 4,
            border: '1px solid rgba(180, 160, 130, 0.4)',
            background: leftAvatar ? `url(${leftAvatar}) center/cover` : rightAvatar ? `url(${rightAvatar}) center/cover` : 'rgba(0,0,0,0.5)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            flexShrink: 0,
          }} />
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#b8a88a',
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}>
            {characterName}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            // LANJUT = langsung lompat ke baris berikutnya / tutup, tanpa menyelesaikan ketikan
            if (isLast) {
              onDone();
            } else {
              setCurrentIndex((i) => i + 1);
            }
          }}
          style={{
            background: 'rgba(180, 160, 130, 0.1)',
            border: '1px solid rgba(180, 160, 130, 0.3)',
            borderRadius: 3,
            color: '#b8a88a',
            fontSize: 10,
            letterSpacing: 2,
            padding: '5px 14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: "'Georgia', serif",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(180, 160, 130, 0.2)';
            e.currentTarget.style.color = '#e8dcc8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(180, 160, 130, 0.1)';
            e.currentTarget.style.color = '#b8a88a';
          }}
        >
          {isTyping ? 'LANJUT' : isLast ? 'SELESAI' : 'LANJUT'}
        </button>
      </div>

      {/* Dialog text with typing effect */}
      <div style={{
        fontSize: 15,
        lineHeight: 1.7,
        color: '#e2e8f0',
        textShadow: '0 1px 4px rgba(0,0,0,0.5)',
        minHeight: 60,
      }}>
        {displayText}
        {isTyping && <span style={{ animation: 'blink 0.8s infinite' }}>▋</span>}
      </div>

      {/* Progress indicator */}
      {lines.length > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 6,
          marginTop: 8,
        }}>
          {lines.map((_, i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: i === currentIndex ? characterColor : 'rgba(255,255,255,0.2)',
                transition: 'all 0.3s ease',
                boxShadow: i === currentIndex ? `0 0 8px ${characterColor}` : 'none',
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}