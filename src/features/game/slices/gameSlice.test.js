import reducer, { setCurrentScene, setPlayerPosition, setPlayerDirection, setStoryProgress, restoreGameState } from './gameSlice';

const initial = reducer(undefined, { type: '@@INIT' });

describe('gameSlice', () => {
  it('has the expected initial state', () => {
    expect(initial).toEqual({
      currentScene: null,
      playerPosition: null,
      playerDirection: null,
      storyProgress: { arrivedAtStation: false },
    });
  });

  it('sets scene, position and direction', () => {
    let state = reducer(initial, setCurrentScene('great-portland-street'));
    state = reducer(state, setPlayerPosition({ x: '100px', y: '200px' }));
    state = reducer(state, setPlayerDirection('left'));
    expect(state.currentScene).toBe('great-portland-street');
    expect(state.playerPosition).toEqual({ x: '100px', y: '200px' });
    expect(state.playerDirection).toBe('left');
  });

  it('setStoryProgress sets a flag to true, including new flags', () => {
    let state = reducer(initial, setStoryProgress('arrivedAtStation'));
    state = reducer(state, setStoryProgress('metDerek'));
    expect(state.storyProgress).toEqual({ arrivedAtStation: true, metDerek: true });
  });

  it('restoreGameState applies the saved game', () => {
    const saved = {
      currentScene: 'great-portland-street-exterior',
      playerPosition: { x: '10px', y: '20px' },
      playerDirection: 'up',
      storyProgress: { arrivedAtStation: true },
    };
    expect(reducer(initial, restoreGameState(saved))).toEqual(saved);
  });

  it('restoreGameState keeps defaults for keys missing from an old save', () => {
    const oldSave = { currentScene: 'great-portland-street', storyProgress: {} };
    const state = reducer(initial, restoreGameState(oldSave));
    expect(state.playerDirection).toBeNull();
    expect(state.storyProgress.arrivedAtStation).toBe(false);
  });

  it('restoreGameState handles a save with no storyProgress at all', () => {
    const state = reducer(initial, restoreGameState({ currentScene: 'beginnings' }));
    expect(state.storyProgress).toEqual({ arrivedAtStation: false });
  });
});
