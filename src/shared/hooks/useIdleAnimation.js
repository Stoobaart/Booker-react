import { useEffect, useState } from 'react';

const randomBetween = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

const useIdleAnimation = (spriteSheet) => {
  const [action, setAction] = useState(null);

  useEffect(() => {
    const actions = spriteSheet?.actions ?? [];
    if (!actions.length) return;

    const [minLoops, maxLoops] = spriteSheet.idleLoops ?? [2, 5];
    const timeout = action
      ? setTimeout(() => setAction(null), action.duration)
      : setTimeout(
          () => setAction(actions[randomBetween(0, actions.length - 1)]),
          spriteSheet.idle.duration * randomBetween(minLoops, maxLoops),
        );

    return () => clearTimeout(timeout);
  }, [action, spriteSheet]);

  if (!spriteSheet) return null;
  return action ?? spriteSheet.idle;
};

export default useIdleAnimation;
