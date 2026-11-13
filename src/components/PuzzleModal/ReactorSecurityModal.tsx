// ReactorSecurityModal.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { Item } from '../../types/game.types';

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface ImageVariants {
  default: string;
  uv?: string;       // gambar saat UV flashlight aktif
  translated?: string; // gambar saat translate aktif
    uvTranslated?: string; // ← tambah ini
     fake?: string;              // ← tambah
  translatedFake?: string;    // ← tambah
  uvTranslatedFake?: string;  // ← tambah
  isFakeable?: boolean; 

  
}

interface Props {
  panelImage: string;
  panelImageUV?: string;        // UV variant panel utama
  panelImageTranslated?: string; // translate variant panel utama
  supportingImages?: (string | ImageVariants)[]; // bisa string biasa atau object variants
  title?: string;
  correctCode: string;
  puzzleId: string;
  targetSceneId: string;
  newBackgroundImage: string;
  actionLabel?: string;
  accentColor?: string;
  onClose: () => void;
  onSolve?: () => void;
   reactorId: string;
    onOpenMaze?: () => void;
    startGlitchTimerOnSolve?: boolean;
}

const DEFAULT_ACCENT = '#22c55e';

// ─── Digit Input Component ───────────────────────────────────────────────────
function CodeDigit({
  value,
  active,
  error,
  accent,
}: {
  value: string;
  active: boolean;
  error: boolean;
  accent: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        maxWidth: 52,
        height: 56,
        background: error
          ? 'rgba(34,197,94,0.15)'
          : active
          ? `${accent}20`
          : 'rgba(5, 15, 5, 0.85)',
        border: `2px solid ${error ? '#86efac' : active ? accent : `${accent}33`}`,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Fira Code', 'Courier New', monospace",
        fontSize: 26,
        fontWeight: 700,
        color: error ? '#86efac' : value ? accent : `${accent}44`,
        textShadow: value && !error ? `0 0 14px ${accent}` : 'none',
        transition: 'all 0.15s ease',
        userSelect: 'none',
      }}
    >
      {value || (active ? '▮' : '•')}
    </div>
  );
}

// ─── Inventory Slot Component (5 Slot Layout) ────────────────────────────────
function InventorySlot({ item, accent,onClick }: { item?: Item; accent: string;onClick?: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        width: '100%',
        aspectRatio: '1 / 1',
        background: item
          ? hovered
            ? `${accent}22`
            : 'rgba(10, 24, 10, 0.7)'
          : 'rgba(4, 10, 4, 0.5)',
        border: `1.5px solid ${item ? (hovered ? accent : `${accent}44`) : `${accent}15`}`,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
         cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        transition: 'all 0.2s ease',
        transform: hovered && item ? 'translateY(-2px)' : 'none',
        boxShadow: item && hovered ? `0 4px 12px ${accent}33` : 'none',
      }}
    >
      {item && (
        <>
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              style={{ width: '70%', height: '70%', objectFit: 'contain' }}
            />
          ) : (
            <span style={{ fontSize: 22 }}>{item.icon}</span>
          )}

          {/* Floating Tooltip */}
          {hovered && (
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 8px)',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#040d04',
                border: `1px solid ${accent}66`,
                borderRadius: 6,
                padding: '6px 10px',
                whiteSpace: 'nowrap',
                zIndex: 100,
                pointerEvents: 'none',
                boxShadow: '0 8px 24px rgba(0,0,0,0.95)',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: accent,
                  fontFamily: "'Fira Code', 'Courier New', monospace",
                }}
              >
                {item.name}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Zoomable Image Panel Component ──────────────────────────────────────────
