import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Notebook from './Notebook';
import NotebookButton from './NotebookButton';
import { renderWithProviders } from '../../../test/renderWithProviders';

const withNotes = (ids, isNotebookOpen = true, more = {}, currentScene = null) => ({
  preloadedState: {
    investigation: { discoveredNoteIds: ids, isNotebookOpen, newNoteId: null, ...more },
    game: { currentScene, storyProgress: {} },
  },
});

describe('Notebook', () => {
  it('is shut until the Notebook button opens it', async () => {
    renderWithProviders(<><NotebookButton /><Notebook /></>, withNotes([], false));
    expect(screen.queryByRole('dialog')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Notebook' }));
    expect(screen.getByRole('dialog', { name: 'Notebook' })).toBeInTheDocument();
  });

  it("has a tab per investigation opened and a General one, saying when there's nothing noted", () => {
    renderWithProviders(<Notebook />, withNotes([]));
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Great Portland St', 'General']);
    expect(screen.getByText('Nothing noted down yet')).toBeInTheDocument();
  });

  it("shows an investigation's notes under their rooms", () => {
    renderWithProviders(<Notebook />, withNotes(['flat-kitchen-sink', 'flat-hallway-post'], true, {}, 'victims-flat-kitchen'));
    const page = screen.getByRole('tabpanel');
    expect([...page.querySelectorAll('h3')].map((h) => h.textContent)).toEqual(['Hallway', 'Kitchen']);
    expect(screen.getByText('Two mugs')).toBeInTheDocument();
    expect(screen.getByText(/none of it opened/)).toBeInTheDocument();
  });

  it("opens on the tab for the scene Frank is in, and switches tabs", async () => {
    renderWithProviders(<Notebook />, withNotes(['flat-kitchen-sink'], true, {}, 'victims-flat-kitchen'));
    expect(screen.getByRole('tab', { name: "The victim's flat" })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Two mugs')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Great Portland St' }));
    expect(screen.getByText('Nothing noted down yet')).toBeInTheDocument();
  });

  it('opens on Great Portland St in the station', () => {
    renderWithProviders(<Notebook />, withNotes(['flat-kitchen-sink'], true, {}, 'great-portland-street-ticket-hall'));
    expect(screen.getByRole('tab', { name: 'Great Portland St' })).toHaveAttribute('aria-selected', 'true');
  });

  it('opens on General outside, even with notes elsewhere', () => {
    renderWithProviders(<Notebook />, withNotes(['flat-kitchen-sink', 'derek-station-worker'], true, {}, 'residential-street'));
    expect(screen.getByRole('tab', { name: 'General' })).toHaveAttribute('aria-selected', 'true');
  });

  it('opens on the tab asked for, even with nothing in it yet', () => {
    renderWithProviders(<Notebook />, withNotes(['derek-station-worker'], true, {
      openedInvestigationIds: ['great-portland-street', 'victims-flat'],
      notebookTabId: 'victims-flat',
    }));
    expect(screen.getByRole('tab', { name: "The victim's flat" })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Nothing noted down yet')).toBeInTheDocument();
  });

  it('closes with its X', async () => {
    const { store } = renderWithProviders(<Notebook />, withNotes([]));
    await userEvent.click(screen.getByRole('button', { name: 'X' }));
    expect(store.getState().investigation.isNotebookOpen).toBe(false);
  });

  it("doesn't touch the inventory", async () => {
    const { store } = renderWithProviders(<><NotebookButton /><Notebook /></>, withNotes(['flat-kitchen-sink'], false));
    await userEvent.click(screen.getByRole('button', { name: 'Notebook' }));
    expect(store.getState().inventory).toEqual({ items: [], isOpen: false });
  });
});
