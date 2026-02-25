import rainGif from "../assets/images/backgrounds/rain.gif";
import "./RainOverlay.scss";

const RainOverlay = () => {
  return (
    <img
      className="rain-overlay"
      src={rainGif}
      alt=""
    />
  );
};

export default RainOverlay;
