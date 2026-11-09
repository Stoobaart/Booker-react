import { act, renderHook } from '@testing-library/react';
import usePhotoShoot, { PAUSE_BEFORE_PHOTOS } from './usePhotoShoot';

const table = { x: '1px', y: '1px' };
const shelf = { x: '2px', y: '2px' };
const spot = { subjects: [table, shelf] };
const SHOT = 2000;

describe('usePhotoShoot', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('pauses after arriving, then photographs each subject in turn, then stops', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9);
    const { result } = renderHook(() => usePhotoShoot(spot, true, SHOT));
    expect(result.current.subject).toBeNull();

    act(() => vi.advanceTimersByTime(PAUSE_BEFORE_PHOTOS));
    expect(result.current).toEqual({ shot: 0, subject: table });
    act(() => vi.advanceTimersByTime(SHOT));
    expect(result.current).toEqual({ shot: 1, subject: shelf });
    act(() => vi.advanceTimersByTime(SHOT));
    expect(result.current.subject).toBeNull();

    act(() => vi.advanceTimersByTime(60000));
    expect(result.current.subject).toBeNull();
  });

  it('sometimes takes just one photo', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const { result } = renderHook(() => usePhotoShoot(spot, true, SHOT));
    act(() => vi.advanceTimersByTime(PAUSE_BEFORE_PHOTOS + SHOT));
    expect(result.current.subject).toBeNull();
  });

  it('stops at once, and starts again from the pause, when it stops standing', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9);
    const { result, rerender } = renderHook(({ standing }) => usePhotoShoot(spot, standing, SHOT), {
      initialProps: { standing: true },
    });
    act(() => vi.advanceTimersByTime(PAUSE_BEFORE_PHOTOS));
    rerender({ standing: false });
    expect(result.current.subject).toBeNull();

    rerender({ standing: true });
    act(() => vi.advanceTimersByTime(PAUSE_BEFORE_PHOTOS - 1));
    expect(result.current.subject).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.subject).toBe(table);
  });

  it('takes no photos at a spot with nothing to photograph', () => {
    const { result } = renderHook(() => usePhotoShoot({}, true, SHOT));
    act(() => vi.advanceTimersByTime(60000));
    expect(result.current.subject).toBeNull();
  });
});
