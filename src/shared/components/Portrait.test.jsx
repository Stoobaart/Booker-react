import { act, render, screen } from '@testing-library/react';
import Portrait from './Portrait';
import { BLINK_MS, MAX_OPEN_MS } from '../hooks/useBlink';

const eyes = [
  { x: 20, y: 40, width: 4, height: 2 },
  { x: 30, y: 40, width: 8, height: 3 },
];
const shutEyes = () => document.querySelectorAll('.portrait-blink');

describe('Portrait', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(1);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows the strip, and over each eye the shut frame for a moment every few seconds', () => {
    render(<Portrait src="strip.png" eyes={eyes} alt="Derek" className="sprite" />);
    expect(screen.getByAltText('Derek')).toHaveAttribute('src', 'strip.png');
    expect(screen.getByAltText('Derek')).toHaveClass('sprite');
    expect(shutEyes()).toHaveLength(0);

    act(() => vi.advanceTimersByTime(MAX_OPEN_MS));
    expect(shutEyes()).toHaveLength(2);
    const [first] = shutEyes();
    // the whole frame, trimmed to the eye and a pixel round it: 19 in and 55 from the right of 80, 39 down and
    // 53 up from 96
    expect(first.style.clipPath).toBe(
      `inset(${(39 / 96) * 100}% ${(55 / 80) * 100}% ${(53 / 96) * 100}% ${(19 / 80) * 100}%)`,
    );
    // showing frame 5 of the 15
    expect(first.querySelector('img')).toHaveAttribute('src', 'strip.png');
    expect(first.querySelector('img').style.transform).toBe(`translateX(-${(5 / 15) * 100}%)`);

    act(() => vi.advanceTimersByTime(BLINK_MS));
    expect(shutEyes()).toHaveLength(0);
  });

  it('now and then plays its action over the strip, frame by frame, not blinking meanwhile', () => {
    // it starts a second before the first blink is due, and lasts past it
    const action = { src: 'drag.png', frames: 20, duration: 3200, every: [MAX_OPEN_MS - 1000, MAX_OPEN_MS - 1000] };
    render(<Portrait src="strip.png" eyes={eyes} action={action} alt="Neighbour" />);
    act(() => vi.advanceTimersByTime(MAX_OPEN_MS - 1000));

    const played = document.querySelector('.portrait-action img');
    expect(played).toHaveAttribute('src', 'drag.png');
    expect(played.style.width).toBe('2000%');
    expect(played.style.animation).toContain('3200ms steps(20)');
    act(() => vi.advanceTimersByTime(1000));
    expect(shutEyes()).toHaveLength(0);

    act(() => vi.advanceTimersByTime(2200));
    expect(document.querySelector('.portrait-action')).toBeNull();
  });

  it("doesn't play its action while they're talking", () => {
    const action = { src: 'drag.png', frames: 20, duration: 3200, every: [1000, 1000] };
    render(<Portrait src="strip.png" action={action} talking alt="Neighbour" />);
    act(() => vi.advanceTimersByTime(30000));
    expect(document.querySelector('.portrait-action')).toBeNull();
  });

  it("doesn't blink without its eyes' places", () => {
    render(<Portrait src="strip.png" alt="Someone" />);
    act(() => vi.advanceTimersByTime(MAX_OPEN_MS));
    expect(shutEyes()).toHaveLength(0);
  });
});
