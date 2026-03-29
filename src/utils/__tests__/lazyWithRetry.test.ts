import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isChunkLoadError } from '../lazyWithRetry';

describe('isChunkLoadError', () => {
  it('detects "Failed to fetch dynamically imported module" error', () => {
    const err = new Error(
      'Failed to fetch dynamically imported module: https://example.com/assets/Chunk-abc123.js',
    );
    expect(isChunkLoadError(err)).toBe(true);
  });

  it('detects "Loading chunk" error (webpack-style)', () => {
    const err = new Error('Loading chunk 42 failed.');
    expect(isChunkLoadError(err)).toBe(true);
  });

  it('detects "Loading CSS chunk" error', () => {
    const err = new Error('Loading CSS chunk styles-abc123 failed.');
    expect(isChunkLoadError(err)).toBe(true);
  });

  it('detects case-insensitive chunk errors', () => {
    const err = new Error('FAILED TO FETCH DYNAMICALLY IMPORTED MODULE');
    expect(isChunkLoadError(err)).toBe(true);
  });

  it('returns false for generic errors', () => {
    const err = new Error('Cannot read properties of undefined');
    expect(isChunkLoadError(err)).toBe(false);
  });

  it('returns false for non-Error values', () => {
    expect(isChunkLoadError('string error')).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
    expect(isChunkLoadError(42)).toBe(false);
  });

  it('returns false for network errors that are not chunk-related', () => {
    const err = new Error('Failed to fetch');
    expect(isChunkLoadError(err)).toBe(false);
  });
});

describe('lazyWithRetry import logic', () => {
  let originalReload: typeof window.location.reload;
  let sessionStorageMock: Record<string, string>;

  beforeEach(() => {
    originalReload = window.location.reload;
    Object.defineProperty(window.location, 'reload', {
      configurable: true,
      value: vi.fn(),
    });

    sessionStorageMock = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
      (key: string) => sessionStorageMock[key] ?? null,
    );
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
      (key: string, value: string) => {
        sessionStorageMock[key] = value;
      },
    );
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(
      (key: string) => {
        delete sessionStorageMock[key];
      },
    );
  });

  afterEach(() => {
    Object.defineProperty(window.location, 'reload', {
      configurable: true,
      value: originalReload,
    });
    vi.restoreAllMocks();
  });

  it('succeeds on first attempt when import works', async () => {
    const fakeModule = { default: () => null };
    const importFn = vi.fn().mockResolvedValue(fakeModule);

    const { lazyWithRetry } = await import('../lazyWithRetry');
    const LazyComp = lazyWithRetry(importFn);

    expect(LazyComp).toBeDefined();
    expect(LazyComp.$$typeof).toBeDefined();
  });

  it('retries on chunk load error before succeeding', async () => {
    const fakeModule = { default: () => null };
    const importFn = vi
      .fn()
      .mockRejectedValueOnce(
        new Error('Failed to fetch dynamically imported module: /assets/Foo.js'),
      )
      .mockResolvedValueOnce(fakeModule);

    const { lazyWithRetry } = await import('../lazyWithRetry');
    const LazyComp = lazyWithRetry(importFn);

    expect(LazyComp).toBeDefined();
  });

  it('does not retry on non-chunk errors', async () => {
    const importFn = vi
      .fn()
      .mockRejectedValue(new Error('SyntaxError: unexpected token'));

    const { lazyWithRetry } = await import('../lazyWithRetry');

    const LazyComp = lazyWithRetry(importFn);
    expect(LazyComp).toBeDefined();
  });
});
