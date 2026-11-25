import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTestStore, renderWithProviders } from '../../../../test/renderWithProviders';
import { setStoryProgress } from '../../../game/slices/gameSlice';
import Laptop, { HISTORY_NOTE_ID, PASSWORD_CLUE_FLAG } from './Laptop';

const renderLaptop = (store) => renderWithProviders(<Laptop onClose={() => {}} />, store && { store });

const knowingSam = () => {
  const store = createTestStore();
  store.dispatch(setStoryProgress(PASSWORD_CLUE_FLAG));
  return store;
};

const logIn = async (password) => {
  await userEvent.type(screen.getByLabelText('Password'), password);
  await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
};

describe('Laptop', () => {
  it("won't take a password until Frank knows the son's name", () => {
    renderLaptop();
    expect(screen.getByLabelText('Password')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeDisabled();
  });

  it('turns away a wrong password', async () => {
    const { store } = renderLaptop(knowingSam());
    await logIn('password');
    expect(screen.getByText('The password is incorrect.')).toBeInTheDocument();
    expect(store.getState().game.storyProgress.laptopUnlocked).toBe(false);
  });

  it("unlocks with the son's name, whatever the case", async () => {
    const { store } = renderLaptop(knowingSam());
    await logIn(' sam ');
    expect(store.getState().game.storyProgress.laptopUnlocked).toBe(true);
    expect(screen.getByRole('button', { name: 'Wayfarer' })).toBeInTheDocument();
  });

  it('skips the password once unlocked, and notes the browser history once, however often it is opened', async () => {
    const store = knowingSam();
    store.dispatch(setStoryProgress('laptopUnlocked'));
    renderLaptop(store);
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Wayfarer' }));
    expect(store.getState().investigation.discoveredNoteIds).not.toContain(HISTORY_NOTE_ID);

    await userEvent.click(screen.getByRole('button', { name: 'History' }));
    expect(screen.getAllByText(/Halden Group/).length).toBeGreaterThan(1);
    await userEvent.click(screen.getByRole('button', { name: 'Close history' }));
    await userEvent.click(screen.getByRole('button', { name: 'History' }));

    const ids = store.getState().investigation.discoveredNoteIds;
    expect(ids.filter((id) => id === HISTORY_NOTE_ID)).toHaveLength(1);
  });
});
