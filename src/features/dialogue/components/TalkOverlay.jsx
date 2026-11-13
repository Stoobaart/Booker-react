import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import Portrait from "../../../shared/components/Portrait";
import { frankEyes, frankPortraits } from "../../../shared/data/frankPortrait";

function TalkOverlay({ portrait, mood, speech, isTyping, onNext }) {
  const isBoardOpen = useSelector((state) => Boolean(state.deduction?.isBoardOpen));
  const root = document.getElementById("root");

  const overlay = (
    <div
      className={`talk-overlay${isBoardOpen ? " talk-overlay--over-board" : ""}`}
      onClick={onNext}
    >
      <div className={`portrait ${portrait}`}>
        <Portrait
          id="portrait-sprite"
          className={`portrait-image${isTyping ? " portrait-image--talking" : ""}`}
          src={frankPortraits[mood] || frankPortraits.regular}
          eyes={frankEyes[mood] || frankEyes.regular}
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
