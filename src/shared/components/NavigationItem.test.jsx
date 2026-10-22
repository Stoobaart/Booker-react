import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import NavigationItem from './NavigationItem';
import { renderWithProviders } from '../../test/renderWithProviders';

const renderExit = (props) =>
  renderWithProviders(
    <MemoryRouter initialEntries={['/station']}>
      <Routes>
        <Route
          path="/station"
          element={
            <NavigationItem
              id="to-street"
              name="Street"
              position={{ x: '0', y: '0' }}
              size={{ width: '1rem', height: '1rem' }}
              to="/street"
              {...props}
            />
          }
        />
        <Route path="/street" element={<p>Street</p>} />
      </Routes>
    </MemoryRouter>
  );

describe('NavigationItem', () => {
  it('walks Frank to the exit, then changes scene', async () => {
    const { container, player } = renderExit();

    await userEvent.click(container.querySelector('#to-street'));

    expect(player.walkTo).toHaveBeenCalled();
    expect(screen.getByText('Street')).toBeInTheDocument();
  });

  it('runs onBlocked instead of changing scene when the exit is blocked', async () => {
    const onBlocked = vi.fn();
    const { container, player } = renderExit({ onBlocked });

    await userEvent.click(container.querySelector('#to-street'));

    expect(player.walkTo).toHaveBeenCalled();
    expect(onBlocked).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Street')).not.toBeInTheDocument();
  });

  it('can sit over the walk area, so an exit can take in some floor', () => {
    const { container } = renderExit({ zIndex: 2 });
    expect(container.querySelector('#to-street').style.zIndex).toBe('2');
  });

  it('walks Frank to its walkTo spot when it has one', async () => {
    const { container, player } = renderExit({ walkTo: { x: '290px', y: '835px' } });
    await userEvent.click(container.querySelector('#to-street'));
    expect(player.walkTo).toHaveBeenCalledWith(290, 835, expect.any(Function));
  });
});
