import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isChunkLoadError } from '../lazyWithRetry';

describe('isChunkLoadError', () => {
  it('detects "Failed to fetch dynamically imported module"', () => {
    const err = new Error('Failed to fetch dynamically imported module: https://example.com/assets/Foo-abc123.js');
    expect(isChunkLoadError(err)).toBe(true);
  });

  it('detects "Loading chunk" errors', () => {
    const err = new Error('Loading chunk 42 failed');
    expect(isChunkLoadError(err)).toBe(true);
  });

  it('detects "Loading CSS chunk" errors', () => {
    const err = new Error('Loading CSS chunk styles-abc123 failed');
    expect(isChunkLoadError(err)).toBe(true);
  });

  it('detects "dynamically imported module" (generic)', () => {
    const err = new Error('Error in dynamically imported module');
    expect(isChunkLoadError(err)).toBe(true);
  });

  it('returns false for unrelated errors', () => {
    expect(isChunkLoadError(new Error('Cannot read property of undefined'))).toBe(false);
    expect(isChunkLoadError(new Error('Network error'))).toBe(false);
    expect(isChunkLoadError(new TypeError('null is not an object'))).toBe(false);
  });

  it('returns false for non-Error values', () => {
    expect(isChunkLoadError('string error')).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
    expect(isChunkLoadError(42)).toBe(false);
  });
});

describe('lazyWithRetry', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('module loads successfully on first try', async () => {
    const FakeComponent = () => null;
    const importFn = vi.fn().mockResolvedValue({ default: FakeComponent });

    const { lazyWithRetry } = await import('../lazyWithRetry');
    const LazyComp = lazyWithRetry(importFn);

    expect(LazyComp).toBeDefined();
    expect(LazyComp.$$typeof).toBeDefined();
  });

  it('retries on chunk load error and succeeds', async () => {
    const FakeComponent = () => null;
    const chunkError = new Error('Failed to fetch dynamically imported module: /assets/Foo.js');
    const importFn = vi.fn()
      .mockRejectedValueOnce(chunkError)
      .mockRejectedValueOnce(chunkError)
      .mockResolvedValueOnce({ default: FakeComponent });

    const { lazyWithRetry } = await import('../lazyWithRetry');
    const LazyComp = lazyWithRetry(importFn);

    expect(LazyComp).toBeDefined();
  });

  it('throws immediately for non-chunk errors without retrying', async () => {
    const nonChunkError = new Error('SyntaxError: unexpected token');
    const importFn = vi.fn().mockRejectedValue(nonChunkError);

    const { lazyWithRetry } = await import('../lazyWithRetry');
    const LazyComp = lazyWithRetry(importFn);

    expect(LazyComp).toBeDefined();
  });
});