function ZoomablePanel({
  src,
  uvSrc,
  uvActive,
  accent,
}: {
  src: string;
  uvSrc?: string;
  uvActive: boolean;
  accent: string; 
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const lastPos = useRef({ x: 0, y: 0 });
  const MIN_SCALE = 1;
  const MAX_SCALE = 4;
  // Reset zoom ketika gambar berganti
  useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, [src]);

  const clampOffset = useCallback((ox: number, oy: number, sc: number) => {
    const el = containerRef.current;
    if (!el) return { x: ox, y: oy };
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    const maxX = (cw * (sc - 1)) / 2;
    const maxY = (ch * (sc - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    };
  }, []);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale((prev) => {
      const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev - e.deltaY * 0.0015));
      setOffset((o) => clampOffset(o.x, o.y, next));
      return next;
    });
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };
      setOffset((o) => clampOffset(o.x + dx, o.y + dy, scale));
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, scale, clampOffset]);

  return (
    <div
      ref={containerRef}
      onWheel={onWheel}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setMousePos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
      }}
      onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
      onMouseDown={onMouseDown}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: '#020602',
        cursor: scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src={src}
        alt="panel evidence"
        draggable={false}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
          transformOrigin: 'center center',
          transition: dragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0, 0, 1)',
        }}
      />

      {uvActive && uvSrc && (mousePos.x > 0 || mousePos.y > 0) && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${uvSrc})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              WebkitMaskImage: `radial-gradient(circle 150px at ${mousePos.x}px ${mousePos.y}px, black 0%, black 58%, transparent 100%)`,
              maskImage: `radial-gradient(circle 150px at ${mousePos.x}px ${mousePos.y}px, black 0%, black 58%, transparent 100%)`,
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: mousePos.x - 150,
              top: mousePos.y - 150,
              width: 300,
              height: 300,
              borderRadius: '50%',
              border: '2px solid rgba(74, 222, 128, 0.7)',
              boxShadow: '0 0 18px rgba(74, 222, 128, 0.35), inset 0 0 18px rgba(74, 222, 128, 0.12)',
              pointerEvents: 'none',
              zIndex: 3,
            }}
          />
        </>
      )}

      {/* Grid Scanline Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(34, 197, 94, 0.03), rgba(74, 222, 128, 0.01), rgba(22, 163, 74, 0.03))',
          backgroundSize: '100% 3px, 6px 100%',
          pointerEvents: 'none',
        }}
      />

      {/* Status Zoom Indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          fontSize: 11,
          fontFamily: "'Fira Code', 'Courier New', monospace",
          color: `${accent}aa`,
          letterSpacing: 1.5,
          pointerEvents: 'none',
          background: 'rgba(2, 8, 2, 0.75)',
          padding: '4px 8px',
          borderRadius: 4,
          border: `1px solid ${accent}22`,
        }}
      >
        ZOOM: {Math.round(scale * 100)}%
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ReactorSecurityModal({
  panelImage = '/objects/reactor_panel.png',
  panelImageUV,
  panelImageTranslated,
  supportingImages = [],
  title = 'REACTOR SECURITY PANEL',
  correctCode,
  puzzleId,
  targetSceneId,
  newBackgroundImage,
  actionLabel = 'DEACTIVATE SECURITY',
  accentColor = DEFAULT_ACCENT,
  onClose,
  onSolve,
  reactorId,
  startGlitchTimerOnSolve = true,
}: Props) {
  const accent = accentColor;

  const [selectedImage, setSelectedImage] = useState<string>(panelImage);

  // Store Access
  const activeCharacter = useGameStore((s) => s.activeCharacter);
  const char1Inventory = useGameStore((s) => s.char1Inventory ?? []);
  const char2Inventory = useGameStore((s) => s.char2Inventory ?? []);
  const char3Inventory = useGameStore((s) => s.char3Inventory ?? []);
  const solvePuzzle = useGameStore((s) => s.solvePuzzle);
  const setSceneBackgroundOverride = useGameStore((s) => s.setSceneBackgroundOverride);
  const isPuzzleSolved = useGameStore((s) => s.isPuzzleSolved);
  const startReactorGlitchTimer = useGameStore((s) => s.startReactorGlitchTimer);
  const showNotification = useGameStore((s) => s.showNotification);
  const glitchKey = reactorId === 'reactorking' ? 'reactor'
                  : reactorId === 'reactorchina' ? 'cooling'
                  : reactorId === 'reactorngawi' ? 'power'
                  : reactorId;
  const isGlitched = useGameStore(s => s.glitchedReactors.includes(glitchKey));
  const fakeReactors = useGameStore(s => s.fakeReactors);
const isThisReactorFake = fakeReactors.includes(reactorId);
  // Game Store untuk state UV dan Translate

  useEffect(() => {
    if (!isGlitched) return;
    showNotification(
      'Reaktor sedang glitch — harus diperbaiki Katsuragi dengan Hacking Device+.',
      'error'
    );
  }, [isGlitched, showNotification]);
  const uvFlashlightActive = useGameStore((s) => s.uvFlashlightActive);
  const translationActive = useGameStore((s) => s.translationActive);

const resolveImage = (img: string | ImageVariants): string => {
  if (isGlitched) return '/objects/greenglitch.gif';
  if (typeof img === 'string') return img;

  // Fake info aktif dan gambar ini fakeable
  if (isThisReactorFake && img.isFakeable) {
    if (uvFlashlightActive && translationActive && img.uvTranslatedFake) return img.uvTranslatedFake;
    if (uvFlashlightActive && img.fake) return img.fake;
    if (translationActive && img.translatedFake) return img.translatedFake;
    if (img.fake) return img.fake;
  }
  // Normal flow
  if (uvFlashlightActive && translationActive && img.uvTranslated) return img.uvTranslated;
  if (uvFlashlightActive && img.uv) return img.uv;
  if (translationActive && img.translated) return img.translated;
  return img.default;
};

  // Panel utama — resolve berdasarkan state aktif; UV hanya dipakai sebagai overlay senter, bukan mengganti seluruh gambar.
  const activePanelImage = (() => {
    if (isGlitched) return '/objects/greenglitch.gif';
    if (translationActive && panelImageTranslated) return panelImageTranslated;
    return panelImage;
  })();

  // Update selectedImage otomatis saat UV/translate berubah
  useEffect(() => {
    setSelectedImage((prev) => {
      return prev === panelImage || prev === panelImageUV || prev === panelImageTranslated
        ? panelImage
        : prev;
    });
  }, [uvFlashlightActive, translationActive, panelImage, panelImageUV, panelImageTranslated, activePanelImage]);

  // Resolve untuk ZoomablePanel berdasarkan current selectedImage
  const resolvedSelectedImage = (() => {
    const clueMatch = supportingImages?.find((img) => {
      if (typeof img === 'string') return img === selectedImage;
      return Object.values(img).includes(selectedImage);
    });

    if (clueMatch && typeof clueMatch === 'object') {
      return resolveImage(clueMatch);
    }

    if (selectedImage === panelImage || selectedImage === panelImageUV || selectedImage === panelImageTranslated) {
      return activePanelImage;
    }

    return selectedImage;
  })();

  // Gambar pendukung (clues) support variants
  const clueImages = (supportingImages ?? []).map((img, idx) => ({
    id: `sub-${idx}`,
    url: typeof img === 'string' ? img : img.default,
    resolvedUrl: isGlitched ? '/objects/greenglitch.gif' : resolveImage(img),
    label: `CLUE #${idx + 1}`,
    hasUV: typeof img === 'object' && !!img.uv,
    hasTranslated: typeof img === 'object' && !!img.translated,
  }));

  const currentInventory: Item[] =
    activeCharacter === 'char1'
      ? char1Inventory
      : activeCharacter === 'char2'
      ? char2Inventory
      : char3Inventory;
  // State kode mengikuti panjang correctCode
  const codeLength = correctCode.length;
  const emptyDigits = () => Array.from({ length: codeLength }, () => '');
  const [digits, setDigits] = useState<string[]>(emptyDigits);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [solved, setSolved] = useState(isPuzzleSolved(puzzleId));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  const activeDigit = digits.findIndex((d) => d === '');
  const codeEntered = digits.join('');

  const handleSubmit = useCallback(() => {
    if (solved) return;

    if (isGlitched) {
      showNotification('Selesaikan glitch reactor ini dulu sebelum mengirim kode.', 'error');
      setShake(true);
      setTimeout(() => {
        setShake(false);
      }, 500);
      return;
    }

    if (codeEntered.length !== codeLength || codeEntered !== correctCode) {
      setError(true);
      setShake(true);
      setTimeout(() => {
        setError(false);
        setShake(false);
        setDigits(emptyDigits());
      }, 800);
      return;
    }

    setSolved(true);
    solvePuzzle(puzzleId);
    // Glitch kena semua reactor sekaligus (di POV semua pemain), tapi
    // perbaikannya dilakukan Katsuragi satu reactor per satu (maze simple).
    if (startGlitchTimerOnSolve) startReactorGlitchTimer();
    setSceneBackgroundOverride(targetSceneId, newBackgroundImage);
    setTimeout(() => onSolve?.(), 1000);
  }, [codeEntered, codeLength, correctCode, glitchKey, isGlitched, newBackgroundImage, onSolve, puzzleId, setSceneBackgroundOverride, showNotification, solvePuzzle, solved, startGlitchTimerOnSolve, startReactorGlitchTimer, targetSceneId]);

  const handleKey = useCallback(
    (key: string) => {
      if (solved) return;
      if (key === 'Enter' || key === '✓') {
        handleSubmit();
        return;
      }
      if (key === 'Backspace' || key === '⌫') {
        setError(false);
        setDigits((prev) => {
          const next = [...prev];
          const lastFilled = [...next].map((d, i) => (d ? i : -1)).filter((i) => i >= 0).pop();
          if (lastFilled !== undefined) next[lastFilled] = '';
          return next;
        });
        return;
      }
      if (!/^[0-9]$/.test(key)) return;
      setError(false);
      setDigits((prev) => {
        const next = [...prev];
        const emptyIdx = next.findIndex((d) => d === '');
        if (emptyIdx === -1) return prev;
        next[emptyIdx] = key;
        return next;
      });
    },
    [handleSubmit, solved]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => handleKey(e.key);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKey]);

  const numpadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'];

  // Inventory dibatasi persis 5 Slot (1 baris horizontal)
  const TOTAL_SLOTS = 5;
  const slots: (Item | null)[] = Array(TOTAL_SLOTS).fill(null);
  currentInventory.slice(0, TOTAL_SLOTS).forEach((item, i) => {
    slots[i] = item;
  });

  const charLabel =
    activeCharacter === 'char1' ? 'CHAR 1' : activeCharacter === 'char2' ? 'CHAR 2' : 'CHAR 3';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2, 6, 2, 0.88)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '92vw',
          height: '88vh',
          maxWidth: 1280,
          background: '#040b04',
          border: `1px solid ${accent}44`,
          borderRadius: 14,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'scale(1)' : 'scale(0.97)',
          transition: 'opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: `0 24px 80px rgba(0,0,0,0.95), 0 0 40px ${accent}15`,
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 24px',
            background: '#020702',
            borderBottom: `1px solid ${accent}33`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: accent,
                boxShadow: `0 0 12px ${accent}`,
              }}
            />
            <span
              style={{
                fontFamily: "'Fira Code', 'Courier New', monospace",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 2.5,
                color: accent,
              }}
            >
              {title}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
           
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: 6,
                color: '#86efac',
                fontSize: 12,
                fontWeight: 700,
                padding: '6px 14px',
                cursor: 'pointer',
                fontFamily: "'Fira Code', 'Courier New', monospace",
              }}
            >
              ✕ CLOSE
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Panel Kiri: Zoomable View menggunakan resolved image */}
        <ZoomablePanel
  src={resolvedSelectedImage}
  uvSrc={(() => {
    // Saat glitch — jangan reveal apapun via UV
    if (isGlitched) return undefined;
    
    if (selectedImage === panelImage) return panelImageUV;
    const clueMatch = supportingImages?.find(img =>
      typeof img === 'object' && img.default === selectedImage
    );
    if (!clueMatch || typeof clueMatch === 'string') return undefined;
    if (isThisReactorFake && (clueMatch as any).isFakeable && translationActive && (clueMatch as any).uvTranslatedFake) {
      return (clueMatch as any).uvTranslatedFake;
    }
    return (clueMatch as any).uv;
  })()}
  uvActive={uvFlashlightActive && !isGlitched} // ← tambah && !isGlitched
  accent={accent}
