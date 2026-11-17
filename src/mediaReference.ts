const MANAGED_MEDIA_PREFIX = 'bioglow-media://';
const MANAGED_MEDIA_DIRECTORY = 'bioglow-media';
const SAFE_FILE_NAME = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

/** Extract a safe managed filename from either the stable format or an old absolute URI. */
export function managedMediaFileName(uri: string): string | null {
  let fileName: string | null = null;

  if (uri.startsWith(MANAGED_MEDIA_PREFIX)) {
    fileName = uri.slice(MANAGED_MEDIA_PREFIX.length);
  } else {
    const marker = `/${MANAGED_MEDIA_DIRECTORY}/`;
    const markerIndex = uri.lastIndexOf(marker);
    if (markerIndex >= 0) {
      fileName = uri.slice(markerIndex + marker.length).split(/[?#]/, 1)[0] ?? null;
    }
  }

  return fileName && SAFE_FILE_NAME.test(fileName) ? fileName : null;
}

export function managedMediaReference(fileName: string): string {
  if (!SAFE_FILE_NAME.test(fileName)) throw new Error('Invalid managed media filename.');
  return `${MANAGED_MEDIA_PREFIX}${fileName}`;
}

/** Convert an old container-specific URI into the stable persisted format. */
export function normalizeManagedMediaUri(uri: string): string | null {
  const fileName = managedMediaFileName(uri);
  return fileName ? managedMediaReference(fileName) : null;
}
