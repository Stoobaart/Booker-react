import usePlayerBehind from "../../features/player/hooks/usePlayerBehind";
import "./Occluder.scss";

// alwaysVisible: a sprite not painted into the background (the body), shown under Frank until he's behind it
function Occluder({ id, sprite, position, baseY, alwaysVisible = false }) {
  const behind = usePlayerBehind(baseY);

  return (
    <img
      id={`occluder-${id}`}
      className={`occluder${alwaysVisible ? " occluder--always-visible" : ""}${behind ? " occluder--over-player" : ""}`}
      src={sprite}
      alt=""
      style={{ left: position.x, top: position.y }}
    />
  );
}

export default Occluder;
