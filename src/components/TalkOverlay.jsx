import portraitFrankRegular from "../assets/images/portraits/portrait-frank-regular.png";
import portraitFrankAngry from "../assets/images/portraits/portrait-frank-angry.png";

const portraitImages = {
  regular: portraitFrankRegular,
  angry: portraitFrankAngry,
};

function TalkOverlay({ portrait, mood, speech, onNext }) {
  return (
    <div
      className="talk-overlay"
      onClick={onNext}
    >
      <div className={`portrait ${portrait}`}>
        <img
          id="portrait-sprite"
          className="portrait-image"
          src={portraitImages[mood] || portraitFrankRegular}
          alt=""
        />
      </div>
      <div className="speech">{speech}</div>
    </div>
  );
}

export default TalkOverlay;
