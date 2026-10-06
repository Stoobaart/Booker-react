import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GameModal from './GameModal';

describe('GameModal', () => {
  it('renders its children', () => {
    render(<GameModal onClose={() => {}}><p>Evening Standard</p></GameModal>);
    expect(screen.getByText('Evening Standard')).toBeInTheDocument();
  });

  it('closes via the close button', async () => {
    const onClose = vi.fn();
    render(<GameModal onClose={onClose}><p>News</p></GameModal>);
    await userEvent.click(screen.getByRole('button', { name: '✕' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes when clicking the overlay but not the content', async () => {
    const onClose = vi.fn();
    const { container } = render(<GameModal onClose={onClose}><p>News</p></GameModal>);

    await userEvent.click(screen.getByText('News'));
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.click(container.querySelector('.game-modal-overlay'));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
