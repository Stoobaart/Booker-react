import { useState, useRef, useCallback } from "react";

const getElements = () => ({
  containerEl: document.getElementById('player-container'),
  spriteEl: document.getElementById('player-sprite'),
});

const calculateWalkTime = (xDiff, yDiff) => {
  const distance = Math.abs(xDiff) + Math.abs(yDiff);
  const multiplier = window.outerHeight <= 414 ? 6 : 4;
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
  }, []);

  const checkSpriteArrival = useCallback((playerContainer, targetX, targetY) => {
    const arrivedX = Math.abs(playerContainer.offsetLeft - targetX) < 5;
    const arrivedY = Math.abs(playerContainer.offsetTop - targetY) < 5;
    setHasArrived(arrivedX && arrivedY);
  }, []);

  const walk = useCallback((e, coordsFromObject, PathFinding) => {
    setHasArrived(false);

    // if click triggered walk
    if (e.target || coordsFromObject) {
      currentlyPathFinding.current = false;
      // Set the desired location used for the PathFinding final position
      if (coordsFromObject && !PathFinding) {
        const clickXPosition = (e.pageX * window.outerWidth / 1440) * .9;
        const clickYPosition = (e.pageY * window.outerHeight / 998) * .95;
        desiredLocation.current = { pageY: clickYPosition, pageX: clickXPosition };
      } else {
        desiredLocation.current = { pageY: e.pageY, pageX: e.pageX };
      }
    }
    const { containerEl, spriteEl } = getElements();
    if (!containerEl || !spriteEl) return;

    // click position to use when clicking directly on the screen
    let clickXPosition = e.pageX - 120;
    let clickYPosition = e.pageY - 400;

    // If walking due to an object interaction, ensure the passed value is made proportional for different screen sizes
    if (coordsFromObject && !PathFinding) {
      clickXPosition = (e.pageX * window.outerWidth / 1440) * .9;
      const convertedY = (e.pageY * window.outerHeight / 798) * .95;
      clickYPosition = convertedY;
    }

    // Get differences between click location and sprite position
    const playerPositionXDiff = clickXPosition - containerEl.offsetLeft;
    const playerPositionYDiff = clickYPosition - containerEl.offsetTop;
    const timeToWalk = calculateWalkTime(playerPositionXDiff, playerPositionYDiff);
    // Animate the sprite container to the position
    containerEl.style.top = `${clickYPosition}px`;
    containerEl.style.left = `${clickXPosition}px`;
    containerEl.style.transition = `top ${timeToWalk}ms linear, left ${timeToWalk}ms linear`;

    determineWalkDirection(playerPositionXDiff, playerPositionYDiff, spriteEl, direction);

    cancelOngoingAnimations();

    animationTimeout.current = setTimeout(() => {
      spriteEl.className = `standing ${direction.current}`;
      walkAnimationInProgress.current = false;
      currentlyPathFinding.current = false;
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

    const { containerEl, spriteEl } = getElements();
    if (!containerEl || !spriteEl) return;

    // Set standing sprite in current direction
    spriteEl.className = `standing ${direction.current}`;

    const clickXPosition = e.pageX - 74;
    const clickYPosition = e.pageY - 400;

    // Instantly move player to the position (no animation)
    containerEl.style.top = `${clickYPosition}px`;
    containerEl.style.left = `${clickXPosition}px`;
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
    containerEl.style.top = `${clickYPosition}px`;
    containerEl.style.left = `${clickXPosition}px`;
    containerEl.style.transition = `top ${timeToWalk}ms linear, left ${timeToWalk}ms linear`;

    determineWalkDirection(playerPositionXDiff, playerPositionYDiff, spriteEl, direction);

    walkAnimationInProgress.current = true;

    // After walking, play pickup animation
    animationTimeout.current = setTimeout(() => {
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

  return {
    walk,
    teleport,
    pickupItem,
    hasArrived,
  };
};

export default usePlayerActions;