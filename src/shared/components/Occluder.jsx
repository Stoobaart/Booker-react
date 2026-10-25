import usePlayerBehind from "../../features/player/hooks/usePlayerBehind";
import "./Occluder.scss";

function Occluder({ id, sprite, position, baseY }) {
  const behind = usePlayerBehind(baseY);

  return (
    <img
      id={`occluder-${id}`}
      className={`occluder${behind ? " occluder--over-player" : ""}`}
      src={sprite}
      alt=""
      style={{ left: position.x, top: position.y }}
    />
  );
}

export default Occluder;
