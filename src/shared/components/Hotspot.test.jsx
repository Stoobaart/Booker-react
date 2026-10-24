import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Hotspot from './Hotspot';
import { renderWithProviders } from '../../test/renderWithProviders';

const sink = {
  id: 'sink',
  name: 'The sink',
  position: { x: '885px', y: '435px' },
  size: { width: '80px', height: '65px' },
  standAt: { x: '960px', y: '712px' },
  face: 'up',
};

const inspectButton = () => screen.queryByRole('button', { name: 'Inspect The sink' });

describe('Hotspot', () => {
  it('covers its part of the background, with nothing showing until clicked', () => {
    renderWithProviders(<Hotspot {...sink} />);
    const area = screen.getByRole('button', { name: 'The sink' });
    expect(area.parentElement).toHaveStyle({ left: '885px', top: '435px', width: '80px', height: '65px' });
    expect(inspectButton()).toBeNull();
  });

  it('offers inspect only', async () => {
    renderWithProviders(<Hotspot {...sink} />);
    await userEvent.click(screen.getByRole('button', { name: 'The sink' }));
    expect(inspectButton()).not.toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('walks Frank to where he stands to look at it, turns him to face it, then calls onInspect', async () => {
    const onInspect = vi.fn();
    const { player } = renderWithProviders(<Hotspot {...sink} onInspect={onInspect} />);

    await userEvent.click(screen.getByRole('button', { name: 'The sink' }));
    await userEvent.click(inspectButton());

    expect(player.walkTo).toHaveBeenCalledWith(960, 712, expect.any(Function), { face: 'up' });
    expect(onInspect).toHaveBeenCalledOnce();
    expect(inspectButton()).toBeNull();
  });

  it('without standAt, walks to the bottom middle of the box', async () => {
    const { player } = renderWithProviders(<Hotspot {...sink} standAt={undefined} />);
    await userEvent.click(screen.getByRole('button', { name: 'The sink' }));
    await userEvent.click(inspectButton());
    expect(player.walkTo).toHaveBeenCalledWith(925, 500, expect.any(Function), { face: 'up' });
  });

  it("doesn't call onInspect until Frank gets there", async () => {
    const onInspect = vi.fn();
    renderWithProviders(<Hotspot {...sink} onInspect={onInspect} />, { player: { walkTo: vi.fn() } });
    await userEvent.click(screen.getByRole('button', { name: 'The sink' }));
    await userEvent.click(inspectButton());
    expect(onInspect).not.toHaveBeenCalled();
  });

  it('closes the menu on an outside click', async () => {
    renderWithProviders(
      <>
        <Hotspot {...sink} />
        <div>elsewhere</div>
      </>
    );
    await userEvent.click(screen.getByRole('button', { name: 'The sink' }));
    await userEvent.click(screen.getByText('elsewhere'));
    expect(inspectButton()).toBeNull();
  });
});
