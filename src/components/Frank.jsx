import frankSprite from "../assets/images/sprites/frank.png";
import "./Frank.scss";

const Frank = () => {
  return (
    <div id="player-container">
      <img
        src={frankSprite}
        id="player-sprite"
        className="standing"
      />
    </div>
  );
};

export default Frank;
