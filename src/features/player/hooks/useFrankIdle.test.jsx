import { act, render } from '@testing-library/react';
import useFrankIdle, { IDLE_ACTIONS, IDLE_DELAY } from './useFrankIdle';

const Sprite = ({ initialClass = 'standing left' }) => {
  useFrankIdle();
  return <img id="player-sprite" className={initialClass} />;
};

const getSprite = () => document.getElementById('player-sprite');

// MutationObserver callbacks are microtasks, so let them run before moving the clock
const setSpriteClass = async (className) => {
  await act(async () => {
    getSprite().className = className;
  });
};

const advance = (ms) => act(() => vi.advanceTimersByTime(ms));

describe('useFrankIdle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // random 0 -> shortest wait and the first action (notepad)
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.querySelectorAll('.npc-dialogue').forEach((el) => el.remove());
  });

  it('turns Frank to the camera for an idle action after he has stood still, then back to standing', async () => {
    render(<Sprite />);

    advance(IDLE_DELAY[0] - 1);
    expect(getSprite()).toHaveClass('standing', 'left');

    advance(1);
    expect(getSprite().className).toBe('idle notepad down');

    await act(async () => {});
    advance(IDLE_ACTIONS[0].duration);
    expect(getSprite().className).toBe('standing down');
  });

  it('keeps fidgeting while he stays put', async () => {
    render(<Sprite />);
    advance(IDLE_DELAY[0]);
    await act(async () => {});
    advance(IDLE_ACTIONS[0].duration);
    await act(async () => {});

    advance(IDLE_DELAY[0]);
    expect(getSprite().className).toBe('idle notepad down');
  });

  it('picks between the actions at random', () => {
    Math.random.mockReturnValue(0.999);
    render(<Sprite />);
    advance(IDLE_DELAY[1]);
    expect(getSprite().className).toBe('idle ear down');
  });

  it('does nothing while Frank is walking, and starts waiting once he stops', async () => {
    render(<Sprite initialClass="walk left" />);
    advance(IDLE_DELAY[1]);
    expect(getSprite().className).toBe('walk left');

    await setSpriteClass('standing left');
    advance(IDLE_DELAY[0]);
    expect(getSprite().className).toBe('idle notepad down');
  });

  it('restarts the wait when Frank walks off before it runs out', async () => {
    render(<Sprite />);
    advance(IDLE_DELAY[0] - 1000);

    await setSpriteClass('walk right');
    await setSpriteClass('standing right');
    advance(IDLE_DELAY[0] - 1);
    expect(getSprite().className).toBe('standing right');
    advance(1);
    expect(getSprite().className).toBe('idle notepad down');
  });

  it('leaves the walk alone when Frank sets off mid-action', async () => {
    render(<Sprite />);
    advance(IDLE_DELAY[0]);
    await act(async () => {});

    await setSpriteClass('walk right');
    advance(IDLE_ACTIONS[0].duration);
    expect(getSprite().className).toBe('walk right');
  });

  it('waits while a conversation is open', async () => {
    render(<Sprite initialClass="standing right" />);
    const dialogue = document.createElement('div');
    dialogue.className = 'npc-dialogue';
    document.body.appendChild(dialogue);

    advance(IDLE_DELAY[0]);
    expect(getSprite().className).toBe('standing right');

    dialogue.remove();
    advance(IDLE_DELAY[0]);
    expect(getSprite().className).toBe('idle notepad down');
  });

  it('stops when Frank leaves the scene', () => {
    const { unmount } = render(<Sprite />);
    const sprite = getSprite();
    unmount();
    advance(IDLE_DELAY[1]);
    expect(sprite.className).toBe('standing left');
  });
});
