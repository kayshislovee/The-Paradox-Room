import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { LEVELS } from '../../data/levels';
import type { Item } from '../../types/game.types';
import { useSFX } from '../../hooks/useSFX';
import { IconSwitch, IconTranslate, IconChar1, IconChar2 } from './Level7Icons';
import { CraftingModal } from './CraftingModal';
import {
  resolveLevel7Character,
  pickInventory,
  canSwapCharacter,
  fallbackCharacter,
} from '../../lib/characterFlow';

const SLOT_COUNT = 5;

// ── Palet Hitam & Emas ────────────────────────────────────────────────
const GOLD = '#d4af37';
const GOLD_LIGHT = '#f0d27a';
const GOLD_DIM = 'rgba(212,175,55,0.45)';
const GOLD_FAINT = 'rgba(212,175,55,0.16)';
const PANEL = 'rgba(12,10,6,0.95)';
const CARD = 'rgba(26,22,12,0.75)';
const CARD_HOVER = 'rgba(38,32,18,0.9)';
const LINE = 'rgba(212,175,55,0.16)';
const TEXT_MUTED = 'rgba(233,223,196,0.55)';
const TEXT_FAINT = 'rgba(233,223,196,0.3)';

export function Level7SidePanel({ onOpenHologram }: { onOpenHologram?: () => void }) {
  const activeCharacter  = useGameStore((s) => s.activeCharacter);
  const char1Inventory   = useGameStore((s) => s.char1Inventory);
  const char2Inventory   = useGameStore((s) => s.char2Inventory);
  const char3Inventory   = useGameStore((s) => (s as any).char3Inventory) ?? [];
  const podLoginDone      = useGameStore((s) => s.podLoginDone);
  const openZoom          = useGameStore((s) => s.openZoom);
  const translationActive = useGameStore((s) => s.translationActive);
  const switchCharacter   = useGameStore((s) => s.switchCharacter);
  const toggleTranslation = useGameStore((s) => s.toggleTranslation);
  const currentLevelId    = useGameStore((s) => s.currentLevelId);
  const playerCharacter   = useGameStore((s) => s.playerCharacter);
  const sfx               = useSFX();
  const addToChar1Inventory = useGameStore((s) => s.addToChar1Inventory);
  const addToChar2Inventory = useGameStore((s) => s.addToChar2Inventory);
  const addToChar3Inventory = useGameStore((s) => s.addToChar3Inventory);
  const setUvFlashlightActive = useGameStore((s) => s.setUvFlashlightActive);
  const uvFlashlightActive    = useGameStore((s) => s.uvFlashlightActive);
  const showNotification      = useGameStore((s) => s.showNotification);
  const releasedCharacter     = useGameStore((s) => s.releasedCharacter);
  const currentSceneId        = useGameStore((s) => s.currentSceneId);
  const scene5Character       = useGameStore((s) => s.scene5Character);

  const isScene4 = currentSceneId === 'scene7_4';
  const isScene5 = currentSceneId === 'scene7_5';

  const [showCrafting, setShowCrafting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [switchAnim, setSwitchAnim]     = useState(false);

  const level      = LEVELS.find((l) => l.id === currentLevelId);
  const characters = (level as any)?.characters ?? [];
  const char1      = characters.find((c: any) => c.id === 'char1');
  const char2      = characters.find((c: any) => c.id === 'char2');
  const char3      = characters.find((c: any) => c.id === 'char3');

  // Karakter yang dikendalikan di scene ini — sumber yang sama dengan Layer7Scene.
  const sceneForChar = LEVELS.find((l) => l.id === currentLevelId)?.scenes?.find((s) => s.id === currentSceneId) as any;
  const effectiveChar = resolveLevel7Character({
    currentSceneId,
    playerCharacter,
    scene5Character,
    activeCharacter,
    autoSwitchChar: sceneForChar?.autoSwitchChar ?? null,
  });
  const inventory      = pickInventory(effectiveChar, {
    char1: char1Inventory,
    char2: char2Inventory,
    char3: char3Inventory,
  });
  const isChar1 = effectiveChar === 'char1';
  const isChar2 = effectiveChar === 'char2';
  const isChar3 = effectiveChar === 'char3';

  const activeChar = isChar1 ? char1 : isChar2 ? char2 : char3;

  // Karakter tidak aktif — hanya relevan di scene 5 single player.
  const inactiveChar = isScene5
    ? characters.find((c: any) => c.id === fallbackCharacter(effectiveChar, releasedCharacter))
    : null;

  const skillActive = (isChar1 || isChar2) ? translationActive : false;

  // Bahan bisa ada di inventory karakter manapun (mis. item_1-3 di char1,
// upgrade_chip di char3). Cek semua inventory supaya crafting tidak
// "hilang" karena bahan ada di karakter lain.
  const allInventories = [...char1Inventory, ...char2Inventory, ...char3Inventory, ...useGameStore.getState().inventory];
  const canCraft =
    allInventories.some((i: Item) => i.id === 'item_1') &&
    allInventories.some((i: Item) => i.id === 'item_2') &&
    allInventories.some((i: Item) => i.id === 'item_3');

  const visibleInventory = inventory.filter((item: Item) => !(podLoginDone && item.id === 'subject_list'));
  const slots = Array.from({ length: SLOT_COUNT }, (_, i) => visibleInventory[i] ?? null);

  const handleInventoryItemClick = (item: Item) => {
    if (item.id === 'subject_list' && item.image) {
      openZoom(item.image, item.name);
    }
  };

  const handleSwitch = () => {
    if (!canSwapCharacter({ currentSceneId, playerCharacter, scene5Character, activeCharacter })) {
      return;
    }
    sfx.playClick();
    setSwitchAnim(true);
    setTimeout(() => setSwitchAnim(false), 400);

    // Scene 5 single player: Katsuragi + orang yang dibebaskan.
    if (isScene5) {
      useGameStore.getState().setActiveCharacter(
        fallbackCharacter(effectiveChar, releasedCharacter)
      );
      return;
    }

    switchCharacter();
  };

  const handleSkill = () => {
    if (isChar3) return;
    sfx.playClick();
    toggleTranslation();
  };

  // Hanya char2 & char3 punya sinar UV.
  useEffect(() => {
    if (effectiveChar !== 'char2' && effectiveChar !== 'char3') {
      setUvFlashlightActive(false);
    }
  }, [effectiveChar, setUvFlashlightActive]);

  const showSwap = canSwapCharacter({ currentSceneId, playerCharacter, scene5Character, activeCharacter });

  return (
    <div style={{
      width: 76, minWidth: 76,
      background: PANEL,
      borderRight: `1px solid ${LINE}`,
      boxShadow: 'inset -1px 0 0 rgba(212,175,55,0.06), 8px 0 24px rgba(0,0,0,0.55)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      padding: '14px 0', gap: 10,
      userSelect: 'none', overflowY: 'auto',
    }}>

      {/* ═══ ITEM SLOTS ═══════════════════════════════════════════════ */}
      <div style={{
        width: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 7, paddingBottom: 12,
        borderBottom: `1px solid ${LINE}`,
      }}>
        <span style={{
          fontFamily: 'Courier New', fontSize: 8, color: GOLD_DIM,
          letterSpacing: 3, fontWeight: 700,
        }}>
          ITEM
        </span>

        {slots.map((item, i) => {
          const isSelected = selectedItem?.id === item?.id && !!item;
          const isUvOn = item?.id === 'item_uv_flashlight' && uvFlashlightActive;
          return (
            <div
              key={i}
              onClick={() => {
                if (!item) return;
                if (item.id === 'item_uv_flashlight') {
                  sfx.playClick();
                  setUvFlashlightActive(!uvFlashlightActive);
                  showNotification(
                    uvFlashlightActive ? 'UV Flashlight dimatikan' : 'UV Flashlight dinyalakan',
                    'info'
                  );
                  return;
                }
                if (item.id === 'subject_list') {
                  handleInventoryItemClick(item);
                  return;
                }
                if (item.id === 'hacking_device_upgraded') {
                  // Item yang menentukan, bukan karakter: kalau scene 5 memakai
                  // Kayshi/Vania, device-nya sudah dipindahkan ke inventory mereka
                  // dan reactor tetap harus bisa diperbaiki.
                  if (isScene4) return;
                  sfx.playClick();
                  onOpenHologram?.();
                  return;
                }
                setSelectedItem(item === selectedItem ? null : item);
              }}
              title={item?.name ?? 'Slot kosong'}
              style={{
                width: 48, height: 48, borderRadius: 10,
                border: `1px solid ${item
                  ? isUvOn
                    ? GOLD
                    : isSelected
                      ? GOLD
                      : GOLD_FAINT
                  : 'rgba(212,175,55,0.08)'}`,
                background: item
                  ? isUvOn
                    ? 'rgba(212,175,55,0.16)'
                    : isSelected
                      ? 'rgba(212,175,55,0.12)'
                      : CARD
                  : 'rgba(255,255,255,0.015)',
                boxShadow: item
                  ? isUvOn || isSelected
                    ? `0 0 14px ${GOLD_FAINT}, inset 0 0 12px rgba(212,175,55,0.08)`
                    : 'inset 0 1px 0 rgba(255,255,255,0.03)'
                  : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: item ? 'pointer' : 'default',
                transition: 'all 0.18s ease', position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!item) return;
                (e.currentTarget as HTMLDivElement).style.borderColor = GOLD;
                (e.currentTarget as HTMLDivElement).style.background = CARD_HOVER;
              }}
              onMouseLeave={(e) => {
                if (!item) return;
                (e.currentTarget as HTMLDivElement).style.borderColor = isUvOn || isSelected ? GOLD : GOLD_FAINT;
                (e.currentTarget as HTMLDivElement).style.background = isUvOn
                  ? 'rgba(212,175,55,0.16)'
                  : isSelected
                    ? 'rgba(212,175,55,0.12)'
                    : CARD;
              }}
            >
              {item
                ? (item as any).image
                  ? <img
                      src={(item as any).image}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}
                      alt={item.name}
                    />
                  : <span style={{ fontSize: 20, color: GOLD }}>{item.icon}</span>
                : <div style={{ width: 18, height: 18, border: `1px dashed ${GOLD_FAINT}`, borderRadius: 4 }} />}
              <span style={{
                position: 'absolute', bottom: 2, right: 4,
                fontFamily: 'Courier New', fontSize: 7, color: TEXT_FAINT,
              }}>
                {i + 1}
              </span>
            </div>
          );
        })}

        {selectedItem && (
          <div style={{
            width: 48, padding: '5px 4px',
            background: 'rgba(212,175,55,0.1)',
            border: `1px solid ${GOLD_DIM}`,
            borderRadius: 6, textAlign: 'center',
          }}>
            <div style={{
              fontFamily: 'Courier New', fontSize: 7, color: GOLD_LIGHT,
              letterSpacing: 1, lineHeight: 1.4,
            }}>
              {selectedItem.name}
            </div>
          </div>
        )}
      </div>

      {/* ═══ CRAFT ════════════════════════════════════════════════════ */}
      <button
        onClick={() => setShowCrafting(true)}
        title={canCraft ? 'Buka crafting table' : 'Bahan crafting belum lengkap (butuh 3 part hacking device)'}
        style={{
          width: 56, padding: '9px 0',
          borderRadius: 10,
          background: canCraft
            ? `linear-gradient(180deg, ${GOLD_LIGHT} 0%, ${GOLD} 55%, #a8862a 100%)`
            : 'rgba(212,175,55,0.05)',
          border: `1px solid ${canCraft ? GOLD : 'rgba(212,175,55,0.2)'}`,
          color: canCraft ? '#1a1408' : TEXT_FAINT,
          fontFamily: 'Courier New', fontSize: 9, fontWeight: 700,
          letterSpacing: 2, cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          boxShadow: canCraft
            ? '0 4px 16px rgba(212,175,55,0.28), inset 0 1px 0 rgba(255,255,255,0.35)'
            : 'none',
          transition: 'all 0.2s ease',
          animation: canCraft ? 'craftReady 2.4s ease-in-out infinite' : 'none',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          if (!canCraft) {
            el.style.borderColor = GOLD_DIM;
            el.style.color = TEXT_MUTED;
          } else {
            el.style.filter = 'brightness(1.08)';
          }
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.filter = 'none';
          if (!canCraft) {
            el.style.borderColor = 'rgba(212,175,55,0.2)';
            el.style.color = TEXT_FAINT;
          }
        }}
      >
        <span style={{ fontSize: 15, lineHeight: 1 }}>⚒</span>
        CRAFT
        {!canCraft && (
          <span style={{ fontSize: 6, letterSpacing: 0.5, opacity: 0.75 }}>belum siap</span>
        )}
      </button>

      {showCrafting && (
        <CraftingModal
          inventory={inventory}
          character={effectiveChar}
          onClose={() => setShowCrafting(false)}
          onCraft={(item) => {
            // Tulis ke karakter yang SAMA dengan yang dibaca `inventory`.
            // Sebelumnya memakai activeCharacter yang di scene 4/5 berbeda,
            // sehingga crafting bisa membaca bahan dari satu karakter lalu
            // menyimpan hasil ke karakter lain.
            if (effectiveChar === 'char1') addToChar1Inventory(item);
            else if (effectiveChar === 'char2') addToChar2Inventory(item);
            else addToChar3Inventory(item);
          }}
        />
      )}

      {/* ═══ CHARACTER SECTION ═════════════════════════════════════════ */}
      <div style={{
        width: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 9, paddingTop: 6,
      }}>
        <span style={{
          fontFamily: 'Courier New', fontSize: 8, color: GOLD_DIM,
          letterSpacing: 3, fontWeight: 700,
        }}>
          CHAR
        </span>

        {/* Avatar karakter aktif */}
        <div
          title={activeChar?.name ?? (isChar1 ? 'Karakter 1' : isChar2 ? 'Karakter 2' : 'Katsuragi')}
          style={{
            width: 50, height: 50, borderRadius: '50%',
            border: `2px solid ${GOLD}`,
            background: 'rgba(212,175,55,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
            boxShadow: '0 0 16px rgba(212,175,55,0.18)',
            animation: switchAnim ? 'charFlash 0.4s ease' : 'none',
            transition: 'all 0.3s',
          }}
        >
          {activeChar?.avatar
            ? <img src={activeChar.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            : <span style={{ color: GOLD }}>
                {isChar3 ? '🕴' : isChar1 ? <IconChar1 /> : <IconChar2 />}
              </span>
          }
        </div>

        <span style={{
          fontFamily: 'Courier New', fontSize: 8, color: GOLD_LIGHT,
          letterSpacing: 1, textAlign: 'center', maxWidth: 62,
          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
          fontWeight: 700,
        }}>
          {activeChar?.name ?? (isChar3 ? 'KATSURAGI' : isChar1 ? 'CHAR 1' : 'CHAR 2')}
        </span>

        {/* Tombol Skill — hanya char1 & char2 */}
        {!isChar3 && (
          <>
            <button
              onClick={handleSkill}
              title={activeChar?.skill?.description ?? 'Skill'}
              style={{
                width: 48, height: 40, borderRadius: 10,
                border: `1px solid ${skillActive ? GOLD : GOLD_FAINT}`,
                background: skillActive ? 'rgba(212,175,55,0.16)' : 'rgba(212,175,55,0.04)',
                color: skillActive ? GOLD_LIGHT : TEXT_MUTED,
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 2,
                boxShadow: skillActive ? '0 0 12px rgba(212,175,55,0.2)' : 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = GOLD;
                (e.currentTarget as HTMLButtonElement).style.color = GOLD_LIGHT;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = skillActive ? GOLD : GOLD_FAINT;
                el.style.color = skillActive ? GOLD_LIGHT : TEXT_MUTED;
              }}
            >
              <IconTranslate />
              <span style={{ fontFamily: 'Courier New', fontSize: 7, letterSpacing: 1, fontWeight: 700 }}>
                {skillActive ? 'ON' : 'OFF'}
              </span>
            </button>

            <span style={{
              fontFamily: 'Courier New', fontSize: 6,
              color: skillActive ? GOLD : TEXT_FAINT,
              letterSpacing: 1, textAlign: 'center', lineHeight: 1.3, maxWidth: 62,
            }}>
              {activeChar?.skill?.name ?? 'SKILL'}
            </span>
          </>
        )}

        <div style={{ width: 44, height: 1, background: `linear-gradient(90deg, transparent, ${GOLD_DIM}, transparent)` }} />

        {/* Tombol Switch + Preview — sembunyikan di scene 4 */}
        {showSwap && inactiveChar && (
          <>
            <button
              onClick={handleSwitch}
              title={`Ganti ke ${inactiveChar?.name ?? 'Karakter lain'}`}
              style={{
                width: 48, height: 44, borderRadius: 10,
                border: `1px solid ${GOLD_FAINT}`,
                background: 'rgba(212,175,55,0.04)',
                color: TEXT_MUTED,
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 3,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = GOLD;
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,175,55,0.12)';
                (e.currentTarget as HTMLButtonElement).style.color = GOLD_LIGHT;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = GOLD_FAINT;
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,175,55,0.04)';
                (e.currentTarget as HTMLButtonElement).style.color = TEXT_MUTED;
              }}
            >
              <IconSwitch />
              <span style={{ fontFamily: 'Courier New', fontSize: 7, letterSpacing: 1, fontWeight: 700 }}>SWAP</span>
            </button>

            {/* Preview karakter tidak aktif */}
            <div
              onClick={handleSwitch}
              title={inactiveChar?.name ?? 'Karakter lain'}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                border: `1px solid ${GOLD_DIM}`,
                background: 'rgba(212,175,55,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', opacity: 0.65, overflow: 'hidden',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.opacity = '1'}
              onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.opacity = '0.65'}
            >
              {inactiveChar?.avatar
                ? <img src={inactiveChar.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                : <span style={{ color: GOLD, transform: 'scale(0.8)', display: 'flex' }}>
                    {isChar3 ? (releasedCharacter === 'char2' ? <IconChar2 /> : <IconChar1 />) : <IconChar1 />}
                  </span>
              }
            </div>

            <span style={{
              fontFamily: 'Courier New', fontSize: 6,
              color: TEXT_FAINT, letterSpacing: 1,
              textAlign: 'center', maxWidth: 62,
              overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            }}>
              {inactiveChar?.name ?? 'CHAR'}
            </span>
          </>
        )}
      </div>

      <style>{`
        @keyframes charFlash {
          0% { opacity: 1; }
          40% { opacity: 0.2; }
          100% { opacity: 1; }
        }
        @keyframes craftReady {
          0%, 100% { box-shadow: 0 4px 16px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,255,255,0.35); }
          50% { box-shadow: 0 4px 22px rgba(212,175,55,0.45), inset 0 1px 0 rgba(255,255,255,0.45); }
        }
      `}</style>
    </div>
  );
}
