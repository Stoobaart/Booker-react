import { act, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import GreatPortlandStreetExterior from './GreatPortlandStreetExterior';
import { firstExitLines } from '../data/greatPortlandStreetExteriorLines';
import { MS_PER_LETTER } from '../../../dialogue/hooks/useTalkActions';

vi.mock('../../../../shared/hooks/useMusic', () => ({ default: vi.fn() }));
vi.mock('../../../player/components/Frank', () => ({ default: () => null }));

const renderStreet = (storyProgress) =>
  renderWithProviders(
    <MemoryRouter>
      <GreatPortlandStreetExterior />
    </MemoryRouter>,
    { preloadedState: { game: { currentScene: null, playerPosition: null, playerDirection: null, storyProgress } } },
  );

// Long enough for the pause before Frank speaks and for his first line to type out
const firstLineTyped = 600 + firstExitLines[0].line.length * MS_PER_LETTER + 300;

describe('GreatPortlandStreetExterior', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('has Frank say why he is here the first time he leaves the station', () => {
    const { store } = renderStreet({ arrivedAtStation: true, barrierReleased: true });
    act(() => vi.advanceTimersByTime(firstLineTyped));
    expect(screen.getByText(firstExitLines[0].line)).toBeInTheDocument();
    expect(store.getState().game.storyProgress.leftStation).toBe(true);
  });

  it('stays quiet when he has been out before', () => {
    renderStreet({ arrivedAtStation: true, barrierReleased: true, leftStation: true });
    act(() => vi.advanceTimersByTime(firstLineTyped));
    expect(screen.queryByText(firstExitLines[0].line)).not.toBeInTheDocument();
  });
});
