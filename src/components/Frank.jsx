import { useEffect } from "react";
import frankSprite from "../assets/images/sprites/frank.png";
import "./Frank.scss";

const Frank = ({ scale = 1, startPosition }) => {
  const style = {
    transform: `scale(${scale})`,
    transformOrigin: 'bottom center',
    ...(startPosition && { top: startPosition.y, left: startPosition.x }),
  };

  useEffect(() => {
    const container = document.getElementById('player-container');
    const walkArea = document.getElementById('walk-area');
    if (!container || !walkArea) return;

    const walkRect = walkArea.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const feetY = containerRect.bottom;
    const normalizedY = Math.max(0, Math.min(feetY - walkRect.top, walkRect.height)) / walkRect.height;
    const depthScale = scale * (0.8 + 0.5 * normalizedY);
    container.style.transform = `scale(${depthScale})`;
  }, [scale, startPosition]);

  return (
    <div id="player-container" style={style} data-base-scale={scale}>
      <img
        src={frankSprite}
        id="player-sprite"
        className="standing"
      />
    </div>
  );
};

export default Frank;
