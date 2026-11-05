import { StrictMode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createTestStore } from '../../../test/renderWithProviders';
import { discoverNote } from '../../investigation/slices/investigationSlice';
import { chatClosed, chatOpened } from '../slices/dialogueSlice';
import { closeBoard, openBoard } from '../../deduction/slices/deductionSlice';
import useFrankNudges from './useFrankNudges';

const BOARD_LINE = "I should pin what I've found on my deductions board.";

const renderNudges = ({ showTalkOverlay = false, preloadedState } = {}) => {
  const store = createTestStore(preloadedState);
  const setLinesAndSpeak = vi.fn();
  const wrapper = ({ children }) => (
    <StrictMode>
      <Provider store={store}>{children}</Provider>
    </StrictMode>
  );
  const view = renderHook((props) => useFrankNudges({ setLinesAndSpeak, ...props }), {
    wrapper,
    initialProps: { showTalkOverlay },
  });
  return { ...view, store, setLinesAndSpeak };
};

const said = (setLinesAndSpeak) => setLinesAndSpeak.mock.calls.map(([lines]) => lines[0].line);

describe('useFrankNudges', () => {
  it('says the board nudge once, even when effects run twice', () => {
    const { store, setLinesAndSpeak } = renderNudges();
    act(() => {
      store.dispatch(discoverNote('newspaper-sacked-tube-worker'));
      store.dispatch(discoverNote('derek-station-worker'));
    });
    expect(said(setLinesAndSpeak)).toEqual([BOARD_LINE]);
    expect(store.getState().game.storyProgress.boardNudged).toBe(true);
  });

  it('waits until Frank has stopped talking and no chat is open', () => {
    const { store, setLinesAndSpeak, rerender } = renderNudges({ showTalkOverlay: true });
    act(() => {
      store.dispatch(chatOpened());
      store.dispatch(discoverNote('newspaper-sacked-tube-worker'));
      store.dispatch(discoverNote('derek-station-worker'));
    });
    rerender({ showTalkOverlay: false });
    expect(setLinesAndSpeak).not.toHaveBeenCalled();
    act(() => store.dispatch(chatClosed()));
    expect(said(setLinesAndSpeak)).toEqual([BOARD_LINE]);
  });

  it('waits for the board to close before pointing at it', () => {
    const { store, setLinesAndSpeak } = renderNudges();
    act(() => {
      store.dispatch(openBoard());
      store.dispatch(discoverNote('newspaper-sacked-tube-worker'));
      store.dispatch(discoverNote('derek-station-worker'));
    });
    expect(setLinesAndSpeak).not.toHaveBeenCalled();
    act(() => store.dispatch(closeBoard()));
    expect(said(setLinesAndSpeak)).toEqual([BOARD_LINE]);
  });

  it('says to ask Derek straight away, over the open board', () => {
    const { store, setLinesAndSpeak } = renderNudges({
      preloadedState: {
        game: { currentScene: null, playerPosition: null, playerDirection: null, storyProgress: { boardNudged: true } },
        deduction: { boards: {}, madeDeductionIds: ['derek-knew-sacked-worker'], isBoardOpen: true },
      },
    });
    expect(said(setLinesAndSpeak)).toEqual(['I should ask Derek about that.']);
    expect(store.getState().deduction.isBoardOpen).toBe(true);
  });
});
