import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectPlayerPosition, setPlayerPosition, setPlayerDirection } from "../../game/slices/gameSlice";
import useFrankIdle from "../hooks/useFrankIdle";
import { pauseFootsteps } from "../hooks/usePlayerActions";
import { DEPTH_SCALE_BACK, getDepthScale } from "../utils/playerMath";
import frankSprite from "../../../assets/images/sprites/frank.png";
import "./Frank.scss";

// backScale: how small he gets at the back of the walk area, relative to scale (1.4x at the front)
const Frank = ({ scale = 1, backScale = DEPTH_SCALE_BACK, startPosition, direction = "" }) => {
  const initialized = useRef(false);
  const savedPosition = useSelector(selectPlayerPosition);
  const savedDirection = useSelector((state) => state.game.playerDirection);
  const dispatch = useDispatch();
  useFrankIdle();

  // Leaving a scene mid-walk mustn't leave his footsteps going in the next one
  useEffect(() => pauseFootsteps, []);

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
      const depthScale = getDepthScale(
        (feetY - walkRect.top) / walkRect.height,
        scale,
        backScale,
      );
      container.style.setProperty("--depth-scale", depthScale);
    } else {
      container.style.setProperty("--depth-scale", scale);
    }
  });

  return (
    <div
      id="player-container"
      data-base-scale={scale}
      data-back-scale={backScale}
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
