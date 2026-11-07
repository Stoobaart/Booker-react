import { useEffect, useRef } from 'react';
import { playSound } from '../utils/gameAudio';

// Plays src each time `on` flips (not on mount), after openDelayMs / closeDelayMs
export const useToggleSound = (on, src, { openDelayMs = 0, closeDelayMs = 0 } = {}) => {
  const audio = useRef(null);
  const previous = useRef(on);

  // Loaded up front so the first click isn't late
  useEffect(() => {
    audio.current = new Audio(src);
  }, [src]);

  useEffect(() => {
    if (previous.current === on) return undefined;
    previous.current = on;
    const play = () => {
      audio.current.currentTime = 0;
      playSound(audio.current).catch(() => {});
    };
    const delay = on ? openDelayMs : closeDelayMs;
    if (delay <= 0) {
      play();
      return undefined;
    }
    const timer = setTimeout(play, delay);
    return () => clearTimeout(timer);
  }, [on, openDelayMs, closeDelayMs]);
};
