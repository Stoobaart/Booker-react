import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useToggleSound } from './useToggleSound';

describe('useToggleSound', () => {
  let play;

  beforeEach(() => {
    vi.useFakeTimers();
    play = vi.spyOn(window.HTMLMediaElement.prototype, 'play');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('stays quiet on mount', () => {
    renderHook(() => useToggleSound(true, 'sound.wav'));
    expect(play).not.toHaveBeenCalled();
  });

  it('plays straight away each time it flips', () => {
    const { rerender } = renderHook(({ on }) => useToggleSound(on, 'sound.wav'), { initialProps: { on: false } });
    rerender({ on: true });
    expect(play).toHaveBeenCalledTimes(1);
    rerender({ on: false });
    expect(play).toHaveBeenCalledTimes(2);
  });

  it('waits the delay for each direction', () => {
    const { rerender } = renderHook(
      ({ on }) => useToggleSound(on, 'sound.wav', { openDelayMs: 750, closeDelayMs: 250 }),
      { initialProps: { on: false } },
    );
    rerender({ on: true });
    vi.advanceTimersByTime(749);
    expect(play).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(play).toHaveBeenCalledTimes(1);

    rerender({ on: false });
    vi.advanceTimersByTime(250);
    expect(play).toHaveBeenCalledTimes(2);
  });

  it('drops a pending sound when it flips back first', () => {
    const { rerender } = renderHook(
      ({ on }) => useToggleSound(on, 'sound.wav', { openDelayMs: 750, closeDelayMs: 250 }),
      { initialProps: { on: false } },
    );
    rerender({ on: true });
    vi.advanceTimersByTime(100);
    rerender({ on: false });
    vi.advanceTimersByTime(1000);
    expect(play).toHaveBeenCalledTimes(1);
  });
});
