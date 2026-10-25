import { useState, useRef, useCallback } from "react";
import footstepSfx from "../../../assets/sfx/footstep.wav";
import { getGameScale, screenToGame, calculateWalkTime, getWalkDirection, getDepthScale, planPath, moveOutOfObstacles, itemStandSpot } from "../utils/playerMath";
import { playSound, pauseSound } from "../../../shared/utils/gameAudio";

const footstepAudio = new Audio(footstepSfx);
footstepAudio.playbackRate = 0.65;

// frank-walk in Frank.scss is two steps every 1200ms
const FOOTSTEP_MS = 600;
let footstepTimer = null;

const footstep = () => {
  footstepAudio.currentTime = 0;
  playSound(footstepAudio).catch(() => {});
};

// Synchronous on purpose: an async stop would land after the next walk's first step and silence it
export const pauseFootsteps = () => {
  clearInterval(footstepTimer);
  footstepTimer = null;
  pauseSound(footstepAudio);
  footstepAudio.currentTime = 0;
};

const playFootsteps = () => {
  pauseFootsteps();
  footstep();
  footstepTimer = setInterval(footstep, FOOTSTEP_MS);
};

const getElements = () => ({
  containerEl: document.getElementById('player-container'),
  spriteEl: document.getElementById('player-sprite'),
});

const getWalkAreaBounds = () => {
  const walkArea = document.getElementById('walk-area');
  if (!walkArea) return null;
  const scale = getGameScale();
  const offsetY = (window.innerHeight - 980 * scale) / 2;
  const walkRect = walkArea.getBoundingClientRect();
  const top = (walkRect.top - offsetY) / scale;
  return { top, bottom: top + walkRect.height / scale };
};

const clampToWalkAreaY = (y) => {
  const bounds = getWalkAreaBounds();
  if (!bounds) return y;
  return Math.max(bounds.top, Math.min(y, bounds.bottom));
};

const calculateDepthScale = (containerEl, containerTop) => {
  const feetY = containerTop + containerEl.offsetHeight;
  const baseScale = parseFloat(containerEl.dataset.baseScale) || 1;
  const backScale = parseFloat(containerEl.dataset.backScale) || undefined;
  const walkArea = document.getElementById('walk-area');
  if (!walkArea) return baseScale;
  const scale = getGameScale();
  const offsetY = (window.innerHeight - 980 * scale) / 2;
  const walkRect = walkArea.getBoundingClientRect();
  const walkTop = (walkRect.top - offsetY) / scale;
  const walkHeight = walkRect.height / scale;
  return getDepthScale((feetY - walkTop) / walkHeight, baseScale, backScale);
};

const toFeet = (containerEl, left, top) => [left + containerEl.offsetWidth / 2, top + containerEl.offsetHeight];
const fromFeet = (containerEl, [x, y]) => [x - containerEl.offsetWidth / 2, y - containerEl.offsetHeight];

const determineWalkDirection = (xDiff, yDiff, spriteEl, directionRef) => {
  const dir = getWalkDirection(xDiff, yDiff);
  spriteEl.className = `walk ${dir}`;
  directionRef.current = dir;
};

