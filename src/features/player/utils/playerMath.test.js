import { getGameScale, screenToGame, calculateWalkTime, getWalkDirection, getFacingDirection } from './playerMath';

const setViewport = (width, height, scale) => {
  window.innerWidth = width;
  window.innerHeight = height;
  if (scale === undefined) {
    document.documentElement.style.removeProperty('--game-scale');
  } else {
    document.documentElement.style.setProperty('--game-scale', scale);
  }
};

afterEach(() => setViewport(1024, 768));

describe('getGameScale', () => {
  it('defaults to 1 when --game-scale is not set', () => {
    setViewport(1920, 980);
    expect(getGameScale()).toBe(1);
  });

  it('reads --game-scale from the root element', () => {
    setViewport(960, 490, 0.5);
    expect(getGameScale()).toBe(0.5);
  });
});

describe('screenToGame', () => {
  it('is identity when the canvas exactly fills the window', () => {
    setViewport(1920, 980, 1);
    expect(screenToGame(100, 200)).toEqual([100, 200]);
  });

  it('divides by scale', () => {
    setViewport(960, 490, 0.5);
    expect(screenToGame(480, 245)).toEqual([960, 490]);
  });

  it('subtracts the horizontal centring offset (wide window)', () => {
    // canvas is 960 wide at 0.5 scale, centred in 1160 → 100px gutter each side
    setViewport(1160, 490, 0.5);
    expect(screenToGame(100, 0)).toEqual([0, 0]);
    expect(screenToGame(1060, 490)).toEqual([1920, 980]);
  });

  it('subtracts the vertical centring offset (tall window)', () => {
    setViewport(960, 690, 0.5);
    expect(screenToGame(0, 100)).toEqual([0, 0]);
  });
});

describe('calculateWalkTime', () => {
  it('is 4ms per pixel of Manhattan distance', () => {
    expect(calculateWalkTime(100, 50)).toBe(600);
    expect(calculateWalkTime(-100, -50)).toBe(600);
    expect(calculateWalkTime(0, 0)).toBe(0);
  });
});

describe('getWalkDirection', () => {
  it.each([
    [100, 10, 'right'],
    [-100, 10, 'left'],
    [10, 100, 'down'],
    [10, -100, 'up'],
  ])('xDiff %i, yDiff %i → %s', (x, y, dir) => {
    expect(getWalkDirection(x, y)).toBe(dir);
  });

  it('prefers vertical when distances are equal', () => {
    expect(getWalkDirection(50, 50)).toBe('down');
    expect(getWalkDirection(50, -50)).toBe('up');
  });
});

describe('getFacingDirection', () => {
  it('faces towards the target', () => {
    expect(getFacingDirection(975, 1170)).toBe('right');
    expect(getFacingDirection(1300, 1170)).toBe('left');
  });

  it('accepts px strings from scene data', () => {
    expect(getFacingDirection('975px', '1170px')).toBe('right');
    expect(getFacingDirection('1300px', '1170px')).toBe('left');
  });
});
