import { useEffect, useState } from "react";
import { screenToGame } from "../utils/playerMath";

// Checked every frame: a walk is a CSS transition, with no React state along the way
const usePlayerBehind = (baseY) => {
  const [behind, setBehind] = useState(false);

  useEffect(() => {
    let frame;
    const check = () => {
      const playerFrame = document.querySelector("#player-container .player-frame");
      if (playerFrame) {
        const [, feetY] = screenToGame(0, playerFrame.getBoundingClientRect().bottom);
        setBehind(feetY < baseY);
      }
      frame = requestAnimationFrame(check);
    };
    check();
    return () => cancelAnimationFrame(frame);
  }, [baseY]);

  return behind;
};

export default usePlayerBehind;
