import { act, screen } from '@testing-library/react';
import NoteToast, { NOTE_TOAST_MS } from './NoteToast';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { discoverNote } from '../slices/investigationSlice';

describe('NoteToast', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows nothing until a note is found', () => {
    renderWithProviders(<NoteToast />);
    expect(screen.queryByText('Note added')).toBeNull();
  });

  it('announces a new note, then goes after a few seconds', () => {
    vi.useFakeTimers();
    const { store } = renderWithProviders(<NoteToast />);
    act(() => {
      store.dispatch(discoverNote('flat-kitchen-sink'));
    });
    expect(screen.getByText('Note added')).toBeInTheDocument();
    expect(screen.getByText('Two mugs')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(NOTE_TOAST_MS);
    });
    expect(screen.queryByText('Note added')).toBeNull();
  });

  it("doesn't announce a note found again", () => {
    vi.useFakeTimers();
    const { store } = renderWithProviders(<NoteToast />);
    act(() => {
      store.dispatch(discoverNote('flat-kitchen-sink'));
    });
    act(() => {
      vi.advanceTimersByTime(NOTE_TOAST_MS);
    });
    act(() => {
      store.dispatch(discoverNote('flat-kitchen-sink'));
    });
    expect(screen.queryByText('Note added')).toBeNull();
  });

  it('opens the notebook when clicked', () => {
    const { store } = renderWithProviders(<NoteToast />);
    act(() => {
      store.dispatch(discoverNote('flat-kitchen-sink'));
    });
    act(() => {
      screen.getByText('Note added').click();
    });
    expect(store.getState().investigation).toMatchObject({ isNotebookOpen: true, newNoteId: null });
  });
});
