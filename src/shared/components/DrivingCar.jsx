import { useEffect, useRef, useState } from "react";
import carSpritesheet from "../../assets/images/objects/car-spritesheet.png";
import carPassingSfx from "../../assets/sfx/car-passing.wav";
import "./DrivingCar.scss";
import { playSound, pauseSound } from "../utils/gameAudio";
import { carColors } from "../utils/carColors";

const randomColor = () => carColors[Math.floor(Math.random() * carColors.length)];

const DrivingCar = ({ direction = "left", lane = "near", duration = 12, delay = 0, volume = 1 }) => {
  const audioRef = useRef(null);
  const [color, setColor] = useState(randomColor);

  useEffect(() => {
    const carAudio = new Audio(carPassingSfx);
    carAudio.volume = volume;
    audioRef.current = carAudio;
    return () => {
      pauseSound(carAudio);
      carAudio.currentTime = 0;
    };
  }, [volume]);

  const setOff = (event) => {
    if (event.target !== event.currentTarget) return; // the wheels' own animation
    setColor(randomColor());
    const carAudio = audioRef.current;
    if (!carAudio) return;
    carAudio.currentTime = 0;
    playSound(carAudio).catch(() => {});
  };

  return (
    <div
      className={`driving-car driving-car--${lane} driving-car--${direction}`}
      style={{ filter: color, "--car-duration": `${duration}s`, "--car-delay": `${delay}s` }}
      onAnimationStart={setOff}
      onAnimationIteration={setOff}
    >
      <img
        className="driving-car-sprite"
        src={carSpritesheet}
        alt=""
      />
    </div>
  );
};

export default DrivingCar;
