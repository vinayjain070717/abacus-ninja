import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimer } from '../useTimer';

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts at 0 seconds and not running', () => {
    const { result } = renderHook(() => useTimer());
    expect(result.current.seconds).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });

  it('increments seconds after start', () => {
    const { result } = renderHook(() => useTimer());
    act(() => result.current.start());
    expect(result.current.isRunning).toBe(true);

    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.seconds).toBe(3);
  });

  it('pause stops incrementing', () => {
    const { result } = renderHook(() => useTimer());
    act(() => result.current.start());
    act(() => { vi.advanceTimersByTime(2000); });
    expect(result.current.seconds).toBe(2);

    act(() => result.current.pause());
    expect(result.current.isRunning).toBe(false);
    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.seconds).toBe(2);
  });

  it('reset stops and sets to 0', () => {
    const { result } = renderHook(() => useTimer());
    act(() => result.current.start());
    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.seconds).toBe(5);

    act(() => result.current.reset());
    expect(result.current.seconds).toBe(0);
    expect(result.current.isRunning).toBe(false);
  });

  it('double start does not create duplicate intervals', () => {
    const { result } = renderHook(() => useTimer());
    act(() => result.current.start());
    act(() => result.current.start());
    act(() => { vi.advanceTimersByTime(2000); });
    expect(result.current.seconds).toBe(2);
  });

  it('getTime returns current seconds', () => {
    const { result } = renderHook(() => useTimer());
    act(() => result.current.start());
    act(() => { vi.advanceTimersByTime(4000); });
    expect(result.current.getTime()).toBe(4);
  });
});
