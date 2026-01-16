import { useState, useRef, useCallback } from "react";

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
    const playerContainer = document.getElementById('player-container');
    const playerSprite = document.getElementById('player-sprite');

    if (!playerContainer || !playerSprite) return;

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
    const playerPositionXDiff = clickXPosition - playerContainer.offsetLeft;
    const playerPositionYDiff = clickYPosition - playerContainer.offsetTop;
    // Calculate the time it takes to walk to destination
    let timeToWalk;
    if (window.outerHeight <= 414) {
      timeToWalk = (Math.abs(playerPositionXDiff) + Math.abs(playerPositionYDiff)) * 6;
    } else {
      timeToWalk = (Math.abs(playerPositionXDiff) + Math.abs(playerPositionYDiff)) * 4;
    }
    // Animate the sprite container to the position
    playerContainer.style.top = `${clickYPosition}px`;
    playerContainer.style.left = `${clickXPosition}px`;
    playerContainer.style.transition = `top ${timeToWalk}ms linear, left ${timeToWalk}ms linear`;

    // Figure out which direction the sprite is moving in and add the corresponding class
    if ((playerPositionXDiff > 0) && ((Math.abs(playerPositionXDiff)) > (Math.abs(playerPositionYDiff)))) {
      playerSprite.className = 'walk right';
      direction.current = 'right';
    } else if ((playerPositionYDiff > 0) && ((Math.abs(playerPositionXDiff)) < (Math.abs(playerPositionYDiff)))) {
      playerSprite.className = 'walk down';
      direction.current = 'down';
    } else if ((playerPositionYDiff < 0) && ((Math.abs(playerPositionXDiff)) < (Math.abs(playerPositionYDiff)))) {
      playerSprite.className = 'walk up';
      direction.current = 'up';
    } else {
      playerSprite.className = 'walk left';
      direction.current = 'left';
    }
    // Cancel the animation if the player clicks somewhere else before finishing the current animation
    if (walkAnimationInProgress.current && animationTimeout.current) {
      clearTimeout(animationTimeout.current);
    }
    animationTimeout.current = setTimeout(() => {
      playerSprite.className = `standing ${direction.current}`;
      walkAnimationInProgress.current = false;
      currentlyPathFinding.current = false;
      if (coordsFromObject) {
        checkSpriteArrival(playerContainer, clickXPosition, clickYPosition);
      } else {
        setHasArrived(false);
      }
    }, timeToWalk);

    walkAnimationInProgress.current = true;
  }, [checkSpriteArrival]);

  return {
    walk,
    hasArrived,
  };
};

export default usePlayerActions;