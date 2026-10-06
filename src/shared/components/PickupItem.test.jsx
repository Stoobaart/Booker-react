import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PickupItem from './PickupItem';
import { renderWithProviders } from '../../test/renderWithProviders';

const banana = {
  id: 'banana-1',
  name: 'Banana',
  description: 'A slightly bruised banana',
  sprite: 'banana.png',
  position: { x: 450, y: 700 },
};

const getButtons = () => screen.queryAllByRole('button');

describe('PickupItem', () => {
  it('opens the interaction menu when clicked', async () => {
    renderWithProviders(<PickupItem {...banana} collectable />);
    expect(getButtons()).toHaveLength(0);

    await userEvent.click(screen.getByAltText('Banana'));
    expect(getButtons()).toHaveLength(2);
  });

  it('only offers inspect for non-collectable items', async () => {
    renderWithProviders(<PickupItem {...banana} collectable={false} />);
    await userEvent.click(screen.getByAltText('Banana'));
    expect(getButtons()).toHaveLength(1);
  });

  it('inspect walks to the item then calls onInspect', async () => {
    const onInspect = vi.fn();
    const { player } = renderWithProviders(<PickupItem {...banana} collectable onInspect={onInspect} />);

    await userEvent.click(screen.getByAltText('Banana'));
    await userEvent.click(getButtons()[0]);

    expect(player.walkTo).toHaveBeenCalledWith(450, 700, expect.any(Function));
    expect(onInspect).toHaveBeenCalledOnce();
    expect(getButtons()).toHaveLength(0);
  });

  it('collect picks the item up and adds it to the inventory', async () => {
    const onPickup = vi.fn();
    const { player, store } = renderWithProviders(<PickupItem {...banana} collectable onPickup={onPickup} />);

    await userEvent.click(screen.getByAltText('Banana'));
    await userEvent.click(getButtons()[1]);

    expect(player.pickupItem).toHaveBeenCalledWith(450, 700, expect.any(Function));
    expect(store.getState().inventory.items).toEqual([
      { id: 'banana-1', name: 'Banana', description: 'A slightly bruised banana', sprite: 'banana.png', quantity: 1 },
    ]);
    expect(onPickup).toHaveBeenCalledOnce();
  });

  it('does not add to inventory until Frank has finished the pickup', async () => {
    const { store } = renderWithProviders(<PickupItem {...banana} collectable />, {
      player: { walkTo: vi.fn(), pickupItem: vi.fn() }, // never calls back
    });

    await userEvent.click(screen.getByAltText('Banana'));
    await userEvent.click(getButtons()[1]);

    expect(store.getState().inventory.items).toEqual([]);
  });

  it('closes the menu on an outside click', async () => {
    renderWithProviders(
      <>
        <PickupItem {...banana} collectable />
        <div>elsewhere</div>
      </>
    );
    await userEvent.click(screen.getByAltText('Banana'));
    await userEvent.click(screen.getByText('elsewhere'));
    expect(getButtons()).toHaveLength(0);
  });
});
