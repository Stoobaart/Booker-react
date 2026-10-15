import usePlayerBehind from "../../features/player/hooks/usePlayerBehind";
import "./Occluder.scss";

// A cut-out of part of the background (a pillar, say), drawn over Frank only while he is behind it:
// his feet further up the screen than its base. In front of it, he walks over the background as usual.
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
