import { useState, useRef, useCallback } from "react";
import footstepSfx from "../../../assets/sfx/footstep.wav";
import { getGameScale, screenToGame, calculateWalkTime, getWalkDirection, getDepthScale, planPath, moveOutOfObstacles, itemStandSpot } from "../utils/playerMath";
import { playSound, pauseSound } from "../../../shared/utils/gameAudio";

const footstepAudio = new Audio(footstepSfx);
footstepAudio.playbackRate = 0.65;

// One footfall per step of the walk animation: frank-walk in Frank.scss is one left-right cycle
// (two steps) every 1200ms
const FOOTSTEP_MS = 600;
let footstepTimer = null;

const footstep = () => {
  footstepAudio.currentTime = 0;
  // Rejects (AbortError) when a pause interrupts it, which is expected
  playSound(footstepAudio).catch(() => {});
};

// Synchronous on purpose: every walk stops the last one's footsteps just before starting its own,
// and a stop that waited for anything would land after the new walk's first step and silence it
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

// The walk area's top and bottom edges in game coords, or null when the scene has none
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

// Frank's feet are at the bottom of his container, so his size follows where that ends up
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

// Frank's feet are at the bottom centre of his container
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

  // The scene's obstacles (floor footprints) that walks go round; its WalkArea sets them
  const obstacles = useRef([]);
  const setObstacles = useCallback((list) => {
    obstacles.current = list ?? [];
  }, []);

  // Walks the container to (left, top) one leg at a time, going round any obstacles. Each leg is a
  // CSS transition; onArrive gets where he ended up (outside any obstacle) once the last one ends.
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

    // if click triggered walk
    if (e.target || coordsFromObject) {
      currentlyPathFinding.current = false;
      // Set the desired location used for the PathFinding final position
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

    // clicking the floor: his feet go where the click was
    let [clickXPosition, clickYPosition] = fromFeet(containerEl, [gameX, gameY]);

    // If walking due to an object interaction, ensure the passed value is made proportional for different screen sizes
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

    // Set standing sprite in current direction
    spriteEl.className = `standing ${direction.current}`;

    // Never into an obstacle
    const [clickXPosition, clickYPosition] = fromFeet(
      containerEl,
      moveOutOfObstacles([gameX, gameY], obstacles.current, getWalkAreaBounds()),
    );

    // Instantly move player to the position (no animation)
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

    // He stands just in front of the item to reach it
    const [feetX, feetY] = standAt ? [parseFloat(standAt.x), parseFloat(standAt.y)] : itemStandSpot(itemX, itemY);
    const [clickXPosition, clickYPosition] = fromFeet(containerEl, [feetX, clampToWalkAreaY(feetY)]);

    walkAnimationInProgress.current = true;
    playFootsteps();

    // After walking, play pickup animation
    walkLegs(containerEl, spriteEl, clickXPosition, clickYPosition, () => {
      pauseFootsteps();
      // Remove all classes first to reset animation
      spriteEl.className = '';

      // Force reflow to ensure animation restarts
      void spriteEl.offsetWidth;

      const pickupDirection = ['left', 'right'].includes(direction.current) ? direction.current : 'right';
      spriteEl.className = `pickup-${pickupDirection}`;

      // After pickup animation completes (1000ms), call onComplete and return to standing
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

  // Walks his feet to (targetX, targetY), game px. options.face: direction to turn to on arrival,
  // instead of the way he walked in
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