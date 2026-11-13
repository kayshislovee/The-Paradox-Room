import { useState, useEffect, useRef } from 'react';
import { echo } from '../echo';
import { useGameStore } from '../store/gameStore';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

export interface ChatMessage {
  username: string;
  message: string;
  sentAt: string;
}

export function useChat(lobbyCode: string | null) {
  const token  = useGameStore((s) => s.token);
  const player = useGameStore((s) => s.player);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const channelRef = useRef<any>(null);

useEffect(() => {
  if (!lobbyCode) return;

  // Hindari subscribe ulang jika sudah ada
  if (channelRef.current) return;

  const channel = echo.channel(`lobby.${lobbyCode}`);
  channelRef.current = channel;
  
  channel.listen('.chat.message.sent', (e: ChatMessage) => {
    setMessages((prev) => [...prev, e]);
  });

  return () => {
    channelRef.current = null;
  };
}, [lobbyCode]);

  const sendMessage = async (message: string) => {
    if (!lobbyCode || !token || !message.trim()) return;
    try {
      await fetch(`${API_BASE}/lobby/${lobbyCode}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: message.trim() }),
      });
    } catch {}
  };

  return { messages, sendMessage, currentUsername: player?.username };
}