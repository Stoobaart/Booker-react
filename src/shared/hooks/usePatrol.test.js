import { act, renderHook } from '@testing-library/react';
import usePatrol from './usePatrol';

const patrol = {
  interval: 10000,
  spots: [
    { x: '100px', y: '700px', face: 'right' },
    { x: '300px', y: '700px', face: 'left' },
  ],
};

describe('usePatrol', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does nothing without a patrol', () => {
    const { result } = renderHook(() => usePatrol(undefined, false));
    expect(result.current).toBeNull();
  });

  it('stands at the first spot, facing its way, until the interval is up', () => {
    const { result } = renderHook(() => usePatrol(patrol, false));
    expect(result.current).toMatchObject({ position: { x: '100px', y: '700px' }, facing: 'right', walking: false });

    act(() => vi.advanceTimersByTime(9999));
    expect(result.current.walking).toBe(false);
  });

  it('then walks to the next spot, facing the way it walks, and stands there', () => {
    const { result } = renderHook(() => usePatrol(patrol, false));
    act(() => vi.advanceTimersByTime(10000));
    expect(result.current).toMatchObject({ position: { x: '300px', y: '700px' }, facing: 'right', walking: true });
    expect(result.current.legMs).toBeGreaterThan(0);

    act(() => vi.advanceTimersByTime(result.current.legMs));
    expect(result.current).toMatchObject({ position: { x: '300px', y: '700px' }, facing: 'left', walking: false });
    expect(result.current.spot).toBe(patrol.spots[1]);
  });

  it('goes back to the first spot after the second', () => {
    const { result } = renderHook(() => usePatrol(patrol, false));
    act(() => vi.advanceTimersByTime(10000));
    act(() => vi.advanceTimersByTime(result.current.legMs));
    act(() => vi.advanceTimersByTime(10000));
    expect(result.current).toMatchObject({ position: { x: '100px', y: '700px' }, facing: 'left', walking: true });
  });

  it('walks round an obstacle in its way', () => {
    const blocked = { ...patrol, obstacles: [{ left: 180, right: 220, top: 650, bottom: 750 }] };
    const { result } = renderHook(() => usePatrol(blocked, false));
    act(() => vi.advanceTimersByTime(10000));
    expect(result.current.position).not.toEqual({ x: '300px', y: '700px' });
  });

  it('stays put while held, and waits a full interval once let go', () => {
    const { result, rerender } = renderHook(({ held }) => usePatrol(patrol, held), { initialProps: { held: false } });
    act(() => vi.advanceTimersByTime(8000));
    rerender({ held: true });
    act(() => vi.advanceTimersByTime(30000));
    expect(result.current).toMatchObject({ position: { x: '100px', y: '700px' }, walking: false });

    rerender({ held: false });
    act(() => vi.advanceTimersByTime(9999));
    expect(result.current.walking).toBe(false);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.walking).toBe(true);
  });

  it('finishes a walk it is on when held, then stays at that spot', () => {
    const { result, rerender } = renderHook(({ held }) => usePatrol(patrol, held), { initialProps: { held: false } });
    act(() => vi.advanceTimersByTime(10000));
    rerender({ held: true });
    act(() => vi.advanceTimersByTime(result.current.legMs));
    act(() => vi.advanceTimersByTime(30000));
    expect(result.current).toMatchObject({ position: { x: '300px', y: '700px' }, walking: false });
  });
});
