import { useEffect } from "react";
import { followCamera, setCameraX } from "../../features/player/utils/playerMath";

// Pans a scene wider than the screen to follow Frank. worldRef is the element holding the whole
// scene (background and foreground); it is slid left as he walks right. Each frame reads where he
// is mid-walk, so the camera moves with his walk's transition rather than jumping to its end.
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
