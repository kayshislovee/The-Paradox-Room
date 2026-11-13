import { useState, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { Item } from '../../types/game.types';
import { looksLikeImagePath, resolveAssetPath } from '../../lib/assetPath';

interface Props {
  inventory: Item[];
  onClose: () => void;
  onCraft: (result: Item) => void;
  /** Karakter pemilik `inventory` — dipakai saat mengurangi bahan. */
  character?: 'char1' | 'char2' | 'char3';
}

const RECIPES = [
  {
    id: 'recipe_hacking_device',
    label: 'Hacking Device',
    ingredients: {
      '1,0': 'item_1',
      '1,1': 'item_2',
      '1,2': 'item_3',
    },
    result: {
      id: 'hacking_device',
      name: 'Hacking Device',
      description: 'Perangkat untuk mengakses sistem terkunci',
      icon: '💻',
      image: '/objects/hack.png',
    },
  },
  {
    id: 'recipe_hacking_device_upgraded',
    label: 'Hacking Device+',
    ingredients: {
      '1,1': 'hacking_device',
      '2,1': 'upgrade_chip',
    },
    result: {
      id: 'hacking_device_upgraded',
      name: 'Hacking Device+',
      description: 'Versi upgrade dari Hacking Device',
      icon: '/objects/hackingdevice2.png',
      image: '/objects/hackingdevice2.png',
    },
  },
];

const CRAFTABLE_ITEMS = [...new Set(
  RECIPES.flatMap(r => Object.values(r.ingredients))
)];

// ─── Design Tokens ───────────────────────────────────────────────
const C = {
  bg: '#0b0906',
  surface: '#15110a',
  surfaceHover: '#1f1a0f',
  border: 'rgba(212,175,55,0.18)',
  borderActive: 'rgba(212,175,55,0.65)',
  text: '#ece2c8',
  textMuted: 'rgba(236,226,200,0.6)',
  textDim: 'rgba(236,226,200,0.35)',
  accent: '#d4af37',
  accentGlow: 'rgba(212,175,55,0.14)',
  success: '#f0d27a',
  successGlow: 'rgba(212,175,55,0.18)',
  danger: '#c98a6b',
  purple: '#8a7a52',
  gold: '#d4af37',
};

const FONT = "'Segoe UI', system-ui, -apple-system, sans-serif";
const MONO = "'Cascadia Code', 'Fira Code', 'Consolas', monospace";

// ─── Helpers ─────────────────────────────────────────────────────
function getItemDisplay(item: Item | null | undefined) {
  if (!item) return null;
  const img = (item as any).image;
  if (img) return { type: 'image' as const, src: img, alt: item.name };
  const icon = (item as any).icon;
  // Icon bisa berupa path gambar (mis. '/objects/hack.png') — kalau так,
  // render sebagai gambar, bukan teks path.
  if (typeof icon === 'string' && /^(https?:)?\/\//i.test(icon)) {
    return { type: 'image' as const, src: icon, alt: item.name };
  }
  if (typeof icon === 'string' && icon.startsWith('/')) {
    return { type: 'image' as const, src: icon, alt: item.name };
  }
  return { type: 'icon' as const, char: icon || '?' };
}

// ─── Component ───────────────────────────────────────────────────
export function CraftingModal({ onClose, onCraft, inventory }: Props) {
  // Bahan harus diambil dari karakter yang SAMA dengan `inventory` yang dikirim
  // panel. Kalau rely on activeCharacter, karakter bisa berbeda di scene 4/5.
  const removeFromChar1Inventory = useGameStore((s) => s.removeFromChar1Inventory);
  const removeFromChar2Inventory = useGameStore((s) => s.removeFromChar2Inventory);
  const removeFromChar3Inventory = useGameStore((s) => s.removeFromChar3Inventory);
  const removeFromMainInventory = useGameStore((s) => s.removeFromInventory);
  const showNotification = useGameStore((s) => s.showNotification);
  const triggerSceneDialog = useGameStore((s) => s.triggerSceneDialog);

  const [selectedRecipeId, setSelectedRecipeId] = useState(RECIPES[0].id);
  const selectedRecipe = RECIPES.find(r => r.id === selectedRecipeId)!;

  const [grid, setGrid] = useState<Record<string, Item>>({});
  const [dragItem, setDragItem] = useState<Item | null>(null);
  const [dragSource, setDragSource] = useState<string | 'inventory' | null>(null);
  const [craftResult, setCraftResult] = useState<Item | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  const inventoryItems = inventory.filter(
    (item) =>
      CRAFTABLE_ITEMS.includes(item.id) &&
      !Object.values(grid).find((g) => g.id === item.id)
  );

  // Check if a specific recipe slot has the correct item
  const isSlotCorrect = useCallback(
    (key: string) => {
      const required = selectedRecipe.ingredients[key as keyof typeof selectedRecipe.ingredients];
      if (!required) return null; // not a recipe slot
      return grid[key]?.id === required;
    },
    [selectedRecipe, grid]
  );

  // Count how many recipe slots are filled correctly
  const filledSlots = Object.keys(selectedRecipe.ingredients).filter(
    (key) => isSlotCorrect(key)
  ).length;
  const totalSlots = Object.keys(selectedRecipe.ingredients).length;
  const canCraftNow = filledSlots === totalSlots;

  const handleDragStartInventory = (item: Item) => {
    setDragItem(item);
    setDragSource('inventory');
    setIsDragging(true);
  };

  const handleDragStartGrid = (key: string, item: Item) => {
    setDragItem(item);
    setDragSource(key);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setDragItem(null);
    setDragSource(null);
    setIsDragging(false);
    setHoveredSlot(null);
  };

  const handleDropGrid = (col: number, row: number) => {
    if (!dragItem) return;
    const key = `${col},${row}`;

    setGrid((prev) => {
      const next = { ...prev };
      if (dragSource && dragSource !== 'inventory') {
        delete next[dragSource];
      }
      if (next[key] && dragSource && dragSource !== 'inventory') {
        next[dragSource] = next[key];
      }
      next[key] = dragItem;
      return next;
    });

    handleDragEnd();
    setCraftResult(null);
  };

  const handleDropInventory = () => {
    if (!dragItem || !dragSource || dragSource === 'inventory') return;
    setGrid((prev) => {
      const next = { ...prev };
      delete next[dragSource as string];
      return next;
    });
    handleDragEnd();
    setCraftResult(null);
  };

  const checkRecipe = () => {
    for (const [key, requiredId] of Object.entries(selectedRecipe.ingredients)) {
      if (grid[key]?.id !== requiredId) {
        showNotification('Susunan item tidak cocok!', 'error');
        return;
      }
    }
    setCraftResult(selectedRecipe.result as Item);
  };

  const handleClaim = () => {
    if (!craftResult) return;
    const isHackingDevice = craftResult.id === 'hacking_device';
    // Hapus bahan dari SEMUA inventory (char1/2/3 + main), karena bahan
    // bisa tersebar di karakter berbeda. Sebelumnya hanya dari activeCharacter
    // → bahan di karakter lain tidak terhapus → item "hilang".
    const removeFromAll = (itemId: string) => {
      removeFromChar1Inventory(itemId);
      removeFromChar2Inventory(itemId);
      removeFromChar3Inventory(itemId);
      removeFromMainInventory(itemId);
    };
    Object.values(grid).forEach((item) => removeFromAll(item.id));
    setGrid({});
    setCraftResult(null);
    onCraft(craftResult);
    showNotification(`${craftResult.name} berhasil dibuat!`, 'success');
    if (isHackingDevice) {
      triggerSceneDialog('scene7_1_item');
    }
    onClose();
  };

  const handleRecipeSwitch = (recipeId: string) => {
    setSelectedRecipeId(recipeId);
    setGrid({});
    setCraftResult(null);
  };

  const COLS = 3;
  const ROWS = 3;

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(6,5,3,0.94)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, backdropFilter: 'blur(12px)',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: `linear-gradient(165deg, ${C.surface} 0%, ${C.bg} 100%)`,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          padding: '32px 36px',
          width: 680, maxWidth: '95vw',
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(236,226,200,0.04) inset',
          display: 'flex', flexDirection: 'column', gap: 24,
          animation: 'slideUp 0.25s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Header ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{
              fontFamily: MONO, fontSize: 11, color: C.accent,
              letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{
                display: 'inline-block', width: 6, height: 6,
                borderRadius: '50%', background: C.accent,
                boxShadow: `0 0 8px ${C.accent}`,
              }} />
              Crafting Table
            </div>
            <p style={{
              margin: 0, fontFamily: FONT, fontSize: 13,
              color: C.textMuted, lineHeight: 1.5,
            }}>
              Susun komponen di grid untuk merakit perangkat
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: C.textMuted,
              fontSize: 20, cursor: 'pointer', padding: '4px 8px',
              borderRadius: 8, transition: 'all 0.15s',
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = C.text;
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(236,226,200,0.07)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = C.textMuted;
              (e.currentTarget as HTMLButtonElement).style.background = 'none';
            }}
          >
            ✕
          </button>
        </div>

        {/* ─── Recipe Tabs ────────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: 8,
          paddingBottom: 16, borderBottom: `1px solid ${C.border}`,
        }}>
          {RECIPES.map((r) => {
            const isActive = selectedRecipeId === r.id;
            return (
              <button
                key={r.id}
                onClick={() => handleRecipeSwitch(r.id)}
                style={{
                  padding: '8px 18px',
                  background: isActive ? C.accentGlow : 'transparent',
                  border: `1px solid ${isActive ? C.borderActive : C.border}`,
                  borderRadius: 10,
                  color: isActive ? C.accent : C.textMuted,
                  fontFamily: FONT, fontSize: 13, fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(212,175,55,0.28)';
                    (e.currentTarget as HTMLButtonElement).style.color = C.text;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = C.border;
                    (e.currentTarget as HTMLButtonElement).style.color = C.textMuted;
                  }
                }}
              >
                {looksLikeImagePath(r.result.icon)
                  ? <img
                    src={resolveAssetPath(r.result.icon)}
                    alt=""
                    style={{ width: 18, height: 18, objectFit: 'contain' }}
                  />
                  : <span style={{ fontSize: 16 }}>{r.result.icon}</span>
                }
                {r.label}
              </button>
            );
          })}
        </div>

        {/* ─── Main Content ───────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>

          {/* ─── Inventory Panel ─────────────────────────────── */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropInventory}
            style={{
              width: 160, flexShrink: 0,
              background: 'rgba(0,0,0,0.25)',
              border: `1px solid ${C.border}`,
              borderRadius: 14, padding: 14,
              display: 'flex', flexDirection: 'column', gap: 8,
              transition: 'border-color 0.2s',
            }}
          >
            <span style={{
              fontFamily: MONO, fontSize: 10, color: C.textDim,
              letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4,
            }}>
              Inventory
            </span>
            {inventoryItems.length === 0 && (
              <div style={{
                fontFamily: FONT, fontSize: 12, color: C.textDim,
                textAlign: 'center', padding: '16px 0',
                border: `1px dashed ${C.border}`, borderRadius: 10,
              }}>
                Semua item sudah di grid
              </div>
            )}
            {inventoryItems.map((item) => {
              const display = getItemDisplay(item);
              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStartInventory(item)}
                  onDragEnd={handleDragEnd}
                  style={{
                    width: '100%', height: 52,
                    background: 'rgba(212,175,55,0.07)',
                    border: '1px solid rgba(212,175,55,0.22)',
                    borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'grab', overflow: 'hidden',
                    transition: 'all 0.15s',
                    opacity: isDragging && dragItem?.id === item.id ? 0.4 : 1,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,175,55,0.5)';
                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(212,175,55,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,175,55,0.22)';
                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(212,175,55,0.07)';
                  }}
                  title={item.name}
                >
                  {display?.type === 'image'
                    ? <img src={display.src} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6 }} alt={display.alt} />
                    : <span style={{ fontSize: 24 }}>{display?.char}</span>
                  }
                </div>
              );
            })}
          </div>

          {/* ─── Crafting Grid ─────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 2,
            }}>
              <span style={{
                fontFamily: MONO, fontSize: 10, color: C.textDim,
                letterSpacing: 2, textTransform: 'uppercase',
              }}>
                Crafting Grid
              </span>
              <span style={{
                fontFamily: MONO, fontSize: 10, color: canCraftNow ? C.success : C.textDim,
                letterSpacing: 1,
              }}>
                {filledSlots}/{totalSlots} slot terisi
              </span>
            </div>
            {Array.from({ length: ROWS }, (_, row) => (
              <div key={row} style={{ display: 'flex', gap: 6 }}>
                {Array.from({ length: COLS }, (_, col) => {
                  const key = `${col},${row}`;
                  const item = grid[key];
                  const isRecipeSlot = !!selectedRecipe.ingredients[key as keyof typeof selectedRecipe.ingredients];
                  const slotCorrect = isSlotCorrect(key);
                  const isHovered = hoveredSlot === key && isDragging;

                  return (
                    <div
                      key={key}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setHoveredSlot(key);
                      }}
                      onDragLeave={() => setHoveredSlot((prev) => (prev === key ? null : prev))}
                      onDrop={() => handleDropGrid(col, row)}
                      style={{
                        width: 80, height: 80,
                        background: isHovered
                          ? 'rgba(212,175,55,0.14)'
                          : slotCorrect
                            ? 'rgba(240,210,122,0.07)'
                            : isRecipeSlot
                              ? 'rgba(212,175,55,0.05)'
                              : 'rgba(236,226,200,0.02)',
                        border: `1.5px solid ${isHovered
                          ? C.accent
                          : slotCorrect
                            ? 'rgba(212,175,55,0.5)'
                            : isRecipeSlot
                              ? 'rgba(212,175,55,0.2)'
                              : C.border}`,
                        borderRadius: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative', overflow: 'hidden',
                        transition: 'all 0.15s ease',
                        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      {/* Recipe slot indicator */}
                      {isRecipeSlot && !item && (
                        <div style={{
                          position: 'absolute', inset: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: 0.2,
                        }}>
                          <div style={{
                            width: 24, height: 24,
                            border: `1.5px dashed ${C.accent}`,
                            borderRadius: 6,
                          }} />
                        </div>
                      )}

                      {/* Correct indicator */}
                      {slotCorrect && (
                        <div style={{
                          position: 'absolute', top: 6, right: 6,
                          width: 16, height: 16, borderRadius: '50%',
                          background: C.success, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, color: '#000', fontWeight: 700,
                        }}>
                          ✓
                        </div>
                      )}

                      {/* Item in slot */}
                      {item && (
                        <div
                          draggable
                          onDragStart={() => handleDragStartGrid(key, item)}
                          onDragEnd={handleDragEnd}
                          style={{
                            width: '100%', height: '100%',
                            cursor: 'grab', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            opacity: isDragging && dragItem?.id === item.id ? 0.4 : 1,
                            transition: 'opacity 0.15s',
                          }}
                          title={`${item.name} — drag untuk memindahkan`}
                        >
                          {(() => {
                            const display = getItemDisplay(item);
                            return display?.type === 'image'
                              ? <img src={display.src} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} alt={display.alt} />
                              : <span style={{ fontSize: 28 }}>{display?.char}</span>;
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* ─── Arrow + Result ────────────────────────────── */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 16, paddingTop: 24,
          }}>
            {/* Craft Button */}
            <button
              onClick={checkRecipe}
              disabled={!canCraftNow}
              style={{
                padding: '13px 30px',
                background: canCraftNow
                  ? `linear-gradient(180deg, ${C.gold} 0%, #a8862a 100%)`
                  : 'rgba(236,226,200,0.04)',
                border: `1px solid ${canCraftNow ? C.gold : C.border}`,
                borderRadius: 10,
                color: canCraftNow ? '#171104' : C.textDim,
                fontFamily: FONT, fontSize: 13, fontWeight: 800,
                letterSpacing: 2.5, textTransform: 'uppercase',
                cursor: canCraftNow ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                boxShadow: canCraftNow
                  ? '0 6px 22px rgba(212,175,55,0.32), inset 0 1px 0 rgba(255,255,255,0.28)'
                  : 'none',
                opacity: canCraftNow ? 1 : 0.45,
              }}
              onMouseEnter={(e) => {
                if (canCraftNow) {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 30px rgba(212,175,55,0.45)';
                }
              }}
              onMouseLeave={(e) => {
                if (canCraftNow) {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(212,175,55,0.28)';
                }
              }}
            >
              ⚒ Craft
            </button>

            {/* Arrow indicator */}
            <div style={{
              color: craftResult ? C.success : C.textDim,
              fontSize: 20, lineHeight: 1,
              transition: 'color 0.3s',
            }}>
              →
            </div>

            {/* Result slot */}
            <div
              onClick={handleClaim}
              title={craftResult ? `Klik untuk mengambil: ${craftResult.name}` : ''}
              style={{
                width: 80, height: 80,
                background: craftResult ? C.successGlow : 'rgba(236,226,200,0.02)',
                border: `1.5px solid ${craftResult ? 'rgba(212,175,55,0.5)' : C.border}`,
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: craftResult ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                boxShadow: craftResult ? '0 0 24px rgba(212,175,55,0.18)' : 'none',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (craftResult) {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.05)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 32px rgba(240,210,122,0.26)';
                }
              }}
              onMouseLeave={(e) => {
                if (craftResult) {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 24px rgba(212,175,55,0.18)';
                }
              }}
            >
              {craftResult ? (
                (() => {
                  const display = getItemDisplay(craftResult);
                  return display?.type === 'image'
                    ? <img src={display.src} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} alt={display.alt} />
                    : <span style={{ fontSize: 28 }}>{display?.char}</span>;
                })()
              ) : (
                <div style={{
                  width: 24, height: 24,
                  border: `1.5px dashed ${C.border}`,
                  borderRadius: 6,
                }} />
              )}
            </div>

            {/* Result label */}
            {craftResult && (
              <div style={{
                fontFamily: FONT, fontSize: 11, color: C.success,
                textAlign: 'center', lineHeight: 1.4,
                animation: 'fadeIn 0.3s ease',
              }}>
                <div style={{ fontWeight: 600 }}>{craftResult.name}</div>
                <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                  Klik untuk ambil
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Recipe Preview ─────────────────────────────────── */}
        <div style={{
          padding: '14px 18px',
          background: 'rgba(0,0,0,0.2)',
          border: `1px solid ${C.border}`,
          borderRadius: 12,
        }}>
          <div style={{
            fontFamily: MONO, fontSize: 10, color: C.textDim,
            letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10,
          }}>
            Resep: {selectedRecipe.label}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {Object.entries(selectedRecipe.ingredients).map(([key, itemId]) => {
              const item = inventory.find((i) => i.id === itemId);
              const inGrid = grid[key];
              const isCorrect = inGrid?.id === itemId;
              const display = getItemDisplay(item);
              return (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 12px',
                  background: isCorrect ? 'rgba(240,210,122,0.09)' : 'rgba(236,226,200,0.04)',
                  border: `1px solid ${isCorrect ? 'rgba(240,210,122,0.32)' : C.border}`,
                  borderRadius: 8,
                  transition: 'all 0.2s',
                }}>
                  <div style={{
                    width: 28, height: 28,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 6, overflow: 'hidden',
                    background: 'rgba(0,0,0,0.2)',
                  }}>
                    {display?.type === 'image'
                      ? <img src={display.src} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt={display.alt} />
                      : <span style={{ fontSize: 16 }}>{display?.char}</span>
                    }
                  </div>
                  <span style={{
                    fontFamily: FONT, fontSize: 12,
                    color: isCorrect ? C.success : C.textMuted,
                  }}>
                    {item?.name || itemId}
                  </span>
                  {isCorrect && <span style={{ color: C.success, fontSize: 12 }}>✓</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Hint ──────────────────────────────────────────── */}
        <div style={{
          padding: '10px 16px',
          background: 'rgba(212,175,55,0.05)',
          border: '1px solid rgba(212,175,55,0.12)',
          borderRadius: 10,
          fontFamily: FONT, fontSize: 12, color: C.textMuted,
          lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
          <span>
            Drag item dari inventory ke grid. Slot dengan border biru menandakan posisi bahan sesuai resep.
            Klik item di grid untuk memindahkan atau drag ke inventory untuk mengeluarkan.
          </span>
        </div>
      </div>

      {/* ─── Animations ─────────────────────────────────────────── */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
