import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import portraitFrankRegular from "../../../assets/images/portraits/portrait-frank-regular.png";
import portraitFrankAngry from "../../../assets/images/portraits/portrait-frank-angry.png";

const portraitImages = {
  regular: portraitFrankRegular,
  angry: portraitFrankAngry,
};

function TalkOverlay({ portrait, mood, speech, isTyping, onNext }) {
  const isBoardOpen = useSelector((state) => Boolean(state.deduction?.isBoardOpen));
  const root = document.getElementById("root");

  const overlay = (
    <div
      className={`talk-overlay${isBoardOpen ? " talk-overlay--over-board" : ""}`}
      onClick={onNext}
    >
      <div className={`portrait ${portrait}`}>
        <img
          id="portrait-sprite"
          className={`portrait-image${isTyping ? " portrait-image--talking" : ""}`}
          src={portraitImages[mood] || portraitFrankRegular}
          alt=""
        />
      </div>
      <div className="speech">{speech}</div>
    </div>
  );

  // The board covers the scene, so Frank talks over it from the top of the canvas
  return isBoardOpen && root ? createPortal(overlay, root) : overlay;
}

export default TalkOverlay;
