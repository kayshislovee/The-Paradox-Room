import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { Item } from '../../types/game.types';

// ─── Chest data ───────────────────────────────────────────────────────────────
interface ChestData {
  id: string;
  title: string;
  items: Item[];
}

const CHEST_DATA: Record<string, ChestData> = {
  chest_scene4: {
    id: 'chest_scene4',
    title: 'Vault Storage',
    items: [
       {
      id: 'item_uv_flashlight',
      name: 'UV Flashlight',
      description: 'Senter UV untuk melihat hal tersembunyi',
      icon: '/objects/flashlight.png',
      image: '/objects/flashlight.png',
    },
     {
      id: 'hacking_device',
      name: 'Hacking Device',
      description: 'Gunakan hacking device ke panel kode',
      icon: '/object/hack.png',
      image: '/objects/hack.png'
    },
     {
      id: 'photo_card',
      name: 'CodeMaster Photocard',
      description: 'Photocard dari CodeMaster',
      icon: '/objects/photocard.png',
      image: '/objects/photocard.png'
    },
     {
      id: 'subject_list',
      name: 'Subject List',
      description: 'Daftar Subject',
      icon: '/notes/subjectlist.png',
      image: '/notes/subjectlist.png'
    },
    {
  id: 'upgrade_chip',
  name: 'Upgrade Chip',
  description: 'Chip untuk meningkatkan Hacking Device',
  icon: '/objects/chip.png',
  image: '/objects/chip.png',
}
    
    ],
  },
};

/**
 * Item chest tidak ada di LEVEL_7.items, padahal item ini masuk ke inventory
 * karakter. Diekspor supaya sinkronisasi multiplayer bisa mencarinya juga —
 * kalau tidak, resolveItems() gagal dan seluruh inventory karakter itu tidak
 * pernah ikut tersinkron.
 */
export const CHEST_ITEMS: Item[] = Object.values(CHEST_DATA).flatMap((c) => c.items);

// ─── Konstanta grid ───────────────────────────────────────────────────────────
const CHEST_COLS    = 3;
const CHEST_ROWS    = 2;
const CHEST_SLOTS   = CHEST_COLS * CHEST_ROWS; // 6
const INV_COLS      = 5;
const INV_ROWS      = 2;
const INV_SLOTS     = INV_COLS * INV_ROWS;     // 10

// ─── Warna tema ───────────────────────────────────────────────────────────────
const C = {
  bg:          '#1c1f26',
  panelBg:     '#14171e',
  slotEmpty:   '#0e1016',
  slotBorder:  '#2a2e3a',
  slotHover:   '#252830',
  slotFill:    '#1a1d25',
  highlight:   '#4f6ef7',
  textMain:    '#c8cdd8',
  textMuted:   '#55596a',
  textLabel:   '#7b8099',
  divider:     '#22252e',
  taken:       '#1a1d25',
  takenText:   '#3a3d4a',
  tooltipBg:   '#0a0c11',
  tooltipBorder:'#2a2e3a',
};

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function Tooltip({ item }: { item: Item }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 'calc(100% + 8px)',
      left: '50%',
      transform: 'translateX(-50%)',
      background: C.tooltipBg,
      border: `1px solid ${C.tooltipBorder}`,
      borderRadius: 4,
      padding: '7px 10px',
      whiteSpace: 'nowrap',
      zIndex: 100,
      pointerEvents: 'none',
      boxShadow: '0 4px 16px rgba(0,0,0,0.7)',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0', fontFamily: 'Courier New', marginBottom: 3 }}>
        {item.name}
      </div>
      <div style={{ fontSize: 9, color: C.textMuted, fontFamily: 'sans-serif', maxWidth: 160, whiteSpace: 'normal', lineHeight: 1.5 }}>
        {item.description}
      </div>
      {/* Tooltip arrow */}
      <div style={{
        position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)',
        width: 8, height: 8, background: C.tooltipBg,
        border: `1px solid ${C.tooltipBorder}`,
        borderTop: 'none', borderLeft: 'none',
       // transform: 'translateX(-50%) rotate(45deg)',    
      }} />
    </div>
  );
}

// ─── Slot ─────────────────────────────────────────────────────────────────────
function Slot({
  item,
  taken = false,
  onClick,
  dim = false,
}: {
  item?: Item;
  taken?: boolean;
  onClick?: () => void;
  dim?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const isEmpty = !item;

  const borderColor = hovered && item && !taken
    ? C.highlight
    : taken
      ? C.slotBorder
      : C.slotBorder;

  const bgColor = isEmpty
    ? C.slotEmpty
    : taken
      ? C.taken
      : hovered
        ? C.slotHover
        : C.slotFill;

  return (
    <div
      onClick={!taken && item ? onClick : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 54, height: 54,
        background: bgColor,
        border: `2px solid ${borderColor}`,
        borderRadius: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: item && !taken ? 'pointer' : 'default',
        position: 'relative',
        transition: 'border-color 0.1s, background 0.1s',
        boxShadow: hovered && item && !taken
          ? `0 0 0 1px ${C.highlight}44, inset 0 0 8px ${C.highlight}11`
          : 'none',
        opacity: dim ? 0.4 : 1,
        flexShrink: 0,
      }}
    >
      {item && (
        <>
          {/* Item icon / image */}
          <div style={{
            width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            filter: taken ? 'grayscale(1) brightness(0.4)' : 'none',
            transition: 'filter 0.2s',
            fontSize: 22,
          }}>
            {item.image
              ? <img src={item.image} alt={item.name} style={{ width: 32, height: 32, objectFit: 'contain', imageRendering: 'pixelated' }} />
              : item.icon}
          </div>

          {/* Taken overlay check */}
          {taken && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: C.takenText,
            }}>
              ✓
            </div>
          )}

          {/* Tooltip on hover */}
          {hovered && !taken && <Tooltip item={item} />}
        </>
      )}

      {/* Inner shadow untuk efek "sunken" ala Minecraft */}
      <div style={{
        position: 'absolute', inset: 0,
        boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.5), inset -1px -1px 0 rgba(255,255,255,0.04)',
        pointerEvents: 'none',
        borderRadius: 2,
      }} />
    </div>
  );
}

