import { render, waitFor } from '@testing-library/react';
import Occluder from './Occluder';

const pillar = { id: 'pillar', sprite: 'pillar.png', position: { x: '100px', y: '50px' }, baseY: 700 };

// The window is the canvas size, so screen and game coords match
let feetY;
const addFrank = () => {
  const container = document.createElement('div');
  container.id = 'player-container';
  const frame = document.createElement('div');
  frame.className = 'player-frame';
  frame.getBoundingClientRect = () => ({ bottom: feetY });
  container.appendChild(frame);
  document.body.appendChild(container);
  return container;
};

describe('Occluder', () => {
  let frank;

  beforeEach(() => {
    window.innerWidth = 1920;
    window.innerHeight = 980;
    frank = addFrank();
  });

  afterEach(() => {
    frank.remove();
  });

  it('is drawn over Frank while his feet are behind its base', async () => {
    feetY = 650;
    const { container } = render(<Occluder {...pillar} />);
    const img = container.querySelector('#occluder-pillar');

    await waitFor(() => expect(img).toHaveClass('occluder--over-player'));
    expect(img).toHaveStyle({ left: '100px', top: '50px' });
  });

  it('stays under Frank once he walks in front of its base', async () => {
    feetY = 650;
    const { container } = render(<Occluder {...pillar} />);
    const img = container.querySelector('#occluder-pillar');
    await waitFor(() => expect(img).toHaveClass('occluder--over-player'));

    feetY = 750;
    await waitFor(() => expect(img).not.toHaveClass('occluder--over-player'));
  });

  it('is decorative, with empty alt text', () => {
    feetY = 650;
    const { container } = render(<Occluder {...pillar} />);
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });
});
