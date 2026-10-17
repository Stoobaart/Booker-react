import { useEffect } from "react";
import trainImage from "../../../../assets/images/objects/circle-line-train.png";
import trainLeavingSfx from "../../../../assets/sfx/train-leaving.wav";
import "./Train.scss";
import { playSound, pauseSound } from "../../../../shared/utils/gameAudio";

const Train = () => {
  useEffect(() => {
    const audio = new Audio(trainLeavingSfx);
    audio.volume = 0.25;
    playSound(audio).catch(() => {});

    return () => {
      pauseSound(audio);
    };
  }, []);

  return (
    <div className="underground-train">
      <img
        src={trainImage}
        alt=""
      />
    </div>
  );
};

export default Train;
