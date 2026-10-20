import { render } from '@testing-library/react';
import RainSplashes from './RainSplashes';

describe('RainSplashes', () => {
  it('lays a canvas over the ground, from where it starts to the bottom of the scene', () => {
    const { container } = render(<RainSplashes top={572} width={5760} />);
    const canvas = container.querySelector('canvas.rain-splashes');
    expect(canvas).toHaveAttribute('width', '5760');
    expect(canvas).toHaveAttribute('height', '408');
    expect(canvas.style.top).toBe('572px');
  });
});
