import "./Beginnings.scss";
import HallwayImage from "../assets/images/backgrounds/hallway.png";

function Beginnings() {
  return (
    <section className="background">
      <img
        className="hallway scene"
        src={HallwayImage}
        alt=""
      />
    </section>
  );
}

export default Beginnings;
