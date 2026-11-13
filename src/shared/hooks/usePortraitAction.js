import { useEffect, useState } from 'react';

const waitBetween = ([min, max]) => min + Math.random() * (max - min);

// The wait only runs while they're quiet; once started, it plays to the end
const usePortraitAction = (action, talking) => {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!action || playing || talking) return;
    const timeout = setTimeout(() => setPlaying(true), waitBetween(action.every));
    return () => clearTimeout(timeout);
  }, [action, playing, talking]);

  useEffect(() => {
    if (!playing) return;
    const timeout = setTimeout(() => setPlaying(false), action.duration);
    return () => clearTimeout(timeout);
  }, [action, playing]);

  return Boolean(action) && playing;
};

export default usePortraitAction;
