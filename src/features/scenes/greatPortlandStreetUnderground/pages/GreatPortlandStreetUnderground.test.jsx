import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import GreatPortlandStreetUnderground from './GreatPortlandStreetUnderground';
import { hotspots } from '../data/greatPortlandStreetUndergroundObjects';

vi.mock('../../../../shared/hooks/useMusic', () => ({ default: vi.fn() }));
vi.mock('../../../player/components/Frank', () => ({ default: () => null }));

const renderPlatform = () =>
  renderWithProviders(
    <MemoryRouter>
      <GreatPortlandStreetUnderground />
    </MemoryRouter>,
    { preloadedState: { game: { currentScene: null, playerPosition: null, playerDirection: null, storyProgress: { arrivedAtStation: true, boardNudged: true, talkNudged: true } } } },
  );

const pageTurnPlays = (play) =>
  play.mock.contexts.filter((audio) => audio.src.includes('page-turn')).length;

describe('GreatPortlandStreetUnderground', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('turns a page as the newspaper opens and again as it closes', async () => {
    const play = vi.spyOn(window.HTMLMediaElement.prototype, 'play');
    renderPlatform();

    await userEvent.click(screen.getByAltText('Newspaper'));
    await userEvent.click(document.querySelector('.inspect-icon'));
    expect(screen.getByText('The Evening Standard')).toBeInTheDocument();
    expect(pageTurnPlays(play)).toBe(1);

    await userEvent.click(screen.getByRole('button', { name: '✕' }));
    expect(screen.queryByText('The Evening Standard')).not.toBeInTheDocument();
    expect(pageTurnPlays(play)).toBe(2);
  });

  it('has Frank say the broken camera on the ceiling is out of action', async () => {
    renderPlatform();
    await userEvent.click(screen.getByRole('button', { name: 'Broken security camera' }));
    await userEvent.click(screen.getByRole('button', { name: 'Inspect Broken security camera' }));
    const brokenCamera = hotspots.find((hotspot) => hotspot.id === 'broken-camera');
    expect(await screen.findByText(brokenCamera.lines[0].line, {}, { timeout: 5000 })).toBeInTheDocument();
  });

  it.each([
    ['Litter poster', 'I guess no one looks at these.'],
    ['Mind the gap poster', 'Mind the gap.'],
    ['Posters', 'Nothing interesting.'],
  ])('has Frank comment on the %s', async (name, line) => {
    renderPlatform();
    await userEvent.click(screen.getByRole('button', { name }));
    await userEvent.click(screen.getByRole('button', { name: `Inspect ${name}` }));
    expect(await screen.findByText(line, {}, { timeout: 5000 })).toBeInTheDocument();
  });
});
