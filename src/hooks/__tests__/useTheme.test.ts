import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../useTheme';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('useTheme', () => {
  beforeEach(() => {
    document.documentElement.className = '';
    mockMatchMedia(false);
  });

  it('defaults to the provided initial theme', () => {
    const { result } = renderHook(() => useTheme('dark'));
    expect(result.current.theme).toBe('dark');
  });

  it('cycles through themes', () => {
    const { result } = renderHook(() => useTheme('dark'));
    act(() => result.current.cycle());
    expect(result.current.theme).toBe('light');
    act(() => result.current.cycle());
    expect(result.current.theme).toBe('system');
    act(() => result.current.cycle());
    expect(result.current.theme).toBe('dark');
  });

  it('applies dark class for dark theme', () => {
    renderHook(() => useTheme('dark'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
