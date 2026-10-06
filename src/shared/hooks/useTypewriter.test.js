import { renderHook, act } from '@testing-library/react';
import useTypewriter from './useTypewriter';

describe('useTypewriter', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('reveals one letter per tick', () => {
    const { result } = renderHook(() => useTypewriter('Mind the gap', { speed: 50 }));
    expect(result.current.displayedText).toBe('');

    act(() => vi.advanceTimersByTime(50 * 4));
    expect(result.current.displayedText).toBe('Mind');

    act(() => vi.advanceTimersByTime(50 * 20));
    expect(result.current.displayedText).toBe('Mind the gap');
  });

  it('complete() shows the full text immediately', () => {
    const { result } = renderHook(() => useTypewriter('Mind the gap', { speed: 50 }));
    act(() => vi.advanceTimersByTime(50));
    act(() => result.current.complete());
    expect(result.current.displayedText).toBe('Mind the gap');
  });

  it('skipAnimation shows the full text straight away', () => {
    const { result } = renderHook(() => useTypewriter('Alright', { skipAnimation: true }));
    expect(result.current.displayedText).toBe('Alright');
  });

  it('restarts when the text changes', () => {
    const { result, rerender } = renderHook(({ text }) => useTypewriter(text, { speed: 10 }), {
      initialProps: { text: 'First' },
    });
    act(() => vi.advanceTimersByTime(100));
    expect(result.current.displayedText).toBe('First');

    rerender({ text: 'Second' });
    expect(result.current.displayedText).toBe('');
    act(() => vi.advanceTimersByTime(30));
    expect(result.current.displayedText).toBe('Sec');
  });

  it('handles empty text', () => {
    const { result } = renderHook(() => useTypewriter(''));
    expect(result.current.displayedText).toBe('');
  });
});
