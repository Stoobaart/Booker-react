import viewImage from "../../../../assets/images/backgrounds/victims-flat-kitchen-window.png";
import rainGif from "../../../../assets/images/backgrounds/rain.gif";
import "./KitchenWindow.scss";

// The night outside the kitchen window: the backs of the houses opposite, with the rain falling in
// front of them. The background has the panes cut out, and this sits behind the hole.
function KitchenWindow({ position, size }) {
  return (
    <div
      className="kitchen-window"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        backgroundImage: `url(${viewImage})`,
      }}
      aria-hidden="true"
    >
      <img className="kitchen-window__rain" src={rainGif} alt="" />
      <div className="kitchen-window__glass" />
    </div>
  );
}

export default KitchenWindow;
