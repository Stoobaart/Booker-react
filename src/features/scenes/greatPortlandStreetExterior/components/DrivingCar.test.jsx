import { render, fireEvent } from '@testing-library/react';
import DrivingCar from './DrivingCar';
import { carColors } from '../data/greatPortlandStreetExteriorTraffic';
import { playSound, pauseSound } from '../../../../shared/utils/gameAudio';

vi.mock('../../../../shared/utils/gameAudio', () => ({
  playSound: vi.fn(() => Promise.resolve()),
  pauseSound: vi.fn(),
}));

const car = (container) => container.querySelector('.driving-car');

// jsdom has no AnimationEvent, so React listens for the webkit-prefixed names there; fire both
const animationEvent = (element, name) => {
  fireEvent(element, new Event(name.toLowerCase(), { bubbles: true }));
  fireEvent(element, new Event(`webkit${name}`, { bubbles: true }));
};
const setsOff = (element) => animationEvent(element, 'AnimationStart');
const loops = (element) => animationEvent(element, 'AnimationIteration');

describe('DrivingCar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('drives left in the near lane by default', () => {
    const { container } = render(<DrivingCar />);
    expect(car(container)).toHaveClass('driving-car--near', 'driving-car--left');
  });

  it('drives right in the far lane, on its own timing', () => {
    const { container } = render(<DrivingCar direction="right" lane="far" duration={14} delay={6} />);
    expect(car(container)).toHaveClass('driving-car--far', 'driving-car--right');
    expect(car(container).style.getPropertyValue('--car-duration')).toBe('14s');
    expect(car(container).style.getPropertyValue('--car-delay')).toBe('6s');
  });

  it('plays the passing sound each time it sets off', () => {
    const { container } = render(<DrivingCar volume={0.7} />);
    setsOff(car(container));
    loops(car(container));
    expect(playSound).toHaveBeenCalledTimes(2);
    expect(playSound.mock.calls[0][0].volume).toBe(0.7);
  });

  it("ignores the wheels' animation", () => {
    const { container } = render(<DrivingCar />);
    loops(container.querySelector('.driving-car-sprite'));
    expect(playSound).not.toHaveBeenCalled();
  });

  it('gets a new colour each time it sets off', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    const { container } = render(<DrivingCar />);
    expect(car(container).style.filter).toBe(carColors[0]);
    random.mockReturnValue(0.99);
    loops(car(container));
    expect(car(container).style.filter).toBe(carColors[carColors.length - 1]);
    random.mockRestore();
  });

  it('stops its sound when the scene closes', () => {
    const { unmount } = render(<DrivingCar />);
    unmount();
    expect(pauseSound).toHaveBeenCalled();
  });
});
