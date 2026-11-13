export function resolveTreasureImagePath(image: string | undefined): string | undefined {
  if (image === undefined) return undefined;

  const path = image.trim().replace(/\\/g, '/');

  if (!path || path.startsWith('/') || /^[a-z][a-z\d+.-]*:/i.test(path)) {
    return path;
  }

  if (path.startsWith('treasures/') || path.startsWith('storage/')) {
    return `/${path}`;
  }

  if (!path.includes('/')) {
    return `/treasures/${path}`;
  }

  return `/storage/${path}`;
}
