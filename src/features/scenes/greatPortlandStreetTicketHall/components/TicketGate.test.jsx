import { fireEvent, render } from '@testing-library/react';
import TicketGate from './TicketGate';

const gate = (container) => container.querySelector('#ticket-gate');

describe('TicketGate', () => {
  it('is drawn closed while the barrier is locked', () => {
    const { container } = render(<TicketGate open={false} />);
    expect(gate(container)).toHaveClass('ticket-gate');
    expect(gate(container)).not.toHaveClass('ticket-gate--open');
    expect(gate(container)).not.toHaveClass('ticket-gate--opening');
  });

  it('swings open when the barrier is released in front of the player', () => {
    const { container, rerender } = render(<TicketGate open={false} />);
    rerender(<TicketGate open />);
    expect(gate(container)).toHaveClass('ticket-gate--opening');
    expect(gate(container)).not.toHaveClass('ticket-gate--open');
  });

  it('calls onOpened when its opening animation ends', () => {
    const onOpened = vi.fn();
    const { container, rerender } = render(<TicketGate open={false} onOpened={onOpened} />);
    rerender(<TicketGate open onOpened={onOpened} />);
    expect(onOpened).not.toHaveBeenCalled();
    // jsdom has no AnimationEvent, so React listens for the prefixed name
    fireEvent(gate(container), new Event('webkitAnimationEnd', { bubbles: true }));
    expect(onOpened).toHaveBeenCalledTimes(1);
  });

  it('clanks open as its opening animation starts', () => {
    const play = vi.spyOn(window.HTMLMediaElement.prototype, 'play');
    const { container, rerender } = render(<TicketGate open={false} />);
    rerender(<TicketGate open />);
    expect(play).not.toHaveBeenCalled();
    fireEvent(gate(container), new Event('webkitAnimationStart', { bubbles: true }));
    expect(play).toHaveBeenCalledTimes(1);
    expect(play.mock.contexts[0].src).toContain('gate-open');
    play.mockRestore();
  });

  it('is simply drawn open when it was already open on arrival', () => {
    const { container } = render(<TicketGate open />);
    expect(gate(container)).toHaveClass('ticket-gate--open');
    expect(gate(container)).not.toHaveClass('ticket-gate--opening');
  });

  it('is decorative', () => {
    const { container } = render(<TicketGate open={false} />);
    expect(gate(container)).toHaveAttribute('aria-hidden', 'true');
  });
});
