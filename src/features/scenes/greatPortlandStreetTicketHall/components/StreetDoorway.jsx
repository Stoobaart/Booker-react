import exteriorImage from "../../../../assets/images/backgrounds/great-portland-street-exterior.png";
import rainGif from "../../../../assets/images/backgrounds/rain.gif";
import "./StreetDoorway.scss";

// The street at night, seen through the open doorway at the back of the hall. The background has a
// hole cut where the doorway is, and this sits behind it: part of the street scene, with its rain.
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
