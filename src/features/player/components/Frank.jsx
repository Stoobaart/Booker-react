import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectPlayerPosition, setPlayerPosition, setPlayerDirection } from "../../game/slices/gameSlice";
import useFrankIdle from "../hooks/useFrankIdle";
import frankSprite from "../../../assets/images/sprites/frank.png";
import "./Frank.scss";

const Frank = ({ scale = 1, startPosition, direction = "" }) => {
  const initialized = useRef(false);
  const savedPosition = useSelector(selectPlayerPosition);
  const savedDirection = useSelector((state) => state.game.playerDirection);
  const dispatch = useDispatch();
  useFrankIdle();

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const container = document.getElementById("player-container");
    const walkArea = document.getElementById("walk-area");
    if (!container) return;

    // Use saved position if available (from Continue), otherwise use scene default
    const position = savedPosition || startPosition;
    if (position) {
      container.style.top = position.y;
      container.style.left = position.x;
    }

    // Clear saved position/direction after using so they don't persist to next scene
    if (savedPosition) {
      dispatch(setPlayerPosition(null));
    }
    if (savedDirection) {
      dispatch(setPlayerDirection(null));
    }

    if (walkArea) {
      const walkRect = walkArea.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const feetY = containerRect.bottom;
      const normalizedY =
        Math.max(0, Math.min(feetY - walkRect.top, walkRect.height)) /
        walkRect.height;
      const depthScale = scale * (0.8 + 0.5 * normalizedY);
      container.style.setProperty("--depth-scale", depthScale);
    } else {
      container.style.setProperty("--depth-scale", scale);
    }
  });

  return (
    <div
      id="player-container"
      data-base-scale={scale}
    >
      <div className="player-frame">
        <div
          id="player-sprite"
          className={`standing ${savedDirection ?? direction}`}
          style={{ backgroundImage: `url(${frankSprite})` }}
        />
      </div>
    </div>
  );
};

export default Frank;
