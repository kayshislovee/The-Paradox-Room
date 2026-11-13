// Mapping respons API Laravel → tipe game (src/types/game.types.ts).
//
// Berkas ini adalah "jembatan" satu-satunya antara database (diisi lewat
// admin panel Filament) dan data yang dipakai game. Semua isi database yang
// punya padanan di game TIDAK BOLEH di-hardcode di komponen: mapping di sini
// supaya hasil edit admin langsung tampil di frontend.
import type {
  Achievement,
  DialogLine,
  Hotspot,
  Level,
  Scene,
  Treasure,
} from '../types/game.types';
import { resolveAssetPath } from './assetPath';

export interface ApiStyleMap {
  [key: string]: number | string;
}

/** Ubah style JSON (nilai bisa string dari KeyValue admin) menjadi angka. */
export function mapStyle(style: unknown): DialogLine['avatarLeftStyle'] {
  if (!style || typeof style !== 'object' || Array.isArray(style)) return undefined;
  const src = style as Record<string, unknown>;
  const out: Record<string, number> = {};
  for (const key of ['bottom', 'top', 'left', 'right', 'height', 'width']) {
    const v = src[key];
    if (v === undefined || v === null || v === '') continue;
    const n = Number(v);
    if (!Number.isNaN(n)) out[key] = n;
  }
  return Object.keys(out).length ? out : undefined;
}

/** Satu baris dialog dari API (snake_case) atau data lokal (camelCase). */
export function mapDialogLine(d: Record<string, any>): DialogLine {
  return {
    character: d?.character ?? '',
    text: d?.text ?? '',
    avatar: resolveAssetPath(d?.avatar ?? undefined),
    avatarLeft: resolveAssetPath(d?.avatar_left ?? d?.avatarLeft ?? undefined),
    avatarRight: resolveAssetPath(d?.avatar_right ?? d?.avatarRight ?? undefined),
    side: (d?.side === 'right' ? 'right' : 'left') as DialogLine['side'],
    isSystem: Boolean(d?.is_system ?? d?.isSystem ?? false),
    avatarLeftStyle: mapStyle(d?.avatar_left_style ?? d?.avatarLeftStyle),
    avatarRightStyle: mapStyle(d?.avatar_right_style ?? d?.avatarRightStyle),
  };
}

/** Peta dialogId → baris dialog (levels.scene_dialogs). */
export function mapSceneDialogs(sd: unknown): Record<string, DialogLine[]> | undefined {
  if (!sd || typeof sd !== 'object' || Array.isArray(sd)) return undefined;
  const out: Record<string, DialogLine[]> = {};
  for (const [key, value] of Object.entries(sd as Record<string, unknown>)) {
    if (!Array.isArray(value)) continue;
    out[key] = value.map((line) => mapDialogLine(line as Record<string, any>));
  }
  return Object.keys(out).length ? out : undefined;
}

export function mapAchievement(a: Record<string, any>): Achievement {
  return {
    id: String(a?.achievement_key ?? a?.id ?? ''),
    title: a?.title ?? '',
    description: a?.description ?? '',
    icon: resolveAssetPath(a?.icon) ?? '',
    type: a?.type === 'treasure' ? 'treasure' : 'time',
    isGolden: Boolean(a?.is_golden ?? a?.isGolden ?? false),
  };
}

export function mapTreasure(t: Record<string, any>, achievements: Array<Record<string, any>> = []): Treasure {
  const keyById = new Map<string, string>();
  for (const a of achievements) {
    if (a?.id != null) keyById.set(String(a.id), String(a.achievement_key ?? a.id));
  }

  const achievementId =
    t?.achievement_id != null
      ? keyById.get(String(t.achievement_id)) ?? String(t.achievement_id)
      : t?.achievementId ?? '';

  return {
    id: String(t?.treasure_key ?? t?.id ?? ''),
    name: t?.name ?? undefined,
    description: t?.description ?? undefined,
    image: resolveAssetPath(t?.image ?? undefined),
    x: Number(t?.x ?? 0),
    y: Number(t?.y ?? 0),
    width: Number(t?.width ?? 5),
    height: Number(t?.height ?? 5),
    sceneId: (t?.scene_id ?? t?.sceneId) || undefined,
    achievementId,
  };
}

