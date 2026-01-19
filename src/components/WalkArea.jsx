import "./WalkArea.scss";
import { usePlayer } from "../context/PlayerContext";

const WalkArea = ({ scene }) => {
  const { walk, teleport } = usePlayer();

  return (
    <div
      id="walk-area"
      className={"walk-area " + scene}
      onClick={walk}
      onDoubleClick={teleport}
    ></div>
  );
};

export default WalkArea;
