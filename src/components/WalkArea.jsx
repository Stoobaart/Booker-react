import "./WalkArea.scss";
import usePlayerActions from "../utils/usePlayerActions";

const WalkArea = ({ scene }) => {
  const { walk, teleport } = usePlayerActions();

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
