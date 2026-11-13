import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { multiplayer } from '../../lib/multiplayer';
import { ExitLockScreen } from './ExitLockScreen';
import { playMusic } from '../../hooks/useMusic';

// ── Types ────────────────────────────────────────────────────────────────────
interface Spike {
  id: number; x: number; y: number;
  phase: 'hidden' | 'rising' | 'out' | 'falling';
  timer: number;
}
interface InventoryItem { id: string; name: string; icon: string }
interface Coffin { id: number; x: number; y: number; looted: boolean }
interface Chest { id: number; x: number; y: number; state: 'closed' | 'empty' | 'has_item'; opened: boolean }
interface Props { onSolve: () => void; onClose: () => void; imageSrc?: string }

// ── Constants ────────────────────────────────────────────────────────────────
const CW = 2090, CH = 1200;
const ACCEL = 1, FRICTION = 0.5, MAX_SPD = 2;
const P_RAD_X = 8;
const P_RAD_Y = 4;
const P_RENDER = 49;
const MAX_LIVES = 3, IMMUNE_MS = 3000;
// TIMING KONSTANTA - lebih cepat biar spike lebih sering keluar
const SPIKE_HIDDEN_FRAMES = 120;   // lebih lama muncul
const SPIKE_RISE_FRAMES = 15;      // was 20
const SPIKE_OUT_FRAMES = 90;       // was 60 - lebih lama keluar
const SPIKE_FALL_FRAMES = 15;      // was 20
const SPIKE_RENDER_SIZE = 48;
const TARGET_SPIKE_COUNT = 40;
const SPIKE_POSITION_SPACING = 96;
const SPAWN_SPIKE_CLEARANCE = 180;
const FRAME_W = 313;
const FRAME_H = 201;
const ANIM_FPS = 8;
const ANIM_FRAMES = 5;
const INTERACT_RADIUS = 60;
const TARGET_ZOOM_NORMAL = 1.9;
const TARGET_ZOOM_OUT = 1.0;
const ZOOM_LERP = 0.1;

type Direction = 'down' | 'up' | 'left' | 'right' | 'idle';
const DIR_COL: Record<Direction, number> = { down:0, up:1, left:2, right:3, idle:0 };
const DIR_OFFSET: Record<Direction, { x: number; y: number }> = {
  idle:{x:0,y:0}, down:{x:0,y:0}, up:{x:0,y:0}, left:{x:0,y:0}, right:{x:0,y:0},
};

// Posisi rintangan disebar di sepanjang jalur coklat muda (jalan utama dan persimpangan)
// Posisi rintangan disebar di jalur pasir, menghindari dinding semak dan batu
const SPIKE_POSITIONS: [number,number][] = [
  [1370, 1050], [1100, 1050], [850, 950],   // Area bawah dekat pintu masuk
  [450, 850],   [600, 700],   [350, 350],   // Area lobus kiri (bawah ke atas)
  [700, 200],   [950, 150],   [1250, 300],  // Area atas (kiri ke kanan) dekat exit dan batu
  [1400, 450],  [1700, 400],  [1550, 600],  // Area lobus kanan
  [1800, 550],  [1200, 700],  [950, 600],   // Area tengah dan pinggir kanan dekat batu kedua
  // Tambahan 5 spike baru di area jalur yang bisa dilewati
  [550, 1000],  [250, 550],  [1050, 200],   // Area tambahan: lobus kiri bawah, kiri tengah, atas tengah
  [1500, 300],  [1300, 850]                 // Area tambahan: kanan atas, tengah bawah
];

function isCreamPathPixel(colData: ImageData, x: number, y: number): boolean {
  const i = (y * CW + x) * 4;
  const r = colData.data[i], g = colData.data[i + 1], b = colData.data[i + 2];
  return r > 175 && g > 125 && b > 65
    && r > g + 15 && g > b + 15;
}

// Pastikan area sprite berada di jalur krem dan tidak menyentuh semak hijau.
function isSafeSpikePosition(colData: ImageData, x: number, y: number): boolean {
  const halfSize = SPIKE_RENDER_SIZE / 2;
  if (x < halfSize || y < SPIKE_RENDER_SIZE || x >= CW - halfSize || y >= CH) return false;
  if (Math.hypot(x - SPAWN_POS.x, y - SPAWN_POS.y) < SPAWN_SPIKE_CLEARANCE) return false;
  if (!isCreamPathPixel(colData, x, y - SPIKE_RENDER_SIZE / 2)) return false;

  let creamSamples = 0;
  let totalSamples = 0;
  for (let sampleY = y - SPIKE_RENDER_SIZE + 4; sampleY <= y - 4; sampleY += 8) {
    for (let sampleX = x - halfSize + 4; sampleX <= x + halfSize - 4; sampleX += 8) {
      const i = (sampleY * CW + sampleX) * 4;
      const r = colData.data[i], g = colData.data[i + 1], b = colData.data[i + 2];
      if (g > r + 15 && g > b + 15 && g > 70) return false;
      if (isCreamPathPixel(colData, sampleX, sampleY)) creamSamples++;
      totalSamples++;
    }
  }

  return creamSamples / totalSamples >= 0.75;
}

// Keep existing positions that fit the path, then fill the maze with safe positions.
function validateSpikePositions(colData: ImageData): [number,number][] {
  const positions = SPIKE_POSITIONS.filter(([x, y]) => isSafeSpikePosition(colData, x, y));
  const candidates: [number, number][] = [];

  for (let y = SPIKE_RENDER_SIZE + 8; y < CH - 8; y += 48) {
    for (let x = SPIKE_RENDER_SIZE / 2 + 8; x < CW - SPIKE_RENDER_SIZE / 2 - 8; x += 48) {
      if (isSafeSpikePosition(colData, x, y)) candidates.push([x, y]);
    }
  }

  while (positions.length < TARGET_SPIKE_COUNT && candidates.length > 0) {
    let bestIndex = -1;
    let bestDistance = SPIKE_POSITION_SPACING;

    for (let i = 0; i < candidates.length; i++) {
      const [x, y] = candidates[i];
      let nearestDistance = Infinity;
      for (const [placedX, placedY] of positions) {
        nearestDistance = Math.min(nearestDistance, Math.hypot(x - placedX, y - placedY));
      }
      if (nearestDistance > bestDistance) {
        bestDistance = nearestDistance;
        bestIndex = i;
      }
    }

    if (bestIndex < 0) break;
    positions.push(candidates.splice(bestIndex, 1)[0]);
  }

  return positions;
}

