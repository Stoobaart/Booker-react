import { useEffect, useRef } from "react";
import carSpritesheet from "../assets/images/objects/car-spritesheet.png";
import carPassingSfx from "../assets/sfx/car-passing.wav";
import "./DrivingCar.scss";

const carColors = [
  "brightness(0.2)", // black
  "brightness(0.4) saturate(1.5) hue-rotate(0deg)", // dark blue (original)
  "brightness(0.5) sepia(0.4) saturate(2) hue-rotate(320deg)", // dark red
  "brightness(0.6) saturate(0)", // silver
  "brightness(0.6) saturate(0)", // dark silver
];

const DrivingCar = () => {
  const carRef = useRef(null);

  useEffect(() => {
    const carAudio = new Audio(carPassingSfx);

    const randomizeCarColor = () => {
      if (carRef.current) {
        const color = carColors[Math.floor(Math.random() * carColors.length)];
        carRef.current.style.filter = color;
      }
    };

    const playSound = () => {
      carAudio.currentTime = 0;
      carAudio.play().catch(() => {});
    };

    randomizeCarColor();
    playSound();

    const soundInterval = setInterval(playSound, 12000);
    const colorTimeout = setTimeout(() => {
      randomizeCarColor();
      colorInterval = setInterval(randomizeCarColor, 12000);
    }, 4000);
    let colorInterval;

    return () => {
      clearInterval(soundInterval);
      clearTimeout(colorTimeout);
      clearInterval(colorInterval);
      carAudio.pause();
      carAudio.currentTime = 0;
    };
  }, []);

  return (
    <div ref={carRef} className="driving-car">
      <img
        className="driving-car-sprite"
        src={carSpritesheet}
        alt=""
      />
    </div>
  );
};

export default DrivingCar;