// ─── Level / Scene / Hotspot ─────────────────────────────────────────────────

/** Hotspot dari API (snake_case) → tipe game. */
export function mapHotspot(h: Record<string, any>): Hotspot {
  const actionData = (h?.action_data ?? {}) as Record<string, any>;
  const action = {
    type: h?.action_type ?? actionData.type ?? 'message',
    ...actionData,
  } as unknown as Hotspot['action'];

  return {
    id: String(h?.hotspot_key ?? h?.id ?? ''),
    x: Number(h?.x ?? 0),
    y: Number(h?.y ?? 0),
    width: Number(h?.width ?? 0),
    height: Number(h?.height ?? 0),
    cursor: h?.cursor ?? undefined,
    image: resolveAssetPath(h?.image ?? undefined) ?? undefined,
    zIndex: h?.z_index ?? undefined,
    action,
    visible: (h?.visible_data ?? undefined) as Hotspot['visible'],
  };
}

/** Scene dari API → tipe game (tanpa char layer; dipakai level API-driven). */
export function mapApiScene(s: Record<string, any>): Scene {
  return {
    id: String(s?.scene_key ?? ''),
    label: s?.label ?? '',
    backgroundImage: resolveAssetPath(s?.background_image) ?? '',
    hotspots: (s?.hotspots ?? []).map((h: Record<string, any>) => mapHotspot(h)),
    comicPages: (s?.comic_pages ?? undefined) as Scene['comicPages'],
    introDialog: (s?.intro_dialog ?? undefined) as Scene['introDialog'],
    hidden: Boolean(s?.hidden),
    autoSwitchChar: (s?.auto_switch_char ?? undefined) as Scene['autoSwitchChar'],
  };
}

/**
 * Hotspot: data lokal + hasil edit admin.
 * - Posisi, ukuran, gambar, cursor, dan action diambil dari API (itu yang
 *   disunting di admin).
 * - Action digabung, bukan diganti total, supaya field khusus level 7 yang
 *   belum ada di database tetap aman.
 */
function mergeHotspots(
  localHotspots: Hotspot[],
  apiHotspots: Array<Record<string, any>>,
): Hotspot[] {
  const apiByKey = new Map(apiHotspots.map((h) => [String(h.hotspot_key), h]));
  const merged: Hotspot[] = [];

  for (const lh of localHotspots) {
    const api = apiByKey.get(lh.id);
    if (!api) {
      merged.push(lh);
      continue;
    }
    apiByKey.delete(lh.id);

    merged.push(applyApiHotspot(lh, api));
  }

  // Hotspot baru yang dibuat dari admin.
  for (const api of apiByKey.values()) {
    merged.push(mapHotspot(api));
  }

  return merged;
}

/** Terapkan data hotspot dari database ke hotspot lokal. */
function applyApiHotspot(h: any, api: Record<string, any>): any {
  const apiAction = (api.action_data ?? { type: api.action_type }) as Record<string, any>;
  return {
    ...h,
    x: api.x ?? h.x,
    y: api.y ?? h.y,
    width: api.width ?? h.width,
    height: api.height ?? h.height,
    cursor: api.cursor ?? h.cursor,
    image: resolveAssetPath(api.image) ?? h.image,
    zIndex: api.z_index ?? h.zIndex,
    action: { ...(h.action as Record<string, any>), ...apiAction },
    visible: api.visible_data ?? h.visible,
  };
}

/**
 * Overlay data hotspot database ke SELURUH hotspot di dalam scene — termasuk
 * hotspot yang ada di char layer (char1/2/3Layer) dan sub-view.
 *
 * Penting untuk level 7: hotspot-nya tidak ada di `scene.hotspots` (selalu
 * kosong) tapi di dalam layer per karakter. Kalau hanya `scene.hotspots` yang
 * di-overlay, hasil edit admin untuk level 7 tidak akan pernah terlihat.
 */
