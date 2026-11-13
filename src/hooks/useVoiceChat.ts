import { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import { echo } from '../echo';
import { useGameStore } from '../store/gameStore';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

export function useVoiceChat(lobbyCode: string | null) {
  const token = useGameStore((s) => s.token);
  const player = useGameStore((s) => s.player);
  
  const [isMuted, setIsMuted] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const peerRef = useRef<Peer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioEls = useRef<HTMLAudioElement[]>([]);

  const username = player?.username ?? '';
  const setVoiceActive = useGameStore((s) => s.setVoiceActive);
  const setStopVoiceCallback = useGameStore((s) => (s as any).setStopVoiceCallback);

  // Mainkan audio dari pemain lain
  const playRemoteAudio = (stream: MediaStream) => {
    const audio = new Audio();
    audio.srcObject = stream;
    audio.autoplay = true;
    document.body.appendChild(audio);
    audioEls.current.push(audio);
  };

  const startVoice = async () => {
    if (!lobbyCode || peerRef.current) return;
    try {
      // 1. Dapatkan stream mikrofon TERLEBIH DAHULU sebelum digunakan
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Mulai dalam keadaan muted
      stream.getAudioTracks().forEach(t => t.enabled = false);
      setIsActive(true);
      setVoiceActive(true);

      // 2. Detect suara — Ditaruh SETELAH stream berhasil didapatkan
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const detect = () => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setIsSpeaking(avg > 10); // threshold suara
        animFrameRef.current = requestAnimationFrame(detect);
      };
      detect();

      // 3. Setup koneksi PeerJS
      const peerId = `${lobbyCode}-${username}`.replace(/[^a-zA-Z0-9-]/g, '-');
      const peer = new Peer(peerId, {
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ]
        }
      });
      peerRef.current = peer;

      // Terima panggilan masuk dari player lain
      peer.on('call', (call) => {
        call.answer(stream);
        call.on('stream', playRemoteAudio);
      });

      peer.on('open', () => {
        // Broadcast ke lobby bahwa kita siap
        fetch(`${API_BASE}/lobby/${lobbyCode}/signal`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ signal: { type: 'ready', peerId }, to: null }),
        });
      });

      peer.on('error', (err) => console.error('[PeerJS]', err));
    } catch (err) {
      console.error('Gagal akses mikrofon:', err);
    }
  };

  // Listen sinyal dari player lain yang join voice
  useEffect(() => {
    if (!lobbyCode) return;

    const channel = echo.channel(`lobby.${lobbyCode}`);
    channel.listen('.webrtc.signal', (e: any) => {
      if (e.from === username) return;
      if (e.signal?.type !== 'ready') return;
      if (!peerRef.current || !streamRef.current) return;

      // Panggil peer yang baru join
      const call = peerRef.current.call(e.signal.peerId, streamRef.current);
      call?.on('stream', playRemoteAudio);
    });

    return () => {};
  }, [lobbyCode, username]);

  const toggleMute = () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
  };

  const stopVoice = () => {
    // Hentikan loop deteksi suara
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    analyserRef.current = null;
    setIsSpeaking(false);

    // Hentikan stream mikrofon
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    
    // Hentikan koneksi peer
    peerRef.current?.destroy();
    peerRef.current = null;
    
    // Bersihkan elemen audio HTML
    audioEls.current.forEach(a => { 
      a.srcObject = null; 
      a.remove(); 
    });
    audioEls.current = [];
    
    setIsActive(false);
    setVoiceActive(false);
    setIsMuted(true);
    setStopVoiceCallback(null);
  };

  const stopVoiceRef = useRef(stopVoice);
  useEffect(() => { 
    stopVoiceRef.current = stopVoice; 
  }, [isActive]);

  useEffect(() => {
    setStopVoiceCallback(() => stopVoiceRef.current());
    return () => setStopVoiceCallback(null);
  }, []);

  return { isActive, isMuted, startVoice, stopVoice, toggleMute, isSpeaking };
}