const ROCK_ZONES = [
  { x: 1050, y: 350, w: 120, h: 115 },
  { x: 1845, y: 665, w: 165, h: 135 },
];

let validatedSpikePositions: [number,number][] | null = null;

function makeSpikes(): Spike[] {
  const positions = validatedSpikePositions ?? SPIKE_POSITIONS;
  return positions.map(([x,y],i) => ({
    id:i, x, y, phase:'hidden',
    timer: Math.floor(Math.random() * SPIKE_HIDDEN_FRAMES),
  }));
}

function setValidatedSpikePositions(positions: [number,number][]) {
  validatedSpikePositions = positions;
}

// Disamakan dengan proporsi celah masuk (bawah) dan keluar (atas) pada resolusi 2090x1200
const SPAWN_POS = { x: 1300, y: 1160 }; 
const EXIT_ZONE = { x: 1070, y: 30, w: 100, h: 60 };

// Diletakkan di area melingkar di tengah-kiri
const COFFIN_DATA: Coffin[] = [
  { id: 1, x: 1185, y: 680, looted: false },
];

// Ditempatkan di berbagai sudut jalan buntu paling ujung
const CHEST_DATA: Chest[] = [
  { id: 1, x: 540,  y: 305, state: 'empty',    opened: false }, // Ujung buntu paling kiri
  { id: 2, x: 1210, y: 510, state: 'empty',    opened: false }, // Ujung buntu kanan atas
  { id: 3, x: 800,  y: 410, state: 'empty',    opened: false }, // Ujung buntu bawah kiri
  { id: 4, x: 1866, y: 800, state: 'has_item', opened: false }, // Ujung buntu kanan bawah, di bawah batu
];
// ── Component ────────────────────────────────────────────────────────────────
export function BrainMazePuzzle({ onSolve, onClose, imageSrc='/backgrounds/brainmaze2.png' }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const colDataRef = useRef<ImageData|null>(null);
  const exitLockRef     = useRef(false);
  const savedPosRef     = useRef({ ...SPAWN_POS });
  const exitCooldownRef = useRef(0);
  const keysRef    = useRef<Set<string>>(new Set());
  const velRef     = useRef({ x:0, y:0 });
  const posRef     = useRef({ ...SPAWN_POS });
  const doneRef    = useRef(false);
  const livesRef   = useRef(MAX_LIVES);
  const immuneRef  = useRef(0);
  const spikesRef  = useRef<Spike[]>(makeSpikes());
  const animRef    = useRef({ frame:0, ticker:0, dir:'idle' as Direction });
  const zoomRef    = useRef(TARGET_ZOOM_NORMAL);
  const camZoomRef = useRef(TARGET_ZOOM_NORMAL);
  const notifTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const spikeImgRef = useRef<HTMLImageElement|null>(null);
  // image refs
  const ssImgRef        = useRef<HTMLImageElement|null>(null);
  const coffinImgRef    = useRef<HTMLImageElement|null>(null);
  const chestClosedImgRef = useRef<HTMLImageElement|null>(null);
  const chestEmptyImgRef  = useRef<HTMLImageElement|null>(null);
  const chestItemImgRef   = useRef<HTMLImageElement|null>(null);
  const chestKeyImgRef    = useRef<HTMLImageElement|null>(null);
  const followerImgRef    = useRef<HTMLImageElement|null>(null);
  const followerTrailRef  = useRef<{ x: number; y: number }[]>([]);
  const followerAnimRef   = useRef<{ frame: number; ticker: number; dir: string }>({ frame: 0, ticker: 0, dir: 'idle' });
  const followerPrevRef   = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // ── Multiplayer: body karakter kedua + sinkronisasi posisi ───────────────
  const secondPosRef   = useRef({ ...SPAWN_POS });
  const secondVelRef   = useRef({ x: 0, y: 0 });
  const secondAnimRef  = useRef({ frame: 0, ticker: 0, dir: 'idle' as Direction });
  const lastSyncRef    = useRef(0);
  // Posisi terakhir yang dikirim (untuk hemat: kirim hanya saat berubah).
  const lastSentRef    = useRef({ x: 0, y: 0, dir: 'idle' as Direction, frame: 0, at: 0 });
  // Kapan terakhir posisi juga ditulis ke DB (jalur cadangan polling).
  const lastHttpSyncRef = useRef(0);
  // Waktu frame sebelumnya (lerp fallback berbasis delta waktu).
  const lastFrameAtRef = useRef(0);

  // ── Peran karakter di multiplayer ────────────────────────────────────────
  // playerCharacter hanya terisi kalau sedang lobbies (multiplayer).
  const isMultiplayer   = !!useGameStore((s) => s.playerCharacter);
  const myScene5Char    = useGameStore((s) => s.scene5Character);
  const myLobbyChar     = useGameStore((s) => s.playerCharacter);
  const releasedChar    = useGameStore((s) => s.releasedCharacter);
  // Maze music saat brain maze dibuka, kembali ke music level 7 saat ditutup.
  useEffect(() => {
    playMusic('/audio/mazemusic.mp3');
    return () => {
      playMusic('/audio/lv7music.mp3');
    };
  }, []);
  // Karakter yang benar-benar dikendalikan pemain ini di scene 5.
  const effectiveChar   = myScene5Char ?? myLobbyChar;
  // 'main'   → tubuh dengan sprite player_sheet2.png (pemain Katsuragi)
  // 'second' → tubuh dengan sprite kayshi/vania frame (pemain yang dibebaskan)
  const localRole: 'main' | 'second' =
    !isMultiplayer || !effectiveChar || effectiveChar === 'char3' ? 'main' : 'second';

  // Ref agar loop render (yang dibuat sekali) selalu membaca nilai terbaru.
  const localRoleRef = useRef(localRole);
  const isMpRef      = useRef(isMultiplayer);
  useEffect(() => { localRoleRef.current = localRole; }, [localRole]);
  useEffect(() => { isMpRef.current = isMultiplayer; }, [isMultiplayer]);

  // ── React state ──────────────────────────────────────────────────────────
  const [mounted, setMounted]               = useState(false);
  const [showExitLock, setShowExitLock]     = useState(false);
  const [showCoffinZoom, setShowCoffinZoom] = useState(false);
  const [lives, setLives]                   = useState(MAX_LIVES);
  const [isImmune, setIsImmune]             = useState(false);
  const [gameOver, setGameOver]             = useState(false);
  const [warning, setWarning]               = useState('');
  const [notification, setNotification]     = useState('');
  const [nearPrompt, setNearPrompt]         = useState('');
  const [inventory, setInventory]           = useState<InventoryItem[]>([{ id:'escape_key', name:'Escape Key', icon:'🗝️' }]);
  const [coffins, setCoffins]               = useState<Coffin[]>(COFFIN_DATA);
  const [chests, setChests]                 = useState<Chest[]>(CHEST_DATA);
  const exitUnlocked = useRef(false);
  const coffinsRef   = useRef(coffins);
  const chestsRef    = useRef(chests);
  const inventoryRef = useRef(inventory);

  useEffect(() => { exitUnlocked.current = inventory.some(item => item.id === 'escape_key'); }, [inventory]);
  useEffect(() => { coffinsRef.current = coffins; }, [coffins]);
  useEffect(() => { chestsRef.current = chests; }, [chests]);
  useEffect(() => { inventoryRef.current = inventory; }, [inventory]);

  useEffect(() => { setTimeout(() => setMounted(true), 30); }, []);

  // ── Load images ──────────────────────────────────────────────────────────
  useEffect(() => {
    const ss = new Image(); ss.src = '/treasures/player_sheet2.png'; ssImgRef.current = ss;
    const coffin = new Image(); coffin.src = '/objects/maze/coffin2.png'; coffinImgRef.current = coffin;
    const cc = new Image(); cc.src = '/objects/maze/chest3.png'; chestClosedImgRef.current = cc;
    const ce = new Image(); ce.src = '/objects/maze/chest2.png'; chestEmptyImgRef.current = ce;
    const ci2 = new Image(); ci2.src = '/objects/maze/chest1.png'; chestItemImgRef.current = ci2;
    const ck = new Image(); ck.src = '/objects/maze/chestkey.png'; chestKeyImgRef.current = ck;
    const spike = new Image(); spike.src = '/objects/maze/spike.png'; spikeImgRef.current = spike;
  }, []);

  // Sprite karakter kedua: mengikuti siapa yang dibebaskan dari pod.
  // char1 = Kayshi → kayshiframe.png, char2 = Vania → vaniaframe.png
  useEffect(() => {
    const released = useGameStore.getState().releasedCharacter;
    const followerSrc = released === 'char2' ? '/treasures/vaniaframe.png' : '/treasures/kayshiframe.png';
    const follower = new Image();
    follower.src = followerSrc;
    followerImgRef.current = follower;
  }, [releasedChar]);

  // ── Keyboard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'].includes(e.code)) e.preventDefault();
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') zoomRef.current = TARGET_ZOOM_OUT;
    };
    const up = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') zoomRef.current = TARGET_ZOOM_NORMAL;
    };
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, []);

  // ── Wall collision ────────────────────────────────────────────────────────
 const isWall = useCallback((gx: number, gy: number) => {
  const md = colDataRef.current; if (!md) return true;
  const pts = [
    { cx:gx,           cy:gy },
    { cx:gx - P_RAD_X, cy:gy },
    { cx:gx + P_RAD_X, cy:gy },
    { cx:gx,           cy:gy - P_RAD_Y },
    { cx:gx,           cy:gy - P_RAD_Y * 2 },
    { cx:gx - P_RAD_X, cy:gy - P_RAD_Y },
    { cx:gx + P_RAD_X, cy:gy - P_RAD_Y },
  ];
  for (const p of pts) {
    if (p.cx<0||p.cy<0||p.cx>=CW||p.cy>=CH) return true;
    for (const rock of ROCK_ZONES) {
      const dx = (p.cx - rock.x) / (rock.w / 2);
      const dy = (p.cy - rock.y) / (rock.h / 2);
      if (dx * dx + dy * dy <= 1) return true;
    }
    const i = (Math.floor(p.cy)*CW + Math.floor(p.cx))*4;
    const r=md.data[i], g=md.data[i+1], b=md.data[i+2];

    // Semak hijau = G dominan jauh di atas R dan B
    const isGreenBush = g > r + 20 && g > b + 20 && g > 80;
    if (isGreenBush) return true;
  }
  return false;
}, []);

  // ── Respawn ───────────────────────────────────────────────────────────────
  const respawn = useCallback(() => {
    velRef.current = { x:0, y:0 };
    secondVelRef.current = { x:0, y:0 };
    immuneRef.current = performance.now() + IMMUNE_MS;
    setIsImmune(true);
    setTimeout(() => setIsImmune(false), IMMUNE_MS);
  }, []);

  // ── Notifikasi ────────────────────────────────────────────────────────────
  const showNotif = useCallback((msg: string) => {
    setNotification(msg);
    if (notifTimer.current) clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => setNotification(''), 2500);
  }, []);

  // ── Interact (E) ──────────────────────────────────────────────────────────
  const handleInteract = useCallback(() => {
    // Gunakan posisi body yang dikontrol pemain ini.
    const pos = localRoleRef.current === 'second' ? secondPosRef.current : posRef.current;
    for (const c of coffinsRef.current) {
      if (c.looted) continue;
      if (Math.hypot(pos.x - c.x, pos.y - c.y) < INTERACT_RADIUS) {
        exitLockRef.current = true;
        setShowCoffinZoom(true);
        return;
      }
    }
    for (const ch of chestsRef.current) {
      if (ch.opened) continue;
      if (Math.hypot(pos.x - ch.x, pos.y - ch.y) < INTERACT_RADIUS) {
        if (!inventoryRef.current.find(i => i.id === 'chest_key')) {
          showNotif('⚠ Kamu butuh Chest Key untuk membuka ini!');
          return;
        }
        setChests(prev => prev.map(c => c.id === ch.id ? { ...c, opened:true } : c));
        if (ch.state === 'has_item') {
          if (!inventoryRef.current.some(i => i.id === 'escape_key')) {
            setInventory(prev => [...prev, { id:'escape_key', name:'Escape Key', icon:'🗝️' }]);
          }
          showNotif('✨ Kamu menemukan Escape Key!');
        } else {
          showNotif('📦 Chest kosong...');
        }
        return;
      }
    }
  }, [showNotif]);

  useEffect(() => {
    const onE = (e: KeyboardEvent) => { if (e.code === 'KeyE') handleInteract(); };
    window.addEventListener('keydown', onE);
    return () => window.removeEventListener('keydown', onE);
  }, [handleInteract]);

  // ── Draw spike ────────────────────────────────────────────────────────────
  const drawSpike = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) => {
    const spikeImg = spikeImgRef.current;
    const size = SPIKE_RENDER_SIZE;
    const half = size / 2;
    
    // Fallback drawing when image not loaded
    if (!spikeImg?.complete || spikeImg.naturalWidth === 0) {
      // Draw spike as triangle (pointing up when progress > 0)
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(progress, progress);
      ctx.beginPath();
      ctx.moveTo(0, -half);
      ctx.lineTo(-half * 0.6, half * 0.4);
      ctx.lineTo(half * 0.6, half * 0.4);
      ctx.closePath();
      ctx.fillStyle = '#e74c3c';
      ctx.fill();
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Spritesheet 4 frame horizontal, pilih frame berdasarkan progress
    const totalFrames = 4;
    const frameIndex = progress <= 0 ? 0 : Math.min(Math.floor(progress * totalFrames), totalFrames - 1);
    const frameW = spikeImg.naturalWidth / totalFrames;
    const frameH = spikeImg.naturalHeight;

    ctx.drawImage(
      spikeImg,
      frameIndex * frameW, 0, frameW, frameH,  // source frame
      x - half, y - size,
      size, size,    // dest di canvas
    );
  }, []);

  // ── Draw player ───────────────────────────────────────────────────────────
  const drawPlayer = useCallback((
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    immune: boolean,
    imgOverride?: HTMLImageElement | null,
    animOverride?: { frame: number; dir: Direction },
  ) => {
    const ss = imgOverride ?? ssImgRef.current;
    const anim = animOverride ?? animRef.current;
    const col = DIR_COL[anim.dir];
    const row = anim.frame;
    const offset = DIR_OFFSET[anim.dir];
    const sx = col * FRAME_W;
    const sy = row * FRAME_H;

    const now = performance.now();

    if (immune) {
      // Efek Shield pelindung di sekeliling karakter
      const cx = px + 4;
      const cy = py - P_RENDER / 2;
      const shieldRadius = P_RENDER * 0.58 + Math.sin(now * 0.008) * 2;

      ctx.save();
      const grad = ctx.createRadialGradient(cx, cy, shieldRadius * 0.35, cx, cy, shieldRadius);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.05)');
      grad.addColorStop(0.7, 'rgba(56, 189, 248, 0.22)');
      grad.addColorStop(1, 'rgba(14, 165, 233, 0.5)');

      ctx.beginPath();
      ctx.arc(cx, cy, shieldRadius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Border Shield bercahaya
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.stroke();

      // Ring dalam
      ctx.beginPath();
      ctx.arc(cx, cy, shieldRadius * 0.82, 0, Math.PI * 2);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
      ctx.stroke();
      ctx.restore();

      // Karakter berkedip
      const isVisible = Math.floor(now / 100) % 2 === 0;
      ctx.save();
      ctx.globalAlpha = isVisible ? 0.9 : 0.25;
    }

    if (ss?.complete && ss.naturalWidth > 0) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(ss, sx, sy, FRAME_W, FRAME_H,
        px - P_RENDER/2 + offset.x, py - P_RENDER + offset.y, P_RENDER, P_RENDER);
    } else {
      ctx.beginPath(); ctx.arc(px, py, P_RAD_X, 0, Math.PI*2);
      ctx.fillStyle='#ec4899'; ctx.fill();
    }

    if (immune) ctx.restore();
  }, []);

  // ── Main game loop ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const bg = new Image(); bg.src = imageSrc; bg.crossOrigin='Anonymous';
    let raf: number;

    bg.onload = () => {
      const off = document.createElement('canvas'); off.width=CW; off.height=CH;
      const oc = off.getContext('2d', { willReadFrequently:true });
      if (oc) { 
        oc.drawImage(bg,0,0,CW,CH); 
        colDataRef.current=oc.getImageData(0,0,CW,CH); 
        
        // Validasi posisi spike berdasarkan collision map - hanya di area yang bisa dilewati
        if (colDataRef.current) {
          setValidatedSpikePositions(validateSpikePositions(colDataRef.current));
          // Regen spikes dengan posisi yang divalidasi
          spikesRef.current = makeSpikes();
        }
      }

     /* if (colDataRef.current) {
        const sc2 = document.createElement('canvas'); sc2.width=CW; sc2.height=CH;
        const sc = sc2.getContext('2d');
        if (sc) {
          const src = colDataRef.current;
          const out = sc.createImageData(CW,CH);
          for (let y=80; y<=1145; y++) {
            for (let x=250; x<=1890; x++) {
              const i=(y*CW+x)*4;
              const r=src.data[i], g=src.data[i+1], b=src.data[i+2];
              const isWallPixel = g > r && g > b && g > 60; // hijau dominan
              if (isWallPixel) {
                for (let dy=-2;dy<=2;dy++) for (let dx=-2;dx<=2;dx++) {
                  const nx=x+dx, ny=y+dy;
                  if (nx<240||ny<75||nx>1900||ny>1150) continue;
                  const ni=(ny*CW+nx)*4;
                  out.data[ni]=0; out.data[ni+1]=255; out.data[ni+2]=80; out.data[ni+3]=255;
                }
              }
            }
          }
          sc.putImageData(out,0,0);
          sharpRef.current=sc2;
        }
      }*/

      const cam = { ...SPAWN_POS, zoom:2.0 };
      const CAM_LERP = 0.08;

      const render = () => {
        const now = performance.now();
        const immune = now < immuneRef.current;
        const done = doneRef.current;

        if (!done && !exitLockRef.current) {
          // Body yang dikontrol pemain ini:
          //  - 'main'   → tubuh dengan sprite player_sheet2.png (pemain Katsuragi)
          //  - 'second' → tubuh dengan sprite kayshi/vania frame (pemain yang dibebaskan)
          const localIsMain = localRoleRef.current === 'main';
          const keys=keysRef.current;
          const vel = localIsMain ? velRef.current : secondVelRef.current;
          const pos = localIsMain ? posRef.current : secondPosRef.current;
          const anim = localIsMain ? animRef.current : secondAnimRef.current;
          let moving=false;
          if (keys.has('ArrowLeft')||keys.has('KeyA'))  { vel.x-=ACCEL; anim.dir='left';  moving=true; }
          if (keys.has('ArrowRight')||keys.has('KeyD')) { vel.x+=ACCEL; anim.dir='right'; moving=true; }
          if (keys.has('ArrowUp')||keys.has('KeyW'))    { vel.y-=ACCEL; anim.dir='up';    moving=true; }
          if (keys.has('ArrowDown')||keys.has('KeyS'))  { vel.y+=ACCEL; anim.dir='down';  moving=true; }
          if (!moving) { anim.dir='idle'; anim.frame=0; anim.ticker=0; }

          vel.x=Math.max(-MAX_SPD,Math.min(MAX_SPD,vel.x));
          vel.y=Math.max(-MAX_SPD,Math.min(MAX_SPD,vel.y));
          vel.x*=FRICTION; vel.y*=FRICTION;
          if (Math.abs(vel.x)<0.1) vel.x=0;
          if (Math.abs(vel.y)<0.1) vel.y=0;
          if (!isWall(pos.x+vel.x,pos.y)) pos.x+=vel.x; else vel.x=0;
          if (!isWall(pos.x,pos.y+vel.y)) pos.y+=vel.y; else vel.y=0;

          if (moving) {
            anim.ticker++;
            if (anim.ticker >= Math.round(60/ANIM_FPS)) { anim.ticker=0; anim.frame=(anim.frame+1)%ANIM_FRAMES; }
          }

          // ── Multiplayer: kirim posisi body lokal, terima posisi body remote ──
          if (isMpRef.current) {
            const myKey = localRoleRef.current === 'main' ? 'brainmaze_main' : 'brainmaze_second';
            const remoteKey = localRoleRef.current === 'main' ? 'brainmaze_second' : 'brainmaze_main';

            const payload = {
              x: Math.round(pos.x),
              y: Math.round(pos.y),
              dir: anim.dir,
              frame: anim.frame,
            };

            // Kirim lewat WebSocket (whisper) — jalur cepat, tanpa HTTP/DB.
            // Hanya saat posisi/animasi berubah, plus heartbeat 500ms.
            const lastSent = lastSentRef.current;
            const changed =
              payload.x !== lastSent.x ||
              payload.y !== lastSent.y ||
              payload.dir !== lastSent.dir ||
              payload.frame !== lastSent.frame;

            if (now - lastSyncRef.current >= 45 && (changed || now - lastSent.at >= 500)) {
              lastSyncRef.current = now;
              lastSentRef.current = { ...payload, at: now };
              const sent = multiplayer.whisperPosition(myKey, payload);

              // Fallback kalau channel privat belum siap (auth gagal / socket
              // putus): pakai jalur HTTP lama, tapi dibatasi 2x/detik supaya
              // tidak menumpuk di server dev yang cuma punya satu worker.
              // Saat whisper aktif, tetap ada heartbeat 1.5s supaya polling
              // 3 detik masih punya posisi terbaru sebagai cadangan.
              const httpInterval = sent ? 1500 : 500;
              if (now - lastHttpSyncRef.current >= httpInterval) {
                lastHttpSyncRef.current = now;
                multiplayer.syncPuzzleInput(myKey, payload);
              }
            }

            // Body remote = body yang TIDAK dikontrol pemain ini.
            const isLocalMain = localRoleRef.current === 'main';
            const targetPos = isLocalMain ? secondPosRef.current : posRef.current;
            const targetAnim = isLocalMain ? secondAnimRef.current : animRef.current;

            const pose = multiplayer.sampleRemotePose(remoteKey, now);
            if (pose) {
              // Interpolasi antar sampel whisper → gerakan mulus di 60fps.
              targetPos.x = pose.x;
              targetPos.y = pose.y;
              targetAnim.dir = pose.dir as Direction;
              targetAnim.frame = pose.frame;
            } else {
              // Fallback (channel privat belum siap / socket putus): pakai data
              // dari /input + polling, dengan lerp berbasis waktu.
              const inputs = useGameStore.getState().lobbyPuzzleInputs;
              const remote = inputs?.[remoteKey] as any;
              if (remote && typeof remote.x === 'number' && typeof remote.y === 'number') {
                const dt = Math.min(0.1, Math.max(0.001, (now - lastFrameAtRef.current) / 1000));
                const k = 1 - Math.exp(-18 * dt);
                targetPos.x += (remote.x - targetPos.x) * k;
                targetPos.y += (remote.y - targetPos.y) * k;
                targetAnim.dir = (remote.dir ?? 'idle') as Direction;
                targetAnim.frame = remote.frame ?? 0;
              }
            }
          }
          lastFrameAtRef.current = now;

          // Spikes
          for (const sp of spikesRef.current) {
            sp.timer++;
            if (sp.phase==='hidden'&&sp.timer>=SPIKE_HIDDEN_FRAMES)  { sp.phase='rising';  sp.timer=0; }
            else if (sp.phase==='rising'&&sp.timer>=SPIKE_RISE_FRAMES)  { sp.phase='out';     sp.timer=0; }
            else if (sp.phase==='out'&&sp.timer>=SPIKE_OUT_FRAMES)       { sp.phase='falling'; sp.timer=0; }
            else if (sp.phase==='falling'&&sp.timer>=SPIKE_FALL_FRAMES)  { sp.phase='hidden';  sp.timer=0; }
            if (!immune && sp.phase==='out') {
              const spikeLeft = sp.x - SPIKE_RENDER_SIZE / 2;
              const spikeRight = sp.x + SPIKE_RENDER_SIZE / 2;
              const spikeTop = sp.y - SPIKE_RENDER_SIZE;
              const spikeBottom = sp.y;
              if (
                pos.x + P_RAD_X > spikeLeft &&
                pos.x - P_RAD_X < spikeRight &&
                pos.y + P_RAD_Y > spikeTop &&
                pos.y - P_RAD_Y < spikeBottom
              ) {
                const nl=livesRef.current-1; livesRef.current=nl; setLives(nl);
                if (nl<=0) { doneRef.current=true; setGameOver(true); } else respawn();
              }
            }
          }

          // Near prompt
          let prompt='';
          for (const c of coffinsRef.current) {
            if (!c.looted&&Math.hypot(pos.x-c.x,pos.y-c.y)<INTERACT_RADIUS) prompt='[E] Periksa Peti Mati';
          }
          for (const ch of chestsRef.current) {
            if (!ch.opened&&Math.hypot(pos.x-ch.x,pos.y-ch.y)<INTERACT_RADIUS) prompt='[E] Buka Chest';
          }
          setNearPrompt(prompt);

          // Exit
          if (pos.x>=EXIT_ZONE.x&&pos.x<=EXIT_ZONE.x+EXIT_ZONE.w&&
              pos.y>=EXIT_ZONE.y&&pos.y<=EXIT_ZONE.y+EXIT_ZONE.h&&
              now>exitCooldownRef.current) {
            savedPosRef.current={...pos};
            exitLockRef.current=true;
            setShowExitLock(true);
            setWarning('');
          }
// Taruh sebelum render function:
const vw = canvas.width;
const vh = canvas.height;
          cam.x+=(pos.x-cam.x)*CAM_LERP;
          cam.y+=(pos.y-cam.y)*CAM_LERP;
          const halfW = (vw / 2) / cam.zoom;
const halfH = (vh / 2) / cam.zoom;
cam.x = Math.max(halfW, Math.min(CW - halfW, cam.x));
cam.y = Math.max(halfH, Math.min(CH - halfH, cam.y)); 
        }

        // RENDER
        const { width:vw, height:vh } = canvas;
        ctx.clearRect(0,0,vw,vh);
        ctx.save();
        ctx.translate(vw/2, vh/2);
        camZoomRef.current+=(zoomRef.current-camZoomRef.current)*ZOOM_LERP;
        cam.zoom=camZoomRef.current;
        ctx.scale(cam.zoom, cam.zoom);
        ctx.translate(-cam.x, -cam.y);

        ctx.drawImage(bg,0,0,CW,CH);
       /* if (sharpRef.current) {
          ctx.save(); ctx.shadowColor='#00ff5108'; ctx.shadowBlur=16;
          ctx.drawImage(sharpRef.current,0,0,CW,CH);
          ctx.shadowBlur=0; ctx.restore();
        }*/

        // Exit zone
        ctx.fillStyle=exitUnlocked.current?'rgba(52,211,153,0.4)':'rgba(248,113,113,0.4)';
        ctx.fillRect(EXIT_ZONE.x,EXIT_ZONE.y,EXIT_ZONE.w,EXIT_ZONE.h);

        // Posisi body yang dikontrol pemain ini (untuk highlight "near")
        const pos3 = localRoleRef.current === 'second' ? secondPosRef.current : posRef.current;

        // Coffins
        for (const c of coffinsRef.current) {
          const near=!c.looted&&Math.hypot(pos3.x-c.x,pos3.y-c.y)<INTERACT_RADIUS;
          if (near) { ctx.save(); ctx.strokeStyle='#fbbf24'; ctx.lineWidth=2; ctx.strokeRect(c.x-27,c.y-42,54,74); ctx.restore(); }
          const cImg=coffinImgRef.current;
          if (cImg?.complete&&cImg.naturalWidth>0) {
            ctx.globalAlpha=c.looted?0.4:1;
            ctx.drawImage(cImg,c.x-25,c.y-40,50,70);
            ctx.globalAlpha=1;
          } else {
            ctx.fillStyle=c.looted?'#374151':'#78350f';
            ctx.fillRect(c.x-25,c.y-40,50,70);
          }
        }

        // Chests
        for (const ch of chestsRef.current) {
          const near=!ch.opened&&Math.hypot(pos3.x-ch.x,pos3.y-ch.y)<INTERACT_RADIUS;
          if (near) { ctx.save(); ctx.strokeStyle='#fbbf24'; ctx.lineWidth=2; ctx.strokeRect(ch.x-22,ch.y-22,44,44); ctx.restore(); }
          const chImg=ch.opened
            ? (ch.state==='has_item'?chestItemImgRef.current:chestEmptyImgRef.current)
            : chestClosedImgRef.current;
          if (chImg?.complete&&chImg.naturalWidth>0) {
            ctx.drawImage(chImg,ch.x-20,ch.y-20,40,40);
          } else {
            ctx.fillStyle=ch.opened?'#1e293b':'#92400e';
            ctx.fillRect(ch.x-18,ch.y-14,36,28);
          }
        }

        // Spikes
        for (const sp of spikesRef.current) {
          let progress=0;
          if (sp.phase==='rising') progress=sp.timer/SPIKE_RISE_FRAMES;
          else if (sp.phase==='out') progress=1;
          else if (sp.phase==='falling') progress=1-sp.timer/SPIKE_FALL_FRAMES;
          drawSpike(ctx,sp.x,sp.y,progress);
        }

        // Player (body utama — player_sheet2.png)
        const pos2=posRef.current;
        const mainIsLocal = !isMpRef.current || localRoleRef.current === 'main';
        drawPlayer(ctx,pos2.x,pos2.y, mainIsLocal && now<immuneRef.current, ssImgRef.current, animRef.current);

        // Body kedua — kayshiframe.png / vaniaframe.png
        // Single player: mengikuti jejak (trail) di belakang main character.
        // Multiplayer: posisi & animasi datang dari teammate.
        const fTrail = followerTrailRef.current;
        let fx = pos2.x, fy = pos2.y;
        if (isMpRef.current) {
          fx = secondPosRef.current.x;
          fy = secondPosRef.current.y;
        } else {
          fTrail.push({ x: pos2.x, y: pos2.y });
          const FOLLOW_DELAY = 36;
          if (fTrail.length > FOLLOW_DELAY) {
            const p = fTrail.shift();
            if (p) { fx = p.x; fy = p.y; }
          } else if (fTrail.length > 1) {
            const p = fTrail[0];
            fx = p.x; fy = p.y;
          }
        }
        const fimg = followerImgRef.current;
        if (fimg && fimg.complete && fimg.naturalWidth > 0 && fimg.naturalHeight > 0) {
          const a = isMpRef.current ? secondAnimRef.current : animRef.current;
          const isVania = fimg.src.includes('vaniaframe.png');

          // Pengaturan render DIPISAH untuk masing-masing karakter.
          // Ubah nilai Kayshi dan Vania secara independen sesuai kebutuhan.
          const KAYSHI_RENDER = {
            columns: 4,
            rows: 5,
            width: 49,
            height: 49,
            offsetX: 0,
            offsetY: 0,
          };
          const VANIA_RENDER = {
            columns: 5,
            rows: 4.8,
            width: 49,
            height: 49,
            offsetX: 0,
            offsetY: 2,
          };

          const renderConfig = isVania ? VANIA_RENDER : KAYSHI_RENDER;
          const fCol = DIR_COL[a.dir as keyof typeof DIR_COL] ?? 0;
          const fRow = Math.max(0, Math.min(a.frame, renderConfig.rows - 0));

          // Vania memakai sprite sheet 5x5; Kayshi memakai frame utama 4x5.
          const FOLLOWER_FRAME_W = isVania
            ? fimg.naturalWidth / renderConfig.columns
            : FRAME_W;
          const FOLLOWER_FRAME_H = isVania
            ? fimg.naturalHeight / renderConfig.rows
            : FRAME_H;

          const fsx = fCol * FOLLOWER_FRAME_W;
          const fsy = fRow * FOLLOWER_FRAME_H;

          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(
            fimg,
            fsx, fsy,
            FOLLOWER_FRAME_W, FOLLOWER_FRAME_H,
            fx - renderConfig.width / 2 + renderConfig.offsetX,
            fy - renderConfig.height + renderConfig.offsetY,
            renderConfig.width,
            renderConfig.height
          );
        }
        ctx.restore();
        raf=requestAnimationFrame(render);
      };
      render();
    };
    return () => cancelAnimationFrame(raf);
  }, [imageSrc, isWall, drawSpike, drawPlayer, respawn]);

  // ── Restart ───────────────────────────────────────────────────────────────
  const handleRestart = () => {
    posRef.current={...SPAWN_POS}; velRef.current={x:0,y:0};
    secondPosRef.current={...SPAWN_POS}; secondVelRef.current={x:0,y:0};
    secondAnimRef.current={frame:0,ticker:0,dir:'idle'};
    followerTrailRef.current = [];
    followerAnimRef.current = { frame: 0, ticker: 0, dir: 'idle' };
    followerPrevRef.current = { x: 0, y: 0 };
    livesRef.current=MAX_LIVES; immuneRef.current=0; doneRef.current=false;
    spikesRef.current=makeSpikes();
    lastSyncRef.current = 0;
    lastSentRef.current = { x: 0, y: 0, dir: 'idle', frame: 0, at: 0 };
    lastHttpSyncRef.current = 0;
    lastFrameAtRef.current = 0;
    animRef.current={frame:0,ticker:0,dir:'idle'};
    setLives(MAX_LIVES); setGameOver(false);
    setIsImmune(false); setWarning(''); setNotification(''); setNearPrompt('');
    setInventory([{ id:'escape_key', name:'Escape Key', icon:'🗝️' }]); setCoffins(COFFIN_DATA.map(c=>({...c}))); setChests(CHEST_DATA.map(c=>({...c})));
  };

  const hearts=Array.from({length:MAX_LIVES},(_,i)=>i<lives?'❤️':'🖤');

  return (
    <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(2,6,23,0.92)',
      display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{width:1440,maxWidth:'96vw',background:'#0f172a',borderRadius:12,
        display:'flex',flexDirection:'column',opacity:mounted?1:0,
        transform:mounted?'translateY(0)':'translateY(10px)',transition:'all 0.3s',
        boxShadow:'0 25px 50px -12px rgba(0,0,0,0.6)',overflow:'hidden'}}>

        {/* Header */}
        <div style={{padding:'14px 24px',borderBottom:'1px solid #1e293b',
          display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{color:'#e2e8f0',fontWeight:'bold',fontFamily:'monospace',fontSize:15}}>NEURAL MAZE</span>
          <div style={{display:'flex',gap:4,fontSize:20}}>
            {hearts.map((h,i)=><span key={i}>{h}</span>)}
            {isImmune&&<span style={{marginLeft:8,color:'#38bdf8',fontFamily:'monospace',fontSize:12,alignSelf:'center'}}>IMMUNE</span>}
          </div>
          <span style={{color:inventory.some(item=>item.id==='escape_key')?'#34d399':'#f87171',fontWeight:'bold',fontFamily:'monospace'}}>
            KUNCI EXIT: {inventory.some(item=>item.id==='escape_key')?'SIAP':'TERKUNCI'}
          </span>
        </div>

        {/* Canvas area */}
        <div style={{position:'relative',padding:16,display:'flex',justifyContent:'center',background:'#090d16'}}>
          {warning&&(
            <div style={{position:'absolute',top:25,left:'50%',transform:'translateX(-50%)',
              background:'#ef4444',color:'white',padding:'6px 14px',borderRadius:6,
              zIndex:10,fontWeight:'bold',fontFamily:'monospace'}}>{warning}</div>
          )}

          <canvas ref={canvasRef} width={1600} height={920}
            style={{width:'100%',height:'auto',maxHeight:'80vh',background:'#090d16',borderRadius:8,imageRendering: 'crisp-edges'}}/>
    
          {/* Prompt interaksi */}
          {nearPrompt&&(
            <div style={{position:'absolute',bottom:40,left:'50%',transform:'translateX(-50%)',
              background:'rgba(15,23,42,0.9)',color:'#fbbf24',padding:'8px 20px',borderRadius:8,
              fontFamily:'monospace',fontSize:13,border:'1px solid #fbbf2444',zIndex:20,pointerEvents:'none'}}>
              {nearPrompt}
            </div>
          )}

          {/* Notifikasi */}
          {notification&&(
            <div style={{position:'absolute',top:25,left:'50%',transform:'translateX(-50%)',
              background:'rgba(15,23,42,0.95)',color:'#e2e8f0',padding:'8px 20px',borderRadius:8,
              fontFamily:'monospace',fontSize:13,border:'1px solid #334155',zIndex:20,pointerEvents:'none'}}>
              {notification}
            </div>
          )}

          {/* Inventory HUD */}
          <div style={{position:'absolute',bottom:12,right:12,background:'rgba(15,23,42,0.85)',
            border:'1px solid #334155',borderRadius:8,padding:'8px 12px',zIndex:20,
            display:'flex',gap:8,alignItems:'center',fontFamily:'monospace',fontSize:12,color:'#64748b'}}>
            <span>BAG</span>
            {inventory.length===0
              ? <span style={{color:'#1e293b'}}>—</span>
              : inventory.map(item=>(
                  <div key={item.id} title={item.name} style={{background:'#1e293b',borderRadius:6,padding:'4px 8px',fontSize:18}}>
                    {item.id === 'chest_key'
                      ? <img src="/objects/maze/chestkey.png" alt="Chest Key" style={{width:24,height:24,objectFit:'contain'}}/>
                      : item.id === 'escape_key'
                        ? <img src="/objects/maze/escapekey.png" alt="Escape Key" style={{width:24,height:24,objectFit:'contain'}}/>
                        : item.icon}
                  </div>
                ))
            }
          </div>

          {/* Game Over */}
          {gameOver&&(
            <div style={{position:'absolute',inset:16,background:'rgba(15,23,42,0.95)',
              display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderRadius:8,gap:16}}>
              <h2 style={{color:'#ef4444',fontFamily:'monospace',margin:0,fontSize:28}}>SYSTEM BREACH</h2>
              <p style={{color:'#94a3b8',fontFamily:'monospace',margin:0}}>Neural link terminated.</p>
              <div style={{display:'flex',gap:12}}>
                <button onClick={handleRestart} style={{padding:'10px 24px',background:'#0284c7',color:'white',
                  border:'none',borderRadius:6,cursor:'pointer',fontWeight:'bold',fontFamily:'monospace'}}>RESTART</button>
                <button onClick={onClose} style={{padding:'10px 24px',background:'#374151',color:'white',
                  border:'none',borderRadius:6,cursor:'pointer',fontWeight:'bold',fontFamily:'monospace'}}>EXIT</button>
              </div>
            </div>
          )}

        </div>

        <div style={{padding:'8px 24px',borderTop:'1px solid #1e293b',color:'#475569',
          fontFamily:'monospace',fontSize:12,textAlign:'center'}}>
          WASD · Shift: Zoom Out · E: Interact · Hindari spike · Kumpulkan node → exit
        </div>
      </div>

      {/* Exit Lock Screen */}
      {showExitLock&&(
        <div style={{position:'fixed',inset:0,zIndex:999999}}>
          <ExitLockScreen
            collectedCount={1}
            totalNodes={1}
            onSolve={onSolve}
            onClose={()=>{
              setShowExitLock(false);
              exitLockRef.current=false;
              exitCooldownRef.current=performance.now()+1500;
              posRef.current={...savedPosRef.current};
              velRef.current={x:0,y:0};
            }}
          />
        </div>
      )}

      {/* Coffin Zoom */}
      {showCoffinZoom&&(
        <div style={{position:'fixed',inset:0,zIndex:999999,background:'rgba(2,6,23,0.95)',
          display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#0f172a',border:'1px solid #334155',borderRadius:12,
            padding:32,width:400,display:'flex',flexDirection:'column',alignItems:'center',gap:20}}>
            <h3 style={{color:'#e2e8f0',fontFamily:'monospace',margin:0}}>PETI MATI</h3>
            <div style={{position:'relative',display:'inline-block'}}>
              {coffinImgRef.current?.complete&&coffinImgRef.current.naturalWidth>0
                ? <img src="/objects/maze/coffin1.png" style={{width:520,height:460,objectFit:'contain'}}/>
                : <div style={{width:120,height:160,background:'#78360fa2',borderRadius:8}}/>
              }
              {!coffins.find(c=>c.id===1)?.looted&&(
                <div onClick={()=>{
                  setInventory(prev=>[...prev,{id:'chest_key',name:'Chest Key',icon:'🔑'}]);
                  setCoffins(prev=>prev.map(c=>c.id===1?{...c,looted:true}:c));
                  setShowCoffinZoom(false);
                  exitLockRef.current=false;
                  showNotif('🔑 Chest Key didapat!');
                }} style={{position:'absolute',bottom:170,left:'42%',transform:'translateX(-50%)',
                  cursor:'pointer',width:24,height:44,display:'flex',alignItems:'center',
                  justifyContent:'center',borderRadius:'50%',background:'#edfb2437',
                  boxShadow:'0 0 12px rgba(251, 190, 36, 0.44)'}} title="Ambil Chest Key">
                  {chestKeyImgRef.current?.complete&&chestKeyImgRef.current.naturalWidth>0
                    ? <img src="/objects/maze/chestkey.png" style={{width:98,height:78,objectFit:'contain'}}/>
                    : <span style={{fontSize:22}}>🔑</span>
                  }
                </div>
              )}
            </div>
            <p style={{color:'#64748b',fontFamily:'monospace',fontSize:12,margin:0}}>Klik item untuk mengambilnya</p>
            <button onClick={()=>{setShowCoffinZoom(false);exitLockRef.current=false;}}
              style={{padding:'8px 24px',background:'transparent',border:'1px solid #334155',
                borderRadius:6,color:'#64748b',fontFamily:'monospace',cursor:'pointer'}}>
              TUTUP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}