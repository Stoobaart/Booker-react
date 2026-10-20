import { getGameScale, screenToGame, setCameraX, getCameraX, followCamera, calculateWalkTime, getWalkDirection, getFacingDirection, getDepthScale, segmentHitsRect, moveOutOfObstacles, planPath, PLAYER_CLEARANCE } from './playerMath';

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

  it('adds how far a side-scrolling scene has panned', () => {
    setViewport(960, 490, 0.5);
    setCameraX(3000);
    expect(screenToGame(480, 245)).toEqual([3960, 490]);
    setCameraX(0);
  });
});

describe('camera', () => {
  afterEach(() => setCameraX(0));

  it('starts unpanned', () => {
    expect(getCameraX()).toBe(0);
  });

  it('keeps Frank in the middle of the screen', () => {
    expect(followCamera(3000, 5760)).toBe(2040);
  });

  it("doesn't pan past the start of the scene", () => {
    expect(followCamera(400, 5760)).toBe(0);
  });

  it("doesn't pan past the end of the scene", () => {
    expect(followCamera(5600, 5760)).toBe(3840);
  });

  it('stays still in a scene that fits the screen', () => {
    expect(followCamera(1500, 1920)).toBe(0);
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

describe('getDepthScale', () => {
  it('is smallest at the back of the walk area and largest at the front', () => {
    expect(getDepthScale(0)).toBeCloseTo(0.7);
    expect(getDepthScale(0.5)).toBeCloseTo(1.05);
    expect(getDepthScale(1)).toBeCloseTo(1.4);
  });

  it('stops changing beyond either edge', () => {
    expect(getDepthScale(-0.5)).toBeCloseTo(0.7);
    expect(getDepthScale(2)).toBeCloseTo(1.4);
  });

  it('can shrink less towards the back, keeping the front size', () => {
    expect(getDepthScale(0, 1, 0.9)).toBeCloseTo(0.9);
    expect(getDepthScale(1, 1, 0.9)).toBeCloseTo(1.4);
  });

  it("multiplies by the scene's base scale", () => {
    expect(getDepthScale(0.5, 0.65)).toBeCloseTo(0.6825);
  });
});

describe('obstacles', () => {
  // A pillar's footprint; Frank's feet keep PLAYER_CLEARANCE away from it either side
  const pillar = { left: 400, right: 600, top: 400, bottom: 500 };
  const widenedLeft = pillar.left - PLAYER_CLEARANCE;
  const widenedRight = pillar.right + PLAYER_CLEARANCE;

  const crossesPillar = (path, start) =>
    [start, ...path].some((point, i, all) => i > 0 && segmentHitsRect(all[i - 1], point, {
      ...pillar,
      left: widenedLeft,
      right: widenedRight,
    }));

  it('spots a segment through a rect, but not one running along its edge or past it', () => {
    expect(segmentHitsRect([0, 450], [1000, 450], pillar)).toBe(true);
    expect(segmentHitsRect([0, 400], [1000, 400], pillar)).toBe(false);
    expect(segmentHitsRect([0, 300], [1000, 300], pillar)).toBe(false);
    expect(segmentHitsRect([0, 450], [399, 450], pillar)).toBe(false);
  });

  it('walks straight there when nothing is in the way', () => {
    expect(planPath([100, 450], [100, 700], [pillar])).toEqual([[100, 700]]);
  });

  it('goes round an obstacle instead of through it', () => {
    const path = planPath([200, 450], [800, 450], [pillar]);
    expect(path.length).toBeGreaterThan(1);
    expect(path.at(-1)).toEqual([800, 450]);
    expect(crossesPillar(path, [200, 450])).toBe(false);
  });

  it('takes the shorter way round', () => {
    // Nearer the back edge than the front, so round the back
    const path = planPath([200, 420], [800, 420], [pillar]);
    expect(path[0][1]).toBeLessThan(pillar.top);
  });

  it("doesn't go round the back of an obstacle when that's off the walk area", () => {
    // Without bounds the back is shorter; with the floor starting just below the pillar's top, it's
    // the front or nothing
    const bounds = { top: 410, bottom: 900 };
    const path = planPath([200, 420], [800, 420], [pillar], bounds);
    expect(path.slice(0, -1).every(([, y]) => y >= bounds.top && y <= bounds.bottom)).toBe(true);
    expect(path[0][1]).toBeGreaterThan(pillar.bottom);
    expect(crossesPillar(path, [200, 420])).toBe(false);
  });

  it("stops at the obstacle's edge when the click is inside it", () => {
    expect(moveOutOfObstacles([500, 490], [pillar])).toEqual([500, pillar.bottom + 1]);
    expect(moveOutOfObstacles([widenedLeft + 5, 450], [pillar])).toEqual([widenedLeft - 1, 450]);
    expect(planPath([500, 700], [500, 490], [pillar])).toEqual([[500, pillar.bottom + 1]]);
  });

  it("doesn't trap Frank inside an obstacle he is already standing in", () => {
    expect(planPath([500, 450], [500, 700], [pillar])).toEqual([[500, 700]]);
  });
});
