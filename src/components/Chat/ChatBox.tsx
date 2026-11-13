import { useState, useEffect, useRef } from 'react';
import { useChat } from '../../hooks/useChat';

interface Props {
  lobbyCode: string | null;
  isIngame?: boolean; // compact mode saat di dalam game
}

export function ChatBox({ lobbyCode, isIngame = false }: Props) {
  const { messages, sendMessage, currentUsername } = useChat(lobbyCode);
  const [input, setInput]     = useState('');
  const [open, setOpen]       = useState(!isIngame);
  const [unread, setUnread]   = useState(0);
  const bottomRef             = useRef<HTMLDivElement>(null);
  const prevLenRef            = useRef(0);

  // Auto scroll ke bawah
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (!open && messages.length > prevLenRef.current) {
      setUnread((u) => u + (messages.length - prevLenRef.current));
    }
    prevLenRef.current = messages.length;
  }, [messages, open]);

  // Reset unread saat buka
  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
  };

  if (!lobbyCode) return null;

  // ── Ingame: tombol toggle + floating box ─────────────────────────────────
  if (isIngame) {
    return (
      <div style={{ position: 'fixed', bottom: 80, right: 16, zIndex: 999 }}>
        {/* Toggle button */}
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 44, height: 44, borderRadius: '50%',
            background: '#121212',
            border: '1px solid #333333',
            color: '#eab308', fontSize: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
          }}
        >
          💬
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              background: '#881337', color: '#ffffff',
              fontSize: 10, fontWeight: 700,
              borderRadius: '50%', width: 18, height: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.6)',
            }}>{unread}</span>
          )}
        </button>

        {/* Chat box */}
        {open && (
          <div style={{
            position: 'absolute', bottom: 52, right: 0,
            width: 280, background: 'rgba(18, 18, 18, 0.95)',
            border: '1px solid #333333',
            borderRadius: 8, overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.9)',
          }}>
            <MessageList messages={messages} currentUsername={currentUsername ?? ''} bottomRef={bottomRef} compact />
            <ChatInput input={input} setInput={setInput} onSend={handleSend} />
          </div>
        )}
      </div>
    );
  }

  // ── Lobby: selalu tampil ─────────────────────────────────────────────────
  return (
    <div style={{
      background: 'rgba(18, 18, 18, 0.9)',
      border: '1px solid #333333',
      borderRadius: 8, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      height: 280,
    }}>
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid #262626',
        fontFamily: 'Courier New, monospace', fontSize: 11, fontWeight: 700,
        color: '#888888', letterSpacing: 2, background: '#0d0d0d',
      }}>
        LOBBY CHAT
      </div>
      <MessageList messages={messages} currentUsername={currentUsername ?? ''} bottomRef={bottomRef} />
      <ChatInput input={input} setInput={setInput} onSend={handleSend} />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MessageList({ messages, currentUsername, bottomRef, compact }: {
  messages: any[];
  currentUsername: string;
  bottomRef: React.RefObject<HTMLDivElement>;
  compact?: boolean;
}) {
  return (
    <div style={{
      flex: 1, overflowY: 'auto', padding: '8px 10px',
      display: 'flex', flexDirection: 'column', gap: 8,
      maxHeight: compact ? 200 : undefined,
    }}>
      {messages.length === 0 && (
        <div style={{ color: '#52525b', fontSize: 11, textAlign: 'center', marginTop: 16, fontFamily: 'monospace' }}>
          Belum ada pesan
        </div>
      )}
      {messages.map((m, i) => {
        const isSelf = m.username === currentUsername;
        return (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column',
            alignItems: isSelf ? 'flex-end' : 'flex-start',
          }}>
            {!isSelf && (
              <span style={{ 
                fontSize: 11, 
                fontWeight: 700, 
                color: '#eab308', 
                fontFamily: 'Courier New, monospace', 
                marginBottom: 2, 
                letterSpacing: 0.5 
              }}>
                {m.username}
              </span>
            )}
            <div style={{
              maxWidth: '85%', padding: '6px 10px',
              borderRadius: isSelf ? '8px 8px 2px 8px' : '8px 8px 8px 2px',
              background: isSelf ? '#27272a' : '#18181b',
              border: `1px solid ${isSelf ? '#3f3f46' : '#27272a'}`,
              color: '#f4f4f5', fontSize: 12, fontFamily: 'sans-serif', lineHeight: 1.4,
              wordBreak: 'break-word',
            }}>
              {m.message}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

function ChatInput({ input, setInput, onSend }: {
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
}) {
  return (
    <div style={{
      display: 'flex', gap: 6, padding: '8px 10px',
      borderTop: '1px solid #262626', background: '#0d0d0d',
    }}>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSend()}
        placeholder="Ketik pesan..."
        maxLength={200}
        style={{
          flex: 1, background: '#18181b',
          border: '1px solid #3f3f46',
          borderRadius: 6, padding: '6px 10px',
          color: '#f4f4f5', fontSize: 12, fontFamily: 'monospace',
          outline: 'none',
        }}
      />
      <button
        onClick={onSend}
        disabled={!input.trim()}
        style={{
          padding: '6px 12px', borderRadius: 6,
          background: input.trim() ? '#27272a' : '#141417',
          border: `1px solid ${input.trim() ? '#eab308' : '#27272a'}`,
          color: input.trim() ? '#eab308' : '#3f3f46',
          fontSize: 14, cursor: input.trim() ? 'pointer' : 'not-allowed',
        }}
      >
        ➤
      </button>
    </div>
  );
}