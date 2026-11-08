import { useEffect, useRef } from "react";
import "./WalkArea.scss";
import { useDispatch } from "react-redux";
import { usePlayer } from "../../features/player/context/PlayerContext";
import { reportTutorialAction } from "../../features/tutorial/slices/tutorialSlice";

const WalkArea = ({ scene, obstacles }) => {
  const dispatch = useDispatch();
  const { walk, teleport, setObstacles } = usePlayer();
  const lastTapRef = useRef(0);

  useEffect(() => {
    setObstacles(obstacles);
    return () => setObstacles([]);
  }, [setObstacles, obstacles]);

  const handleTouchEnd = (e) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      e.preventDefault(); // prevent the subsequent click event from firing walk
      const touch = e.changedTouches[0];
      teleport({ pageX: touch.pageX, pageY: touch.pageY });
    }
    lastTapRef.current = now;
  };

  return (
    <div
      id="walk-area"
      className={"walk-area " + scene}
      onClick={(e) => {
        walk(e);
        dispatch(reportTutorialAction("walk"));
      }}
      onDoubleClick={teleport}
      onTouchEnd={handleTouchEnd}
    ></div>
  );
};

export default WalkArea;
