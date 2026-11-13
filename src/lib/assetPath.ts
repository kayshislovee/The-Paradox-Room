// Resolusi path aset gambar agar kompatibel dengan upload admin Filament.
//
// Konvensi yang didukung:
//  - URL penuh (http://..., https://...) atau data:/blob: URI → apa adanya
//  - Path absolut frontend ("/avatars/lab1.png", "/achievements/lab.png") → apa adanya
//    (file hidup di folder public frontend)
//  - Path relatif "storage/xxx" → URL absolut ke API
//  - Nama file polos ("01M6ZQ.png") atau path relatif ber-folder ("achievements/x.png",
//    "uploads/y.png") → URL absolut ke API + /storage/...
//
// PENTING: file hasil upload admin lived di Laravel (storage/app/public), bukan
// di folder public frontend. Kalau path-nya dikembalikan sebagai "/storage/..."
// (root-relative), browser akan meminta ke origin frontend (Vite :5173) dan
// hasilnya 404. Karena itu path storage HARUS jadi URL absolut ke host API.
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

export function resolveAssetPath(path: string | null | undefined): string | undefined {
  if (path == null) return undefined;

  const p = String(path).trim().replace(/\\/g, '/');
  if (!p) return undefined;

  if (/^(https?:)?\/\//i.test(p) || /^(data|blob):/i.test(p)) return p;
  if (p.startsWith('/')) return p;
  if (p.startsWith('storage/')) return `${API_ORIGIN}/${p}`;

  // Sisa-nya dianggap upload ke public disk Laravel (mis. "achievements/x.png", "avatars/a.png")
  return `${API_ORIGIN}/storage/${p.replace(/^\/+/, '')}`;
}

// Alias untuk kejelasan di komponen
export const resolveImageUrl = resolveAssetPath;

// Apakah string ikon seperti path/URL gambar (bukan emoji / teks polos)?
export function looksLikeImagePath(icon: string | null | undefined): boolean {
  if (!icon) return false;
  const s = String(icon).trim().toLowerCase().split('?')[0];
  if (s.startsWith('data:image')) return true;
  return /\.(png|jpe?g|webp|gif|svg|avif|bmp)$/i.test(s);
}
