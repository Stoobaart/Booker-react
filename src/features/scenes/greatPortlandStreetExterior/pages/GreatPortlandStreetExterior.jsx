import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { setCurrentScene, setStoryProgress } from "../../../game/slices/gameSlice";
import WalkArea from "../../../../shared/components/WalkArea";
import Frank from "../../../player/components/Frank";
import NavigationItem from "../../../../shared/components/NavigationItem";
import DrivingCar from "../../../../shared/components/DrivingCar";
import RainOverlay from "../../../../shared/components/RainOverlay";
import RainSplashes from "../../../../shared/components/RainSplashes";
import { trafficLanes } from "../data/greatPortlandStreetExteriorTraffic";
import { firstExitLines } from "../data/greatPortlandStreetExteriorLines";
import useMusic from "../../../../shared/hooks/useMusic";
import useTalkActions from "../../../dialogue/hooks/useTalkActions";
import TalkOverlay from "../../../dialogue/components/TalkOverlay";
import GreatPortlandStreetExteriorImage from "../../../../assets/images/backgrounds/great-portland-street-exterior.png";
import rainAudio from "../../../../assets/music/rain-exterior.wav";

function GreatPortlandStreetExterior() {
  const dispatch = useDispatch();
  const location = useLocation();
  const fromStreet = location.state?.from === "/residential-street";

  const leftStation = useSelector((state) => state.game.storyProgress?.leftStation);
  const [firstExit] = useState(() => !leftStation);
  useMusic(rainAudio, { volume: 0.5 });

  const {
    showTalkOverlay,
    speech,
    portrait,
    mood,
    runNextStep,
    setLinesAndSpeak,
  } = useTalkActions();

  useEffect(() => {
    dispatch(setCurrentScene("great-portland-street-exterior"));
  }, [dispatch]);

  // The timer also stops StrictMode's second effect run speaking twice
  useEffect(() => {
    if (!firstExit) return undefined;
    const timer = setTimeout(() => {
      dispatch(setStoryProgress("leftStation"));
      setLinesAndSpeak(firstExitLines);
    }, 600);
    return () => clearTimeout(timer);
  }, [dispatch, firstExit, setLinesAndSpeak]);

  const navItems = [
    {
      id: "to-underground",
      name: "Great Portland Street Underground",
      description: "Enter the underground station",
      position: { x: "57rem", y: "23rem" },
      size: { width: "7rem", height: "11rem" },
      to: "/great-portland-street-ticket-hall",
    },
    {
      id: "to-residential-street",
      name: "Residential street",
      description: "Walk along the street",
      position: { x: "0rem", y: "25rem" },
      size: { width: "6rem", height: "15rem" },
      to: "/residential-street",
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
        <RainSplashes top={572} />
        <WalkArea scene="great-portland-street-exterior" />
        <Frank
          scale={0.65}
          startPosition={fromStreet ? { x: "0rem", y: "12rem" } : { x: "44.5%", y: "12rem" }}
          direction={fromStreet ? "right" : ""}
        />
        {trafficLanes.map(({ id, ...lane }) => (
          <DrivingCar key={id} {...lane} />
        ))}
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
        {showTalkOverlay && (
          <TalkOverlay
            portrait={portrait}
            mood={mood}
            speech={speech}
            onNext={runNextStep}
          />
        )}
      </section>

      <RainOverlay />
    </div>
  );
}

export default GreatPortlandStreetExterior;
