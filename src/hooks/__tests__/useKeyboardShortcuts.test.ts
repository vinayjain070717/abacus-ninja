import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  it('starts with help closed', () => {
    const { result } = renderHook(() => useKeyboardShortcuts());
    expect(result.current.showHelp).toBe(false);
  });

  it('opens help on ? key', () => {
    const { result } = renderHook(() => useKeyboardShortcuts());
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
    });
    expect(result.current.showHelp).toBe(true);
  });

  it('closes help on Escape', () => {
    const { result } = renderHook(() => useKeyboardShortcuts());
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
    });
    expect(result.current.showHelp).toBe(true);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(result.current.showHelp).toBe(false);
  });
});