function overlayHotspotsDeep<T>(node: T, apiByKey: Map<string, any>): T {
  if (Array.isArray(node)) {
    return node.map((item) =>
      item && typeof item === 'object' ? overlayHotspotsDeep(item, apiByKey) : item,
    ) as unknown as T;
  }

  if (node && typeof node === 'object') {
    const out: Record<string, any> = {};
    for (const [key, value] of Object.entries(node as Record<string, any>)) {
      if (key === 'hotspots' && Array.isArray(value)) {
        out[key] = value.map((h: any) => {
          const api = h?.id ? apiByKey.get(String(h.id)) : undefined;
          return api ? applyApiHotspot(h, api) : h;
        });
      } else if (value && typeof value === 'object') {
        out[key] = overlayHotspotsDeep(value, apiByKey);
      } else {
        out[key] = value;
      }
    }
    return out as unknown as T;
  }

  return node;
}

/**
 * Level = data lokal (sebagai pelengkap) + data database (sebagai sumber
 * utama untuk semua hal yang bisa disunting di admin).
 *
 * Level 7 punya data khusus (char layer, X-Vision, sub-view, comic) yang belum
 * punya tempat di skema database, jadi data lokal tetap dipakai sebagai
 * dasar. Yang bisa disunting di admin (posisi & gambar hotspot, jawaban
 * puzzle, background scene, dialog, treasure, achievement) menimpa data lokal.
 * Scene/puzzle baru dari admin juga ikut ditambahkan.
 */
