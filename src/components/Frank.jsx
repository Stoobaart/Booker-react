import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectPlayerPosition, setPlayerPosition } from "../store/gameSlice";
import frankSprite from "../assets/images/sprites/frank.png";
import "./Frank.scss";

const Frank = ({ scale = 1, startPosition }) => {
  const initialized = useRef(false);
  const savedPosition = useSelector(selectPlayerPosition);
  const dispatch = useDispatch();

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const container = document.getElementById('player-container');
    const walkArea = document.getElementById('walk-area');
    if (!container) return;

    container.style.transformOrigin = 'bottom center';

    // Use saved position if available (from Continue), otherwise use scene default
    const position = savedPosition || startPosition;
    if (position) {
      container.style.top = position.y;
      container.style.left = position.x;
    }

    // Clear saved position after using it so it doesn't persist to next scene
    if (savedPosition) {
      dispatch(setPlayerPosition(null));
    }

    if (walkArea) {
      const walkRect = walkArea.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const feetY = containerRect.bottom;
      const normalizedY = Math.max(0, Math.min(feetY - walkRect.top, walkRect.height)) / walkRect.height;
      const depthScale = scale * (0.8 + 0.5 * normalizedY);
      container.style.transform = `scale(${depthScale})`;
    } else {
      container.style.transform = `scale(${scale})`;
    }
  });

  return (
    <div id="player-container" data-base-scale={scale}>
      <img
        src={frankSprite}
        id="player-sprite"
        className="standing"
      />
    </div>
  );
};

export default Frank;
