import { useRef } from "react";
import "./WalkArea.scss";
import { usePlayer } from "../context/PlayerContext";

const WalkArea = ({ scene }) => {
  const { walk, teleport } = usePlayer();
  const lastTapRef = useRef(0);

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
      onClick={walk}
      onDoubleClick={teleport}
      onTouchEnd={handleTouchEnd}
    ></div>
  );
};

export default WalkArea;
