import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setCurrentScene } from "../../game/gameSlice";
import WalkArea from "../../../shared/components/WalkArea";
import Frank from "../../player/Frank";
import NavigationItem from "../../../shared/components/NavigationItem";
import DrivingCar from "./DrivingCar";
import RainOverlay from "./RainOverlay";
import useMusic from "../../../shared/hooks/useMusic";
import GreatPortlandStreetExteriorImage from "../../../assets/images/backgrounds/great-portland-street-exterior.png";
import rainAudio from "../../../assets/music/rain-exterior.wav";

function GreatPortlandStreetExterior() {
  const dispatch = useDispatch();

  useMusic(rainAudio, { volume: 0.5 });

  useEffect(() => {
    dispatch(setCurrentScene("great-portland-street-exterior"));
  }, [dispatch]);

  const navItems = [
    {
      id: "to-underground",
      name: "Great Portland Street Underground",
      description: "Enter the underground station",
      position: { x: "57rem", y: "23rem" },
      size: { width: "7rem", height: "11rem" },
      to: "/great-portland-street",
    },
  ];

  return (
    <div
      id="game-container"
      className="game-container"
    >
      <section className="great-portland-street-exterior background">
        <img
          src={GreatPortlandStreetExteriorImage}
          alt="Great Portland Street Exterior"
        />
      </section>

      <section className="foreground">
        <WalkArea scene="great-portland-street-exterior" />
        <Frank
          scale={0.65}
          startPosition={{ x: "44.5%", y: "12rem" }}
        />
        <DrivingCar />
        {navItems.map((nav) => (
          <NavigationItem
            key={nav.id}
            id={nav.id}
            name={nav.name}
            description={nav.description}
            position={nav.position}
            size={nav.size}
            to={nav.to}
          />
        ))}
      </section>

      <RainOverlay />
    </div>
  );
}

export default GreatPortlandStreetExterior;
