import { useState, useRef, useCallback } from "react";
import footstepSfx from "../assets/sfx/footstep.wav";

const footstepAudio = new Audio(footstepSfx);
footstepAudio.loop = true;
footstepAudio.playbackRate = 0.65;

const getGameScale = () => {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--game-scale')) || 1;
};

const screenToGame = (screenX, screenY) => {
  const scale = getGameScale();
  const offsetX = (window.innerWidth - 1920 * scale) / 2;
  const offsetY = (window.innerHeight - 980 * scale) / 2;
  return [(screenX - offsetX) / scale, (screenY - offsetY) / scale];
};

const getElements = () => ({
  containerEl: document.getElementById('player-container'),
  spriteEl: document.getElementById('player-sprite'),
});

const calculateDepthScale = (containerEl, feetY) => {
  const baseScale = parseFloat(containerEl.dataset.baseScale) || 1;
  const walkArea = document.getElementById('walk-area');
  if (!walkArea) return baseScale;
  const scale = getGameScale();
  const offsetY = (window.innerHeight - 980 * scale) / 2;
  const walkRect = walkArea.getBoundingClientRect();
  const walkTop = (walkRect.top - offsetY) / scale;
  const walkHeight = walkRect.height / scale;
  const normalizedY = Math.max(0, Math.min(feetY - walkTop, walkHeight)) / walkHeight;
  return baseScale * (0.8 + 0.5 * normalizedY);
};

const calculateWalkTime = (xDiff, yDiff) => {
  const distance = Math.abs(xDiff) + Math.abs(yDiff);
  const multiplier = 4;
  return distance * multiplier;
};