export function mergeApiIntoLevel(local: Level, detail: Record<string, any>): Level {
  const level: Level = { ...local };

  // ── Scene + hotspot ────────────────────────────────────────────────────────
  const apiScenes: Array<Record<string, any>> = Array.isArray(detail.scenes) ? detail.scenes : [];
  if (apiScenes.length > 0) {
    const localByKey = new Map(local.scenes.map((s) => [s.id, s]));
    const mergedScenes: Scene[] = [];

    // Urutan scene mengikuti database (kolom `order`), supaya admin bisa
    // menukar urutan scene dari panel.
    for (const apiScene of apiScenes) {
      const key = String(apiScene.scene_key);
      const localScene = localByKey.get(key);
      localByKey.delete(key);

      if (!localScene) {
        mergedScenes.push(mapApiScene(apiScene));
        continue;
      }

      // Hotspot database (per scene) dipakai untuk overlay ke SEMUA hotspot di
      // scene ini — termasuk yang ada di char layer & sub-view (level 7).
      const apiHotspotByKey = new Map<string, any>(
        (apiScene.hotspots ?? []).map((h: Record<string, any>) => [String(h.hotspot_key), h]),
      );

      const mergedScene: any = {
        ...localScene,
        label: apiScene.label ?? localScene.label,
        backgroundImage: resolveAssetPath(apiScene.background_image) || localScene.backgroundImage,
        hotspots: mergeHotspots(localScene.hotspots ?? [], apiScene.hotspots ?? []),
      };

      // Char layer & sub-view: kalau admin mengisi kolomnya, isinya dipakai,
      // hotspotnya di-overlay dengan data database.
      const layerMap: Array<[string, string]> = [
        ['char1_layer', 'char1Layer'],
        ['char2_layer', 'char2Layer'],
        ['char3_layer', 'char3Layer'],
        ['char1_sub_views', 'char1SubViews'],
        ['char2_sub_views', 'char2SubViews'],
        ['char3_sub_views', 'char3SubViews'],
      ];
      for (const [apiKey, localKey] of layerMap) {
        const apiValue = apiScene[apiKey];
        if (!apiValue || typeof apiValue !== 'object') continue;
        if (!Array.isArray(apiValue) && !Object.keys(apiValue).length) continue;

        mergedScene[localKey] = overlayHotspotsDeep(
          { ...(mergedScene[localKey] ?? {}), ...(apiValue as Record<string, any>) },
          apiHotspotByKey,
        );
      }

      mergedScenes.push(overlayHotspotsDeep(mergedScene, apiHotspotByKey) as Scene);
    }

    // Scene lokal yang belum ada di database tetap dipakai.
    for (const leftover of localByKey.values()) mergedScenes.push(leftover);

    level.scenes = mergedScenes;
  }

  // ── Puzzle: jawaban & judul ikut dari database ────────────────────────────
  const apiPuzzles: Array<Record<string, any>> = Array.isArray(detail.puzzles) ? detail.puzzles : [];
  if (apiPuzzles.length > 0) {
    const apiByKey = new Map(apiPuzzles.map((p) => [String(p.puzzle_key), p]));
    const usedKeys = new Set<string>();

    level.puzzles = local.puzzles.map((p) => {
      const apiPuzzle = apiByKey.get(p.id);
      if (!apiPuzzle) return p;
      usedKeys.add(p.id);

      return {
        ...p,
        title: apiPuzzle.title ?? p.title,
        answer: apiPuzzle.answer ?? p.answer,
      };
    });

    // Puzzle baru dari admin.
    for (const [key, apiPuzzle] of apiByKey) {
      if (usedKeys.has(key)) continue;
      level.puzzles = [
        ...level.puzzles,
        {
          id: apiPuzzle.puzzle_key,
          type: apiPuzzle.type,
          title: apiPuzzle.title ?? '',
          answer: apiPuzzle.answer ?? '',
          maxDigits: apiPuzzle.max_digits ?? undefined,
          patternSize: apiPuzzle.pattern_size ?? undefined,
          clueIds: apiPuzzle.clue_ids ?? [],
        },
      ];
    }
  }

  // ── Konten yang sepenuhnya dari database ─────────────────────────────────
  const intro = (detail.dialog_lines ?? [])
    .filter((d: Record<string, any>) => d.type === 'intro')
    .map(mapDialogLine);
  if (intro.length) level.introDialog = intro;

  const sceneDialogs = mapSceneDialogs(detail.scene_dialogs);
  if (sceneDialogs) level.sceneDialogs = sceneDialogs;

  if (detail.achievements) level.achievements = detail.achievements.map(mapAchievement);
  if (detail.treasures) {
    level.treasures = detail.treasures.map((t: Record<string, any>) =>
      mapTreasure(t, detail.achievements ?? []),
    );
  }
  if (Array.isArray(detail.hints) && detail.hints.length) {
    level.hints = detail.hints.map((h: Record<string, any>) => h.text);
  }
  if (detail.scene_hints) level.sceneHints = detail.scene_hints;

  // Profil karakter per level (dipakai di layar Achievement).
  if (detail.character_avatar) {
    level.characterAvatar = resolveAssetPath(detail.character_avatar);
  }
  if (detail.character_name) {
    level.characterName = detail.character_name;
  }

  if (detail.comic_src) (level as any).comicSrc = resolveAssetPath(detail.comic_src);
  if (detail.scene_comics) (level as any).sceneComics = detail.scene_comics;

  return level;
}

/**
 * Level dari database. Dipakai kalau tidak ada data lokal untuk level itu
 * (mis. level yang seluruh kontennya dikelola dari admin).
 */
export function buildLevelFromApi(detail: Record<string, any>): Level {
  return mergeApiIntoLevel(
    {
      id: detail.level_key,
      title: detail.title ?? '',
      description: detail.description ?? '',
      thumbnail: detail.thumbnail ?? '',
      characterAvatar: resolveAssetPath(detail.character_avatar ?? undefined),
      characterName: detail.character_name ?? undefined,
      timeLimit: Number(detail.time_limit ?? 0),
      starThresholds: (detail.star_thresholds ?? [0, 0, 0]) as [number, number, number],
      music: detail.music ?? undefined,
      dialogMusic: detail.dialog_music ?? undefined,
      isLocked: Boolean(detail.is_locked),
      scenes: [],
      puzzles: [],
      hints: [],
      introDialog: [],
      items: [],
      clues: [],
      exitPuzzleId: '',
    } as Level,
    detail,
  );
}
