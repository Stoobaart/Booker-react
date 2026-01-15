import React from "react";

const WalkArea = ({ scene }) => {
  // walk(e) {
  //   this.moveActions.walk(e);
  // }

  // teleport(e) {
  //   this.moveActions.teleport(e);
  // }

  return (
    <div
      id="walk-area"
      className={"walk-area " + scene}
      onClick={walk}
    ></div>
    // onDoubleClick={teleport} ADD THIS LATER
  );
};

export default WalkArea;
