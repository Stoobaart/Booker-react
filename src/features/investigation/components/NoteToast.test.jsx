import { act, screen } from '@testing-library/react';
import NoteToast, { NOTE_TOAST_MS } from './NoteToast';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { discoverNote, openInvestigation } from '../slices/investigationSlice';
import { completeTutorialStep } from '../../tutorial/slices/tutorialSlice';

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

  it('stays up while the tutorial points at it, then goes a few seconds after', () => {
    vi.useFakeTimers();
    const { store } = renderWithProviders(<NoteToast />, {
      preloadedState: { tutorial: { doneStepId: 'inspect-newspaper', skipped: false } },
    });
    act(() => {
      store.dispatch(discoverNote('flat-kitchen-sink'));
    });
    act(() => {
      vi.advanceTimersByTime(NOTE_TOAST_MS * 3);
    });
    expect(screen.getByText('Note added')).toBeInTheDocument();

    act(() => {
      store.dispatch(completeTutorialStep('note-toast'));
    });
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

  it('announces new case notes, opening the notebook on their tab when clicked', () => {
    const { store } = renderWithProviders(<NoteToast />);
    act(() => {
      store.dispatch(openInvestigation('victims-flat'));
    });
    expect(screen.getByText('New case notes')).toBeInTheDocument();
    expect(screen.getByText("The victim's flat")).toBeInTheDocument();
    act(() => {
      screen.getByText('New case notes').click();
    });
    expect(store.getState().investigation).toMatchObject({
      isNotebookOpen: true,
      notebookTabId: 'victims-flat',
      newInvestigationId: null,
    });
  });

  it('shows a new note before the new case notes, then them', () => {
    vi.useFakeTimers();
    const { store } = renderWithProviders(<NoteToast />);
    act(() => {
      store.dispatch(openInvestigation('victims-flat'));
      store.dispatch(discoverNote('flat-hallway-post'));
    });
    expect(screen.getByText('Note added')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(NOTE_TOAST_MS);
    });
    expect(screen.getByText('New case notes')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(NOTE_TOAST_MS);
    });
    expect(screen.queryByRole('button')).toBeNull();
  });
});
