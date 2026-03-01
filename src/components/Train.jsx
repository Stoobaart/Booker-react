import { useEffect } from "react";
import trainImage from "../assets/images/objects/circle-line-train.png";
import trainLeavingSfx from "../assets/sfx/train-leaving.wav";
import "./Train.scss";

const Train = () => {
  useEffect(() => {
    const audio = new Audio(trainLeavingSfx);
    audio.volume = 0.25;
    audio.play().catch(() => {});

    return () => {
      audio.pause();
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
