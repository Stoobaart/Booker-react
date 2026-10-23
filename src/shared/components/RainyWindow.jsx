import rainGif from "../../assets/images/backgrounds/rain.gif";
import "./RainyWindow.scss";

// The night outside a window (the kitchen's, the bedroom's), with the rain falling in front of it.
// The background has the panes cut out, and this sits behind the hole: `view` is the picture of
// what's outside, drawn by the room's background script.
function RainyWindow({ position, size, view }) {
  return (
    <div
      className="rainy-window"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        backgroundImage: `url(${view})`,
      }}
      aria-hidden="true"
    >
      <img className="rainy-window__rain" src={rainGif} alt="" />
      <div className="rainy-window__glass" />
    </div>
  );
}

export default RainyWindow;
