import { act, renderHook } from '@testing-library/react';
import useBlink, { BLINK_MS, MAX_OPEN_MS, MIN_OPEN_MS } from './useBlink';

describe('useBlink', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('keeps the eyes open for a few seconds, shuts them for a moment, then opens them again', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const open = MIN_OPEN_MS + 0.5 * (MAX_OPEN_MS - MIN_OPEN_MS);
    const { result } = renderHook(() => useBlink());
    expect(result.current).toBe(false);

    act(() => vi.advanceTimersByTime(open - 1));
    expect(result.current).toBe(false);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(true);

    act(() => vi.advanceTimersByTime(BLINK_MS));
    expect(result.current).toBe(false);
    act(() => vi.advanceTimersByTime(open));
    expect(result.current).toBe(true);
  });

  it('waits a different time between blinks', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(1);
    const { result } = renderHook(() => useBlink());

    act(() => vi.advanceTimersByTime(MIN_OPEN_MS));
    expect(result.current).toBe(true);
    act(() => vi.advanceTimersByTime(BLINK_MS));
    expect(result.current).toBe(false);
    act(() => vi.advanceTimersByTime(MIN_OPEN_MS));
    expect(result.current).toBe(false);
    act(() => vi.advanceTimersByTime(MAX_OPEN_MS - MIN_OPEN_MS));
    expect(result.current).toBe(true);
  });
});
