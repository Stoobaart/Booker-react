import { useEffect } from "react";
import { followCamera, setCameraX } from "../../features/player/utils/playerMath";

// Reads Frank's position every frame so the camera follows his walk, not just its end
const useSideScroll = (worldRef, worldWidth) => {
  useEffect(() => {
    let frame;
    let last = null;
    const track = () => {
      const player = document.getElementById("player-container");
      if (player && worldRef.current) {
        const x = Math.round(followCamera(player.offsetLeft + player.offsetWidth / 2, worldWidth));
        if (x !== last) {
          worldRef.current.style.transform = `translateX(${-x}px)`;
          setCameraX(x);
          last = x;
        }
      }
      frame = requestAnimationFrame(track);
    };
    track();
    return () => {
      cancelAnimationFrame(frame);
      setCameraX(0);
    };
  }, [worldRef, worldWidth]);
};

export default useSideScroll;
