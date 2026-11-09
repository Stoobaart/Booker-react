import usePlayerBehind from "../../../player/hooks/usePlayerBehind";
import "./OpeningDoor.scss";

export const OPEN_MS = 500;

// Nothing while shut (the background has it closed). Opening plays its swing once and holds it open; closing plays
// it backwards, then calls onClosed. Two sheets of the same frames: what's behind the door (always under Frank), and
// the door itself, which layers with him like furniture.
function OpeningDoor({ id, inside, door, position, size, frames, baseY, state, onClosed }) {
  const behind = usePlayerBehind(baseY);
  if (!state) return null;

  const sheet = (src, layer) => (
    <div
      className={`opening-door opening-door--${layer}${layer === "door" && behind ? " opening-door--over-player" : ""}`}
      data-opening={id}
      data-state={state}
      style={{ left: position.x, top: position.y, width: size.width, height: size.height, "--frames": frames }}
    >
      <img
        key={state}
        className="opening-door__sheet"
        src={src}
        alt=""
        style={{
          animationDuration: `${OPEN_MS}ms`,
          animationTimingFunction: `steps(${frames - 1})`,
          animationDirection: state === "closing" ? "reverse" : "normal",
        }}
        onAnimationEnd={layer === "door" && state === "closing" ? () => onClosed?.(id) : undefined}
      />
    </div>
  );

  return (
    <>
      {sheet(inside, "inside")}
      {sheet(door, "door")}
    </>
  );
}

export default OpeningDoor;