const determineWalkDirection = (xDiff, yDiff, spriteEl, directionRef) => {
  const absX = Math.abs(xDiff);
  const absY = Math.abs(yDiff);

  const dir = absX > absY
    ? (xDiff > 0 ? 'right' : 'left')
    : (yDiff > 0 ? 'down' : 'up');

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
    footstepAudio.pause();
    footstepAudio.currentTime = 0;
  }, []);

  const checkSpriteArrival = useCallback((playerContainer, targetX, targetY) => {
    const arrivedX = Math.abs(playerContainer.offsetLeft - targetX) < 5;
    const arrivedY = Math.abs(playerContainer.offsetTop - targetY) < 5;
    setHasArrived(arrivedX && arrivedY);
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

    // click position to use when clicking directly on the screen
    let clickXPosition = gameX - 120;
    let clickYPosition = gameY - 400;

    // If walking due to an object interaction, ensure the passed value is made proportional for different screen sizes
    if (coordsFromObject && !PathFinding) {
      clickXPosition = (gameX * window.outerWidth / 1440) * .9;
      const convertedY = (gameY * window.outerHeight / 798) * .95;
      clickYPosition = convertedY;
    }

    // Get differences between click location and sprite position
    const playerPositionXDiff = clickXPosition - containerEl.offsetLeft;
    const playerPositionYDiff = clickYPosition - containerEl.offsetTop;
    const timeToWalk = calculateWalkTime(playerPositionXDiff, playerPositionYDiff);
    // Animate the sprite container to the position
    const feetY = coordsFromObject ? clickYPosition + 400 : gameY;
    const depthScale = calculateDepthScale(containerEl, feetY);
    containerEl.style.top = `${clickYPosition}px`;
    containerEl.style.left = `${clickXPosition}px`;
    containerEl.style.transform = `scale(${depthScale})`;
    containerEl.style.transition = `top ${timeToWalk}ms linear, left ${timeToWalk}ms linear, transform ${timeToWalk}ms linear`;

    determineWalkDirection(playerPositionXDiff, playerPositionYDiff, spriteEl, direction);

    cancelOngoingAnimations();

    footstepAudio.currentTime = 0;
    footstepAudio.play();

    animationTimeout.current = setTimeout(() => {
      spriteEl.className = `standing ${direction.current}`;
      walkAnimationInProgress.current = false;
      currentlyPathFinding.current = false;
      footstepAudio.pause();
      footstepAudio.currentTime = 0;
      if (coordsFromObject) {
        checkSpriteArrival(containerEl, clickXPosition, clickYPosition);
      } else {
        setHasArrived(false);
      }
    }, timeToWalk);

    walkAnimationInProgress.current = true;
  }, [checkSpriteArrival, cancelOngoingAnimations]);

  const teleport = useCallback((e) => {
    cancelOngoingAnimations();
    const [gameX, gameY] = screenToGame(e.pageX, e.pageY);

    const { containerEl, spriteEl } = getElements();
    if (!containerEl || !spriteEl) return;

    // Set standing sprite in current direction
    spriteEl.className = `standing ${direction.current}`;

    const clickXPosition = gameX - 74;
    const clickYPosition = gameY - 400;

    // Instantly move player to the position (no animation)
    const depthScale = calculateDepthScale(containerEl, gameY);
    containerEl.style.top = `${clickYPosition}px`;
    containerEl.style.left = `${clickXPosition}px`;
    containerEl.style.transform = `scale(${depthScale})`;
    containerEl.style.transition = 'none';

    setHasArrived(true);
  }, [cancelOngoingAnimations]);

  const pickupItem = useCallback((itemX, itemY, onComplete) => {
    const { containerEl, spriteEl } = getElements();
    if (!containerEl || !spriteEl) return;

    cancelOngoingAnimations();

    // Parse position values (remove 'px' if present)
    const targetX = typeof itemX === 'string' ? parseInt(itemX) : itemX;
    const targetY = typeof itemY === 'string' ? parseInt(itemY) : itemY;

    // Calculate adjusted position (center Frank on the item)
    const clickXPosition = targetX - 90;
    const clickYPosition = targetY - 350;

    // Get differences between item location and sprite position
    const playerPositionXDiff = clickXPosition - containerEl.offsetLeft;
    const playerPositionYDiff = clickYPosition - containerEl.offsetTop;

    const timeToWalk = calculateWalkTime(playerPositionXDiff, playerPositionYDiff);

    // Animate to the position
    const depthScale = calculateDepthScale(containerEl, targetY);
    containerEl.style.top = `${clickYPosition}px`;
    containerEl.style.left = `${clickXPosition}px`;
    containerEl.style.transform = `scale(${depthScale})`;
    containerEl.style.transition = `top ${timeToWalk}ms linear, left ${timeToWalk}ms linear, transform ${timeToWalk}ms linear`;

    determineWalkDirection(playerPositionXDiff, playerPositionYDiff, spriteEl, direction);

    walkAnimationInProgress.current = true;
    footstepAudio.currentTime = 0;
    footstepAudio.play();

    // After walking, play pickup animation
    animationTimeout.current = setTimeout(() => {
      footstepAudio.pause();
      footstepAudio.currentTime = 0;
      // Remove all classes first to reset animation
      spriteEl.className = '';

      // Force reflow to ensure animation restarts
      void spriteEl.offsetWidth;

      spriteEl.className = `pickup-${direction.current}`;

      // After pickup animation completes (1000ms), call onComplete and return to standing
      pickupTimeout.current = setTimeout(() => {
        spriteEl.className = `standing ${direction.current}`;
        walkAnimationInProgress.current = false;
        pickupTimeout.current = null;
        if (onComplete) {
          onComplete();
        }
      }, 1000);
    }, timeToWalk);
  }, [cancelOngoingAnimations]);

  const walkTo = useCallback((targetX, targetY, onComplete) => {
    const { containerEl, spriteEl } = getElements();
    if (!containerEl || !spriteEl) return;

    cancelOngoingAnimations();

    const x = typeof targetX === 'string' ? parseInt(targetX) : targetX;
    const y = typeof targetY === 'string' ? parseInt(targetY) : targetY;

    const clickXPosition = x - 90;
    const clickYPosition = y - 350;

    const playerPositionXDiff = clickXPosition - containerEl.offsetLeft;
    const playerPositionYDiff = clickYPosition - containerEl.offsetTop;
    const timeToWalk = calculateWalkTime(playerPositionXDiff, playerPositionYDiff);

    const depthScale = calculateDepthScale(containerEl, y);
    containerEl.style.top = `${clickYPosition}px`;
    containerEl.style.left = `${clickXPosition}px`;
    containerEl.style.transform = `scale(${depthScale})`;
    containerEl.style.transition = `top ${timeToWalk}ms linear, left ${timeToWalk}ms linear, transform ${timeToWalk}ms linear`;

    determineWalkDirection(playerPositionXDiff, playerPositionYDiff, spriteEl, direction);

    walkAnimationInProgress.current = true;
    footstepAudio.currentTime = 0;
    footstepAudio.play();

    animationTimeout.current = setTimeout(() => {
      spriteEl.className = `standing ${direction.current}`;
      walkAnimationInProgress.current = false;
      footstepAudio.pause();
      footstepAudio.currentTime = 0;
      if (onComplete) {
        onComplete();
      }
    }, timeToWalk);
  }, [cancelOngoingAnimations]);

  return {
    walk,
    walkTo,
    teleport,
    pickupItem,
    hasArrived,
  };
};

export default usePlayerActions;