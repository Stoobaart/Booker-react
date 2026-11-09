import { fireEvent, render } from '@testing-library/react';
import OpeningDoor from './OpeningDoor';

const fridge = {
  id: 'fridge',
  inside: 'inside.png',
  door: 'door.png',
  position: { x: '920px', y: '472px' },
  size: { width: '400px', height: '508px' },
  frames: 4,
  baseY: 874,
};

describe('OpeningDoor', () => {
  it('shows nothing while it is shut: the background has it closed', () => {
    const { container } = render(<OpeningDoor {...fridge} state={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('opening, steps through its frames to the last, behind and in front', () => {
    const { container } = render(<OpeningDoor {...fridge} state="open" />);
    const layers = container.querySelectorAll('.opening-door');
    expect([...layers].map((l) => l.className)).toEqual(['opening-door opening-door--inside', 'opening-door opening-door--door']);
    expect(layers[0].style.left).toBe('920px');
    expect(layers[0].style.getPropertyValue('--frames')).toBe('4');
    const sheets = container.querySelectorAll('.opening-door__sheet');
    expect(sheets[0].getAttribute('src')).toBe('inside.png');
    expect(sheets[1].getAttribute('src')).toBe('door.png');
    expect(sheets[1].style.animationTimingFunction).toBe('steps(3)');
    expect(sheets[1].style.animationDirection).toBe('normal');
  });

  it('closing, plays the swing backwards and says when it is shut', () => {
    const onClosed = vi.fn();
    const { container } = render(<OpeningDoor {...fridge} state="closing" onClosed={onClosed} />);
    const [, door] = container.querySelectorAll('.opening-door__sheet');
    expect(door.style.animationDirection).toBe('reverse');
    // jsdom has no AnimationEvent, so React listens for the prefixed name
    fireEvent(door, new Event('webkitAnimationEnd', { bubbles: true }));
    expect(onClosed).toHaveBeenCalledWith('fridge');
  });
});
