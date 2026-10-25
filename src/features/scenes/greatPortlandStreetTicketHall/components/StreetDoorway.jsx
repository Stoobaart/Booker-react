import exteriorImage from "../../../../assets/images/backgrounds/great-portland-street-exterior.png";
import rainGif from "../../../../assets/images/backgrounds/rain.gif";
import "./StreetDoorway.scss";

// Sits behind the doorway's hole in the background
function StreetDoorway({ position, size }) {
  return (
    <div
      className="street-doorway"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        backgroundImage: `url(${exteriorImage})`,
      }}
      aria-hidden="true"
    >
      <img className="street-doorway__rain" src={rainGif} alt="" />
    </div>
  );
}

export default StreetDoorway;
