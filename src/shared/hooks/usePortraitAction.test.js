import { act, renderHook } from '@testing-library/react';
import usePortraitAction from './usePortraitAction';

const drag = { duration: 3000, every: [5000, 9000] };

describe('usePortraitAction', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('waits a while, plays the action through, then waits again', () => {
    const { result } = renderHook(() => usePortraitAction(drag, false));
    act(() => vi.advanceTimersByTime(6999));
    expect(result.current).toBe(false);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(true);

    act(() => vi.advanceTimersByTime(3000));
    expect(result.current).toBe(false);
    act(() => vi.advanceTimersByTime(7000));
    expect(result.current).toBe(true);
  });

  it('only waits while they are quiet, starting the wait afresh after each line', () => {
    const { result, rerender } = renderHook(({ talking }) => usePortraitAction(drag, talking), {
      initialProps: { talking: false },
    });
    act(() => vi.advanceTimersByTime(6000));
    rerender({ talking: true });
    act(() => vi.advanceTimersByTime(20000));
    expect(result.current).toBe(false);

    rerender({ talking: false });
    act(() => vi.advanceTimersByTime(6999));
    expect(result.current).toBe(false);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(true);
  });

  it('plays to the end once started, even if they start talking', () => {
    const { result, rerender } = renderHook(({ talking }) => usePortraitAction(drag, talking), {
      initialProps: { talking: false },
    });
    act(() => vi.advanceTimersByTime(7000));
    rerender({ talking: true });
    act(() => vi.advanceTimersByTime(2999));
    expect(result.current).toBe(true);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(false);
  });

  it('does nothing without an action', () => {
    const { result } = renderHook(() => usePortraitAction(undefined, false));
    act(() => vi.advanceTimersByTime(60000));
    expect(result.current).toBe(false);
  });
});