// ─── SlotGrid ─────────────────────────────────────────────────────────────────
function SlotGrid({
  items,
  total,
  cols,
  takenIds,
  onTake,
}: {
  items: Item[];
  total: number;
  cols: number;
  takenIds: string[];
  onTake?: (item: Item) => void;
}) {
  const slots: (Item | null)[] = Array(total).fill(null);
  items.forEach((item, i) => { if (i < total) slots[i] = item; });

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 54px)`,
      gap: 4,
    }}>
      {slots.map((item, i) => (
        <Slot
          key={i}
          item={item ?? undefined}
          taken={item ? takenIds.includes(item.id) : false}
          onClick={item && onTake ? () => onTake(item) : undefined}
        />
      ))}
    </div>
  );
}

// ─── Panel label ──────────────────────────────────────────────────────────────
function PanelLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 700, letterSpacing: 2.5,
      color: C.textLabel, fontFamily: 'Courier New',
      marginBottom: 8,
      textTransform: 'uppercase' as const,
    }}>
      {children}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onClose: () => void;
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ChestModal({ onClose }: Props) {
  const chestOpen          = useGameStore(s => s.chestOpen);
  const takenChestItems    = useGameStore(s => s.takenChestItems);
  const takeChestItem      = useGameStore(s => s.takeChestItem);
  const setChestOpen       = useGameStore(s => s.setChestOpen);
  const addToChar3Inventory = useGameStore(s => s.addToChar3Inventory);
  const showNotification   = useGameStore(s => s.showNotification);
  const podLoginDone        = useGameStore(s => s.podLoginDone);
  const char3Inventory = useGameStore(s => s.char3Inventory ?? []);
  const visibleInventory = char3Inventory.filter(item => !(podLoginDone && item.id === 'subject_list'));

  const chest = chestOpen ? CHEST_DATA[chestOpen] : null;
  if (!chest) return null;

  const handleTake = (item: Item) => {
    // Item dianggap sudah diambil kalau ada di takenChestItems ATAU sudah
    // ada di char3Inventory (sinkron dari player lain / sesi sebelumnya).
    if (takenChestItems.includes(item.id) || char3Inventory.some((i) => i.id === item.id)) return;
    takeChestItem(item.id);
    addToChar3Inventory(item);
    showNotification(`${item.icon} "${item.name}" diambil!`, 'success');
  };

  const handleClose = () => { setChestOpen(null); onClose(); };
  const allTaken    = chest.items.every(i =>
    takenChestItems.includes(i.id) || char3Inventory.some((c) => c.id === i.id)
  );

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.78)',
        zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.bg,
          border: `1px solid ${C.slotBorder}`,
          borderRadius: 6,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04)',
          animation: 'chestAppear 0.18s cubic-bezier(0.2,1,0.4,1)',
          userSelect: 'none',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px',
          background: C.panelBg,
          borderBottom: `1px solid ${C.divider}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}></span>
            <span style={{ fontFamily: 'Courier New', fontSize: 11, fontWeight: 700, color: C.textMain, letterSpacing: 1.5 }}>
              {chest.title}
            </span>
            {allTaken && (
              <span style={{
                fontSize: 8, letterSpacing: 1.5, padding: '2px 7px',
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.slotBorder}`,
                borderRadius: 3, color: C.textMuted, fontFamily: 'Courier New',
              }}>
                KOSONG
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'transparent', border: `1px solid ${C.slotBorder}`,
              borderRadius: 3, color: C.textMuted,
              fontSize: 10, padding: '3px 8px', cursor: 'pointer',
              fontFamily: 'Courier New', transition: 'all 0.12s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171'; (e.currentTarget as HTMLElement).style.borderColor = '#f8717155'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.textMuted; (e.currentTarget as HTMLElement).style.borderColor = C.slotBorder; }}
          >
            ✕
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* ── CHEST panel ── */}
          <div style={{ marginBottom: 4 }}>
            <PanelLabel>Chest</PanelLabel>
            <SlotGrid
              items={chest.items}
              total={CHEST_SLOTS}
              cols={CHEST_COLS}
              takenIds={[...takenChestItems, ...char3Inventory.map((i) => i.id)]}
              onTake={handleTake}
            />
          </div>

          {/* ── Divider ── */}
          <div style={{ height: 1, background: C.divider, margin: '14px 0' }} />

          {/* ── INVENTORY panel ── */}
          <div>
            <PanelLabel>Inventori — Char 3</PanelLabel>
            <SlotGrid
              items={visibleInventory}
              total={INV_SLOTS}
              cols={INV_COLS}
              takenIds={[]}   // item di inventory tidak bisa "taken" lagi
            />
          </div>

          {/* ── Hint ── */}
          <div style={{
            marginTop: 12,
            fontSize: 8, color: C.textMuted,
            fontFamily: 'Courier New', letterSpacing: 1,
            textAlign: 'center',
          }}>
            Klik item di chest untuk mengambilnya
          </div>
        </div>
      </div>

      <style>{`
        @keyframes chestAppear {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}