const usePlayerActions = () => {
  const [hasArrived, setHasArrived] = useState(false);

  const currentlyPathFinding = useRef(false);
  const desiredLocation = useRef(null);
  const direction = useRef('down');
  const walkAnimationInProgress = useRef(false);
  const animationTimeout = useRef(null);
  const pickupTimeout = useRef(null);

  const cancelOngoingAnimations = useCallback(() => {
    if (animationTimeout.current) {
      clearTimeout(animationTimeout.current);
      animationTimeout.current = null;
    }
    if (pickupTimeout.current) {
      clearTimeout(pickupTimeout.current);
      pickupTimeout.current = null;
    }
    walkAnimationInProgress.current = false;
    pauseFootsteps();
  }, []);

  const checkSpriteArrival = useCallback((playerContainer, targetX, targetY) => {
    const arrivedX = Math.abs(playerContainer.offsetLeft - targetX) < 5;
    const arrivedY = Math.abs(playerContainer.offsetTop - targetY) < 5;
    setHasArrived(arrivedX && arrivedY);
  }, []);

  const obstacles = useRef([]);
  const setObstacles = useCallback((list) => {
    obstacles.current = list ?? [];
  }, []);

  // One CSS transition per leg round the obstacles
  const walkLegs = useCallback((containerEl, spriteEl, left, top, onArrive) => {
    const start = toFeet(containerEl, containerEl.offsetLeft, containerEl.offsetTop);
    const legs = planPath(start, toFeet(containerEl, left, top), obstacles.current, getWalkAreaBounds()).map((feet) => fromFeet(containerEl, feet));

    const walkLeg = (i, fromLeft, fromTop) => {
      const [legLeft, legTop] = legs[i];
      const xDiff = legLeft - fromLeft;
      const yDiff = legTop - fromTop;
      const timeToWalk = calculateWalkTime(xDiff, yDiff);
      const depthScale = calculateDepthScale(containerEl, legTop);
      containerEl.style.top = `${legTop}px`;
      containerEl.style.left = `${legLeft}px`;
      containerEl.style.setProperty('--depth-scale', depthScale);
      containerEl.style.transition = `top ${timeToWalk}ms linear, left ${timeToWalk}ms linear, --depth-scale ${timeToWalk}ms linear`;
      determineWalkDirection(xDiff, yDiff, spriteEl, direction);

      animationTimeout.current = setTimeout(() => {
        if (i < legs.length - 1) {
          walkLeg(i + 1, legLeft, legTop);
        } else {
          onArrive(legLeft, legTop);
        }
      }, timeToWalk);
    };
    walkLeg(0, containerEl.offsetLeft, containerEl.offsetTop);
  }, []);

  const walk = useCallback((e, coordsFromObject, PathFinding) => {
    setHasArrived(false);
    const [gameX, gameY] = screenToGame(e.pageX, e.pageY);

    if (e.target || coordsFromObject) {
      currentlyPathFinding.current = false;
      if (coordsFromObject && !PathFinding) {
        const clickXPosition = (gameX * window.outerWidth / 1440) * .9;
        const clickYPosition = (gameY * window.outerHeight / 998) * .95;
        desiredLocation.current = { pageY: clickYPosition, pageX: clickXPosition };
      } else {
        desiredLocation.current = { pageY: gameY, pageX: gameX };
      }
    }
    const { containerEl, spriteEl } = getElements();
    if (!containerEl || !spriteEl) return;

    let [clickXPosition, clickYPosition] = fromFeet(containerEl, [gameX, gameY]);

    if (coordsFromObject && !PathFinding) {
      clickXPosition = (gameX * window.outerWidth / 1440) * .9;
      const convertedY = (gameY * window.outerHeight / 798) * .95;
      clickYPosition = convertedY;
    }

    cancelOngoingAnimations();

    playFootsteps();

    walkLegs(containerEl, spriteEl, clickXPosition, clickYPosition, (endLeft, endTop) => {
      spriteEl.className = `standing ${direction.current}`;
      walkAnimationInProgress.current = false;
      currentlyPathFinding.current = false;
      pauseFootsteps();
      if (coordsFromObject) {
        checkSpriteArrival(containerEl, endLeft, endTop);
      } else {
        setHasArrived(false);
      }
    });

    walkAnimationInProgress.current = true;
  }, [checkSpriteArrival, cancelOngoingAnimations, walkLegs]);

  const teleport = useCallback((e) => {
    cancelOngoingAnimations();
    const [gameX, gameY] = screenToGame(e.pageX, e.pageY);

    const { containerEl, spriteEl } = getElements();
    if (!containerEl || !spriteEl) return;

    spriteEl.className = `standing ${direction.current}`;

    const [clickXPosition, clickYPosition] = fromFeet(
      containerEl,
      moveOutOfObstacles([gameX, gameY], obstacles.current, getWalkAreaBounds()),
    );

    const depthScale = calculateDepthScale(containerEl, clickYPosition);
    containerEl.style.top = `${clickYPosition}px`;
    containerEl.style.left = `${clickXPosition}px`;
    containerEl.style.setProperty('--depth-scale', depthScale);
    containerEl.style.transition = 'none';

    setHasArrived(true);
  }, [cancelOngoingAnimations]);

  const pickupItem = useCallback((itemX, itemY, onComplete, standAt) => {
    const { containerEl, spriteEl } = getElements();
    if (!containerEl || !spriteEl) return;

    cancelOngoingAnimations();

    const [feetX, feetY] = standAt ? [parseFloat(standAt.x), parseFloat(standAt.y)] : itemStandSpot(itemX, itemY);
    const [clickXPosition, clickYPosition] = fromFeet(containerEl, [feetX, clampToWalkAreaY(feetY)]);

    walkAnimationInProgress.current = true;
    playFootsteps();

    walkLegs(containerEl, spriteEl, clickXPosition, clickYPosition, () => {
      pauseFootsteps();
      spriteEl.className = '';

      // Reflow so the animation restarts
      void spriteEl.offsetWidth;

      const pickupDirection = ['left', 'right'].includes(direction.current) ? direction.current : 'right';
      spriteEl.className = `pickup-${pickupDirection}`;

      pickupTimeout.current = setTimeout(() => {
        spriteEl.className = `standing ${direction.current}`;
        walkAnimationInProgress.current = false;
        pickupTimeout.current = null;
        if (onComplete) {
          onComplete();
        }
      }, 1000);
    });
  }, [cancelOngoingAnimations, walkLegs]);

  const walkTo = useCallback((targetX, targetY, onComplete, { face } = {}) => {
    const { containerEl, spriteEl } = getElements();
    if (!containerEl || !spriteEl) return;

    cancelOngoingAnimations();

    const x = typeof targetX === 'string' ? parseInt(targetX) : targetX;
    const y = clampToWalkAreaY(typeof targetY === 'string' ? parseInt(targetY) : targetY);
    const [clickXPosition, clickYPosition] = fromFeet(containerEl, [x, y]);

    walkAnimationInProgress.current = true;
    playFootsteps();

    walkLegs(containerEl, spriteEl, clickXPosition, clickYPosition, () => {
      if (face) direction.current = face;
      spriteEl.className = `standing ${direction.current}`;
      walkAnimationInProgress.current = false;
      pauseFootsteps();
      if (onComplete) {
        onComplete();
      }
    });
  }, [cancelOngoingAnimations, walkLegs]);

  return {
    setObstacles,
    walk,
    walkTo,
    teleport,
    pickupItem,
    hasArrived,
  };
};

export default usePlayerActions;