import { useState, useRef, useCallback } from "react";

const getElements = () => ({
  containerEl: document.getElementById('player-container'),
  spriteEl: document.getElementById('player-sprite'),
});

const usePlayerActions = () => {
  const [hasArrived, setHasArrived] = useState(false);

  // Use refs to store mutable values that don't need to trigger re-renders
  const currentlyPathFinding = useRef(false);
  const desiredLocation = useRef(null);
  const direction = useRef('down');
  const walkAnimationInProgress = useRef(false);
  const animationTimeout = useRef(null);

  const checkSpriteArrival = useCallback((playerContainer, targetX, targetY) => {
    // Check if sprite has arrived at destination
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
        const clickYPosition = (e.pageY * window.outerHeight / 798) * .95;
        desiredLocation.current = { pageY: clickYPosition, pageX: clickXPosition };
      } else {
        desiredLocation.current = { pageY: e.pageY, pageX: e.pageX };
      }
    }
    const { containerEl, spriteEl } = getElements();
    if (!containerEl || !spriteEl) return;

    // click position to use when clicking directly on the screen
    let clickXPosition = e.pageX - 90;
    let clickYPosition = e.pageY - 320;

    // If walking due to an object interaction, ensure the passed value is made proportional for different screen sizes
    if (coordsFromObject && !PathFinding) {
      clickXPosition = (e.pageX * window.outerWidth / 1440) * .9;
      const convertedY = (e.pageY * window.outerHeight / 798) * .95;
      clickYPosition = convertedY;
    }

    // Get differences between click location and sprite position
    const playerPositionXDiff = clickXPosition - containerEl.offsetLeft;
    const playerPositionYDiff = clickYPosition - containerEl.offsetTop;
    // Calculate the time it takes to walk to destination
    let timeToWalk;
    if (window.outerHeight <= 414) {
      timeToWalk = (Math.abs(playerPositionXDiff) + Math.abs(playerPositionYDiff)) * 6;
    } else {
      timeToWalk = (Math.abs(playerPositionXDiff) + Math.abs(playerPositionYDiff)) * 4;
    }
    // Animate the sprite container to the position
    containerEl.style.top = `${clickYPosition}px`;
    containerEl.style.left = `${clickXPosition}px`;
    containerEl.style.transition = `top ${timeToWalk}ms linear, left ${timeToWalk}ms linear`;

    // Figure out which direction the sprite is moving in and add the corresponding class
    if ((playerPositionXDiff > 0) && ((Math.abs(playerPositionXDiff)) > (Math.abs(playerPositionYDiff)))) {
      spriteEl.className = 'walk right';
      direction.current = 'right';
    } else if ((playerPositionYDiff > 0) && ((Math.abs(playerPositionXDiff)) < (Math.abs(playerPositionYDiff)))) {
      spriteEl.className = 'walk down';
      direction.current = 'down';
    } else if ((playerPositionYDiff < 0) && ((Math.abs(playerPositionXDiff)) < (Math.abs(playerPositionYDiff)))) {
      spriteEl.className = 'walk up';
      direction.current = 'up';
    } else {
      spriteEl.className = 'walk left';
      direction.current = 'left';
    }
    // Cancel the animation if the player clicks somewhere else before finishing the current animation
    if (walkAnimationInProgress.current && animationTimeout.current) {
      clearTimeout(animationTimeout.current);
    }
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
  }, [checkSpriteArrival]);

  const teleport = useCallback((e) => {
    // Cancel any ongoing walk animation
    if (animationTimeout.current) {
      clearTimeout(animationTimeout.current);
      walkAnimationInProgress.current = false;
    }

    const { containerEl, spriteEl } = getElements();
    if (!containerEl || !spriteEl) return;

    // Set standing sprite in current direction
    spriteEl.className = `standing ${direction.current}`;

    // Calculate click position
    const clickXPosition = e.pageX - 74;
    const clickYPosition = e.pageY - 320;

    // Instantly move player to the position (no animation)
    containerEl.style.top = `${clickYPosition}px`;
    containerEl.style.left = `${clickXPosition}px`;
    containerEl.style.transition = 'none';

    setHasArrived(true);
  }, []);

  const pickupItem = useCallback((itemX, itemY, onComplete) => {
    const { containerEl, spriteEl } = getElements();
    if (!containerEl || !spriteEl) return;

    // Cancel any ongoing animation
    if (walkAnimationInProgress.current && animationTimeout.current) {
      clearTimeout(animationTimeout.current);
    }

    // Parse position values (remove 'px' if present)
    const targetX = typeof itemX === 'string' ? parseInt(itemX) : itemX;
    const targetY = typeof itemY === 'string' ? parseInt(itemY) : itemY;

    // Calculate adjusted position (center Frank on the item)
    const clickXPosition = targetX - 90;
    const clickYPosition = targetY - 320;

    // Get differences between item location and sprite position
    const playerPositionXDiff = clickXPosition - containerEl.offsetLeft;
    const playerPositionYDiff = clickYPosition - containerEl.offsetTop;

    // Calculate walk time
    let timeToWalk;
    if (window.outerHeight <= 414) {
      timeToWalk = (Math.abs(playerPositionXDiff) + Math.abs(playerPositionYDiff)) * 6;
    } else {
      timeToWalk = (Math.abs(playerPositionXDiff) + Math.abs(playerPositionYDiff)) * 4;
    }

    // Animate to the position
    containerEl.style.top = `${clickYPosition}px`;
    containerEl.style.left = `${clickXPosition}px`;
    containerEl.style.transition = `top ${timeToWalk}ms linear, left ${timeToWalk}ms linear`;

    // Determine walk direction
    if ((playerPositionXDiff > 0) && ((Math.abs(playerPositionXDiff)) > (Math.abs(playerPositionYDiff)))) {
      spriteEl.className = 'walk right';
      direction.current = 'right';
    } else if ((playerPositionYDiff > 0) && ((Math.abs(playerPositionXDiff)) < (Math.abs(playerPositionYDiff)))) {
      spriteEl.className = 'walk down';
      direction.current = 'down';
    } else if ((playerPositionYDiff < 0) && ((Math.abs(playerPositionXDiff)) < (Math.abs(playerPositionYDiff)))) {
      spriteEl.className = 'walk up';
      direction.current = 'up';
    } else {
      spriteEl.className = 'walk left';
      direction.current = 'left';
    }

    walkAnimationInProgress.current = true;

    // After walking, play pickup animation
    animationTimeout.current = setTimeout(() => {
      // Remove all classes first to reset animation
      spriteEl.className = '';

      // Force reflow to ensure animation restarts
      void spriteEl.offsetWidth;

      // Play pickup animation
      spriteEl.className = 'pickup';

      // After pickup animation completes (1000ms), call onComplete and return to standing
      setTimeout(() => {
        spriteEl.className = `standing ${direction.current}`;
        walkAnimationInProgress.current = false;
        if (onComplete) {
          onComplete();
        }
      }, 1000); // Pickup animation duration
    }, timeToWalk);
  }, []);

  return {
    walk,
    teleport,
    pickupItem,
    hasArrived,
  };
};

export default usePlayerActions;