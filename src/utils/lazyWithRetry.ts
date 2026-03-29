import { lazy } from 'react';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('loading chunk') ||
    msg.includes('loading css chunk') ||
    msg.includes('dynamically imported module')
  );
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wraps a dynamic import with retry logic. On repeated failures,
 * forces a full page reload to fetch fresh chunk manifests.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    const reloadedKey = `chunk_reload_${importFn.toString().slice(0, 80)}`;
    const hasReloaded = sessionStorage.getItem(reloadedKey);

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const module = await importFn();
        sessionStorage.removeItem(reloadedKey);
        return module;
      } catch (err) {
        if (!isChunkLoadError(err)) throw err;
        if (attempt < MAX_RETRIES - 1) {
          await wait(RETRY_DELAY_MS * (attempt + 1));
        }
      }
    }

    if (!hasReloaded) {
      sessionStorage.setItem(reloadedKey, '1');
      window.location.reload();
    }

    throw new Error('Failed to load module after retries. Please refresh the page.');
  });
}

export { isChunkLoadError };