/>

          {/* Vertical Divider */}
          <div style={{ width: 1, background: `${accent}33`, flexShrink: 0 }} />

          {/* Panel Kanan: Sidebar */}
          <div
            style={{
              width: 340,
              flexShrink: 0,
              background: '#030803',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            {/* 1. Inventory Section (5 Slot Only) */}
            <div style={{ padding: '16px 20px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, letterSpacing: 2, fontFamily: 'monospace', color: accent, fontWeight: 700 }}>
                  INVENTORY (5 SLOTS)
                </span>
                <span style={{ fontSize: 10, fontFamily: 'monospace', padding: '2px 6px', background: `${accent}18`, border: `1px solid ${accent}44`, borderRadius: 4, color: accent }}>
                  {charLabel}
                </span>
              </div>

              {/* Grid 5 Kolom x 1 Baris */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
               {slots.map((item, i) => (
      <InventorySlot
    key={i}
    item={item ?? undefined}
    accent={accent}
    onClick={
      item?.id === 'item_uv_flashlight'
        ? () => useGameStore.getState().setUvFlashlightActive(
            !useGameStore.getState().uvFlashlightActive
          )
        : undefined
    }
  />
))}
              </div>
            </div>

            <div style={{ height: 1, background: `${accent}22`, margin: '0 20px' }} />

            {/* 2. Clues & Evidence Gallery Section */}
            <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <span style={{ fontSize: 11, letterSpacing: 2, fontFamily: 'monospace', color: accent, fontWeight: 700 }}>
      EVIDENCE / CLUES
    </span>
  </div>
{/* ← TAMBAH TOMBOL SKILL DI SINI */}
    <div style={{ display: 'flex', gap: 6 }}>
      {/* Tombol Translate — tersedia untuk char1 dan char2 */}
      {(activeCharacter === 'char1' || activeCharacter === 'char2') && (
        <button
          onClick={() => useGameStore.getState().toggleTranslation()}
          style={{
            background: translationActive ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${translationActive ? 'rgba(34,197,94,0.6)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 6,
            color: translationActive ? '#4ade80' : 'rgba(255,255,255,0.35)',
            fontFamily: 'monospace',
            fontSize: 9, letterSpacing: 1,
            padding: '4px 8px',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
            transition: 'all 0.15s',
          }}
        >
          <span>🌐</span>
          <span>{translationActive ? 'TRANSLATE: ON' : 'TRANSLATE'}</span>
        </button>
      )}

      
    </div>
              {clueImages.length === 0 && (
                <div style={{ color: `${accent}66`, fontSize: 10, fontFamily: 'monospace' }}>
                  NO SUPPORTING CLUES
                </div>
              )}

              {/* Thumbnail clue */}
              {clueImages.length > 0 && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {clueImages.map((clue) => {
                      const isSelected = selectedImage === clue.url;
                      return (
                        <button
                          key={clue.id}
                          onClick={() => setSelectedImage(clue.url)}
                          style={{
                            position: 'relative',
                            height: 64,
                            background: '#020602',
                            border: `1.5px solid ${isSelected ? accent : `${accent}33`}`,
                            borderRadius: 6,
                            padding: 2,
                            cursor: 'pointer',
                            overflow: 'hidden',
                            outline: 'none',
                            transition: 'all 0.15s ease',
                            boxShadow: isSelected ? `0 0 10px ${accent}40` : 'none',
                          }}
                        >
                          <img
                            src={clue.resolvedUrl}
                            alt={clue.label}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4, opacity: isSelected ? 1 : 0.6 }}
                          />

                          {/* UV/Translate Badges */}
                          {clue.hasUV && uvFlashlightActive && (
                            <div style={{
                              position: 'absolute', top: 2, right: 2,
                              fontSize: 8, background: 'rgba(34,197,94,0.8)',
                              borderRadius: 3, padding: '1px 4px', color: '#fff',
                            }}>UV</div>
                          )}
                          {clue.hasTranslated && translationActive && (
                            <div style={{
                              position: 'absolute', top: 2, right: 2,
                              fontSize: 8, background: 'rgba(74,222,128,0.8)',
                              borderRadius: 3, padding: '1px 4px', color: '#fff',
                            }}>TL</div>
                          )}

                          <div
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              background: 'rgba(2, 8, 2, 0.85)',
                              fontSize: 8,
                              fontFamily: 'monospace',
                              color: isSelected ? accent : '#a3b8a3',
                              textAlign: 'center',
                              padding: '2px 0',
                              fontWeight: 700,
                            }}
                          >
                            {clue.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {selectedImage !== panelImage && (
                    <button
                      type="button"
                      onClick={() => setSelectedImage(panelImage)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: `${accent}12`,
                        border: `1px solid ${accent}55`,
                        borderRadius: 6,
                        color: accent,
                        cursor: 'pointer',
                        fontFamily: 'monospace',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: 1,
                      }}
                    >
                      ← BACK TO MAIN PANEL
                    </button>
                  )}
                </>
              )}
            </div>

            {/* 3. Security Code Input Section */}
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, flex: 1, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={{ fontSize: 11, letterSpacing: 2, fontFamily: 'monospace', color: accent, fontWeight: 700 }}>
                  SECURITY CODE
                </span>

                {/* Display digit kode */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', animation: shake ? 'shake 0.45s cubic-bezier(.36,.07,.19,.97) both' : 'none' }}>
                  {digits.map((d, i) => (
                    <CodeDigit key={i} value={d} active={i === activeDigit && !solved} error={error} accent={solved ? accent : error ? '#86efac' : accent} />
                  ))}
                </div>

                {/* Status Message */}
                {error && (
                  <div style={{ fontSize: 11, color: '#86efac', fontFamily: 'monospace', textAlign: 'center', fontWeight: 700, background: 'rgba(34,197,94,0.1)', padding: '6px 0', borderRadius: 4 }}>
                    ✕ KODE SALAH
                  </div>
                )}
                {solved && (
                  <div style={{ fontSize: 11, color: accent, fontFamily: 'monospace', textAlign: 'center', fontWeight: 700, background: `${accent}15`, padding: '6px 0', borderRadius: 4 }}>
                    ✓ AKSES DITERIMA
                  </div>
                )}

                {/* Numpad */}
                {!solved && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {numpadKeys.map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => key === '✓' ? handleSubmit() : handleKey(key)}
                        style={{
                          background: key === '✓' ? `${accent}18` : key === '⌫' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(6, 16, 6, 0.8)',
                          border: `1px solid ${key === '⌫' ? 'rgba(34,197,94,0.3)' : key === '✓' ? `${accent}66` : `${accent}33`}`,
                          borderRadius: 6,
                          color: `${accent}cc`,
                          fontFamily: 'monospace',
                          fontSize: 16,
                          fontWeight: 700,
                          padding: '10px 0',
                          cursor: 'pointer',
                        }}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'center', fontSize: 10, letterSpacing: 2, fontFamily: 'monospace', color: solved ? accent : `${accent}66`, borderTop: `1px solid ${accent}22`, paddingTop: 10, fontWeight: 700 }}>
                {solved ? `✓ ${actionLabel} — SOLVED` : `[ ${actionLabel} ]`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}