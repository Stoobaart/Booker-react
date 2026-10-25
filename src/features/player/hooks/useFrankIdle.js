import { useEffect } from 'react';

// Durations match the .idle rules in Frank.scss
export const IDLE_ACTIONS = [
  { name: 'notepad', duration: 3200 },
  { name: 'chin', duration: 2400 },
  { name: 'ear', duration: 2400 },
];
export const IDLE_DELAY = [8000, 16000];

const BUSY_SELECTOR = '.npc-dialogue, .game-modal, .talk-overlay';

const randomBetween = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

// usePlayerActions drives the sprite by class: 'standing' starts the wait, anything else cancels it
const useFrankIdle = () => {
  useEffect(() => {
    const spriteEl = document.getElementById('player-sprite');
    if (!spriteEl) return;

    let timeout;

    const wait = () => {
      timeout = setTimeout(playAction, randomBetween(...IDLE_DELAY));
    };

    const playAction = () => {
      if (document.querySelector(BUSY_SELECTOR)) {
        wait();
        return;
      }
      const action = IDLE_ACTIONS[randomBetween(0, IDLE_ACTIONS.length - 1)];
      // Reflow so the animation restarts
      spriteEl.className = '';
      void spriteEl.offsetWidth;
      spriteEl.className = `idle ${action.name} down`;
      timeout = setTimeout(() => {
        spriteEl.className = 'standing down';
      }, action.duration);
    };

    const onClassChange = () => {
      // Our own change: the timer that ends the action is already running
      if (spriteEl.classList.contains('idle')) return;
      clearTimeout(timeout);
      if (spriteEl.classList.contains('standing')) wait();
    };

    const observer = new MutationObserver(onClassChange);
    observer.observe(spriteEl, { attributes: true, attributeFilter: ['class'] });
    onClassChange();

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, []);
};

export default useFrankIdle;
