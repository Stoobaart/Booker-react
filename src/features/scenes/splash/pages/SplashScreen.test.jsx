import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SplashScreen from './SplashScreen';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { saveGame, loadGame } from '../../../../shared/utils/saveGame';

const savedGame = {
  game: {
    currentScene: 'great-portland-street',
    playerPosition: { x: '100px', y: '200px' },
    playerDirection: 'left',
    storyProgress: { arrivedAtStation: true },
  },
  inventory: { items: [{ id: 'banana-1', name: 'Banana', quantity: 1 }] },
  npc: { conversations: { 'station-worker': [{ role: 'user', content: 'Hi Derek' }] } },
};

const renderSplash = () => {
  // Mirrors store.js, which preloads the save on app start
  const preloadedState = loadGame();
  return renderWithProviders(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/great-portland-street" element={<p>Underground</p>} />
      </Routes>
    </MemoryRouter>,
    { preloadedState: preloadedState ?? undefined }
  );
};

const reachStartScreen = async (container) => {
  await userEvent.click(screen.getByRole('button', { name: 'CONTINUE' }));
  await userEvent.click(container.querySelector('.logo_overlay'));
};

describe('SplashScreen', () => {
  it('offers New Game when there is no save', async () => {
    const { container } = renderSplash();
    await reachStartScreen(container);
    expect(screen.getByRole('button', { name: 'New Game' })).toBeInTheDocument();
  });

  describe('Continue', () => {
    beforeEach(() => saveGame(savedGame));

    it('restores the saved inventory without duplicating items', async () => {
      const { container, store } = renderSplash();
      await reachStartScreen(container);
      await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

      expect(store.getState().inventory.items).toEqual(savedGame.inventory.items);
    });

    it('restores story progress and NPC conversations, then enters the saved scene', async () => {
      const { container, store } = renderSplash();
      await reachStartScreen(container);
      await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

      expect(store.getState().game.storyProgress.arrivedAtStation).toBe(true);
      expect(store.getState().npc.conversations).toEqual(savedGame.npc.conversations);
      expect(await screen.findByText('Underground')).toBeInTheDocument();
    });
  });
});
