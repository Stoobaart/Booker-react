import { useEffect, useState } from "react";
import trainImage from "../../../../assets/images/objects/circle-line-train.png";
import trainLeavingSfx from "../../../../assets/sfx/train-leaving.mp3";
import "./Train.scss";
import { playSound, pauseSound } from "../../../../shared/utils/gameAudio";

const Train = () => {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const audio = new Audio(trainLeavingSfx);
    audio.volume = 0.25;
    playSound(audio).catch(() => {});

    return () => {
      pauseSound(audio);
    };
  }, []);

  return (
    <div className={`underground-train${gone ? " underground-train--gone" : ""}`} onAnimationEnd={() => setGone(true)}>
      <img
        src={trainImage}
        alt=""
      />
    </div>
  );
};

export default Train;
