import { render } from '@testing-library/react';
import FairyLights from './FairyLights';

const bulbs = [
  { x: 836, y: 488, colour: '#ff3333' },
  { x: 836, y: 476, colour: '#33ff4c' },
  { x: 848, y: 248, colour: '#4c72ff' },
];

describe('FairyLights', () => {
  it('lights one bulb per bulb in the string, where the background has it', () => {
    const { container } = render(<FairyLights bulbs={bulbs} />);
    const lit = container.querySelectorAll('.fairy-lights__bulb');
    expect(lit).toHaveLength(3);
    expect(lit[2].style.left).toBe('848px');
    expect(lit[2].style.top).toBe('248px');
    expect(lit[2].style.getPropertyValue('--colour')).toBe('#4c72ff');
  });

  it('twinkles each bulb out of step with its neighbours', () => {
    const { container } = render(<FairyLights bulbs={bulbs} />);
    const timings = [...container.querySelectorAll('.fairy-lights__bulb')].map(
      (b) => `${b.style.getPropertyValue('--duration')} ${b.style.getPropertyValue('--delay')}`
    );
    expect(new Set(timings).size).toBe(3);
  });
});
