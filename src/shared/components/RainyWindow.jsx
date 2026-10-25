import rainGif from "../../assets/images/backgrounds/rain.gif";
import "./RainyWindow.scss";

// Sits behind the panes cut out of the background
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
