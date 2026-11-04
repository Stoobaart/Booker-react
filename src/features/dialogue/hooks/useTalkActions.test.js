import { act, renderHook } from '@testing-library/react';
import useTalkActions, { MS_PER_LETTER } from './useTalkActions';

const lines = [
  { character: 'frank', mood: 'regular', line: 'Another wet night.' },
  { character: 'frank', mood: 'regular', line: 'In London.' },
];

describe('useTalkActions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('is typing only while a line types out', () => {
    const { result } = renderHook(() => useTalkActions());
    act(() => result.current.setLinesAndSpeak(lines));
    expect(result.current.isTyping).toBe(true);
    act(() => {
      vi.advanceTimersByTime(lines[0].line.length * MS_PER_LETTER + 200);
    });
    expect(result.current.speech).toBe(lines[0].line);
    expect(result.current.isTyping).toBe(false);
  });

  it('stops typing when a line is skipped, and starts again for the next', () => {
    const { result } = renderHook(() => useTalkActions());
    act(() => result.current.setLinesAndSpeak(lines));
    act(() => result.current.runNextStep());
    expect(result.current.speech).toBe(lines[0].line);
    expect(result.current.isTyping).toBe(false);

    act(() => result.current.runNextStep());
    expect(result.current.isTyping).toBe(true);
    act(() => result.current.runNextStep());
    act(() => result.current.runNextStep());
    expect(result.current.showTalkOverlay).toBe(false);
    expect(result.current.isTyping).toBe(false);
  });
});
