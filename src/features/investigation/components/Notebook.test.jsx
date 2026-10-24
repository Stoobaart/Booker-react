import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Notebook from './Notebook';
import NotebookButton from './NotebookButton';
import { renderWithProviders } from '../../../test/renderWithProviders';

const withNotes = (ids, isNotebookOpen = true) => ({
  preloadedState: { investigation: { discoveredNoteIds: ids, isNotebookOpen, newNoteId: null } },
});

describe('Notebook', () => {
  it('is shut until the Notebook button opens it', async () => {
    renderWithProviders(<><NotebookButton /><Notebook /></>, withNotes([], false));
    expect(screen.queryByRole('dialog')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Notebook' }));
    expect(screen.getByRole('dialog', { name: 'Notebook' })).toBeInTheDocument();
  });

  it("has a tab per investigation and a General one, saying when there's nothing noted", () => {
    renderWithProviders(<Notebook />, withNotes([]));
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(["The victim's flat", 'General']);
    expect(screen.getByText('Nothing noted down yet')).toBeInTheDocument();
  });

  it("shows an investigation's notes under their rooms", () => {
    renderWithProviders(<Notebook />, withNotes(['flat-kitchen-sink', 'flat-hallway-post']));
    const page = screen.getByRole('tabpanel');
    expect([...page.querySelectorAll('h3')].map((h) => h.textContent)).toEqual(['Hallway', 'Kitchen']);
    expect(screen.getByText('Two mugs')).toBeInTheDocument();
    expect(screen.getByText(/none of it opened/)).toBeInTheDocument();
  });

  it('opens on the first tab with anything in it, and switches tabs', async () => {
    renderWithProviders(<Notebook />, withNotes(['newspaper-sacked-tube-worker']));
    expect(screen.getByRole('tab', { name: 'General' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Sacked Tube worker')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: "The victim's flat" }));
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
