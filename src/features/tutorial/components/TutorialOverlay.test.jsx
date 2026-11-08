import { act, fireEvent, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TutorialOverlay from './TutorialOverlay';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { setCurrentScene } from '../../game/slices/gameSlice';
import { openNotebook } from '../../investigation/slices/investigationSlice';

const onPlatform = (tutorial = {}) => ({
  game: { currentScene: 'great-portland-street', playerPosition: null, playerDirection: null, storyProgress: { arrivedAtStation: true } },
  tutorial: { doneStepId: null, skipped: false, ...tutorial },
});

const renderOverlay = (preloadedState, path = '/great-portland-street') =>
  renderWithProviders(
    <MemoryRouter initialEntries={[path]}>
      <TutorialOverlay />
    </MemoryRouter>,
    { preloadedState },
  );

const tip = () => screen.queryByRole('dialog', { name: 'Tutorial' });

describe('TutorialOverlay', () => {
  afterEach(() => {
    document.body.querySelectorAll('.talk-overlay').forEach((el) => el.remove());
  });

  it('welcomes the player, typing the tip out; Next finishes it, then moves on', () => {
    const { store } = renderOverlay(onPlatform());
    expect(tip()).toHaveTextContent('Tutorial 1/');
    expect(tip()).toHaveTextContent("London, 1996. You're Frank.");

    fireEvent.click(screen.getByRole('button', { name: 'Next ▸' }));
    expect(store.getState().tutorial.doneStepId).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Next ▸' }));
    expect(store.getState().tutorial.doneStepId).toBe('welcome');
  });

  it('asks before skipping', () => {
    const { store } = renderOverlay(onPlatform());
    fireEvent.click(screen.getByRole('button', { name: 'Skip tutorial' }));
    fireEvent.click(screen.getByRole('button', { name: 'No' }));
    expect(store.getState().tutorial.skipped).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Skip tutorial' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    expect(store.getState().tutorial.skipped).toBe(true);
    expect(tip()).toBeNull();
  });

  it('keeps out of the way while Frank is speaking', () => {
    const talk = document.createElement('div');
    talk.className = 'talk-overlay';
    document.body.appendChild(talk);
    renderOverlay(onPlatform());
    expect(tip()).toBeNull();
  });

  it('shows only in the scene its step belongs to, and not on the title screen', () => {
    const { store, unmount } = renderOverlay(onPlatform());
    act(() => {
      store.dispatch(setCurrentScene('great-portland-street-ticket-hall'));
    });
    expect(tip()).toBeNull();
    unmount();

    renderOverlay(onPlatform(), '/');
    expect(tip()).toBeNull();
  });

  it('completes a step once what it waits for happens', () => {
    const { store } = renderOverlay(onPlatform({ doneStepId: 'inspect-newspaper' }));
    act(() => {
      store.dispatch(openNotebook());
    });
    expect(store.getState().tutorial.doneStepId).toBe('note-toast');
  });

  it("records a step a lasting fact has passed, so it isn't asked again", () => {
    const { store } = renderOverlay({
      ...onPlatform(),
      investigation: { discoveredNoteIds: ['newspaper-sacked-tube-worker'] },
    });
    expect(store.getState().tutorial.doneStepId).toBe('inspect-newspaper');
  });

  it('shows nothing once skipped', () => {
    renderOverlay(onPlatform({ skipped: true }));
    expect(tip()).toBeNull();
  });
});
