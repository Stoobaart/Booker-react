import { render } from '@testing-library/react';
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
