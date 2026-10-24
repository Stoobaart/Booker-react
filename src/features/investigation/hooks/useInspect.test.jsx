import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createTestStore } from '../../../test/renderWithProviders';
import useInspect from './useInspect';

const lines = [{ character: 'frank', mood: 'regular', line: 'Two mugs.' }];

const renderInspect = () => {
  const store = createTestStore();
  const setLinesAndSpeak = vi.fn();
  const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
  const { result } = renderHook(() => useInspect(setLinesAndSpeak), { wrapper });
  return { inspect: result.current, store, setLinesAndSpeak };
};

describe('useInspect', () => {
  it("says the lines and notes the note", () => {
    const { inspect, store, setLinesAndSpeak } = renderInspect();
    inspect({ lines, noteId: 'flat-kitchen-sink' });
    expect(setLinesAndSpeak).toHaveBeenCalledWith(lines);
    expect(store.getState().investigation.discoveredNoteIds).toEqual(['flat-kitchen-sink']);
  });

  it('notes it only once however often he looks', () => {
    const { inspect, store } = renderInspect();
    inspect({ lines, noteId: 'flat-kitchen-sink' });
    inspect({ lines, noteId: 'flat-kitchen-sink' });
    expect(store.getState().investigation.discoveredNoteIds).toEqual(['flat-kitchen-sink']);
  });

  it('notes it without lines, and says lines without a note', () => {
    const { inspect, store, setLinesAndSpeak } = renderInspect();
    inspect({ noteId: 'newspaper-sacked-tube-worker' });
    expect(setLinesAndSpeak).not.toHaveBeenCalled();
    inspect({ lines });
    expect(setLinesAndSpeak).toHaveBeenCalledOnce();
    expect(store.getState().investigation.discoveredNoteIds).toEqual(['newspaper-sacked-tube-worker']);
  });
});
