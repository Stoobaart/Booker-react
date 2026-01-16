import "./WalkArea.scss";
import usePlayerActions from "../utils/usePlayerActions";

const WalkArea = ({ scene }) => {
  const { walk } = usePlayerActions();

  // teleport(e) {
  //   this.moveActions.teleport(e);
  // }

  return (
    <div
      id="walk-area"
      className={"walk-area " + scene}
      onClick={() => walk(event)}
    ></div>
    // onDoubleClick={teleport} ADD THIS LATER
  );
};

export default WalkArea;
