import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { setCurrentScene } from "../../../game/slices/gameSlice";
import WalkArea from "../../../../shared/components/WalkArea";
import Frank from "../../../player/components/Frank";
import NavigationItem from "../../../../shared/components/NavigationItem";
import Occluder from "../../../../shared/components/Occluder";
import NPC from "../../../../shared/components/NPC";
import DrivingCar from "../../../../shared/components/DrivingCar";
import RainOverlay from "../../../../shared/components/RainOverlay";
import RainSplashes from "../../../../shared/components/RainSplashes";
import useMusic from "../../../../shared/hooks/useMusic";
import useSideScroll from "../../../../shared/hooks/useSideScroll";
import ResidentialStreetImage from "../../../../assets/images/backgrounds/residential-street.png";
import rainAudio from "../../../../assets/music/rain-exterior.wav";
import { GROUND_TOP, STREET_WIDTH, arrivalFromFlat, arrivalFromStation, exits, lampsOccluder, obstacles } from "../data/residentialStreetObjects";
import { trafficLanes } from "../data/residentialStreetTraffic";
import residentialStreetNPCs from "../data/residentialStreetNPCs";
import "./ResidentialStreet.scss";

// A long terrace, smart by the station and going to seed further along: it scrolls with Frank
function ResidentialStreet() {
  const dispatch = useDispatch();
  const worldRef = useRef(null);
  const location = useLocation();
  const fromFlat = location.state?.from === "/victims-flat-hallway";

  useMusic(rainAudio, { volume: 0.5 });
  useSideScroll(worldRef, STREET_WIDTH);

  useEffect(() => {
    dispatch(setCurrentScene("residential-street"));
  }, [dispatch]);

  return (
    <div
      id="game-container"
      className="game-container"
    >
      <div
        ref={worldRef}
        className="scene-world"
        style={{ width: `${STREET_WIDTH}px` }}
      >
        <section className="residential-street background">
          <img
            src={ResidentialStreetImage}
            alt="A residential street"
          />
        </section>

        <section className="foreground">
          <RainSplashes top={GROUND_TOP} width={STREET_WIDTH} />
          <WalkArea scene="residential-street" obstacles={obstacles} />
          <Frank
            scale={0.85}
            // the pavement is shallow, so he shrinks less walking back along it
            backScale={0.9}
            startPosition={fromFlat ? arrivalFromFlat : arrivalFromStation}
            direction={fromFlat ? "down" : "left"}
          />
          {residentialStreetNPCs.map((npc) => (
            <NPC key={npc.id} npc={npc} />
          ))}
          <Occluder {...lampsOccluder} />
          {exits.map((exit) => (
            <NavigationItem key={exit.id} {...exit} />
          ))}
        </section>
      </div>

      {/* On the screen, not in the street, so a car is only seen and heard as it goes by */}
      {trafficLanes.map(({ id, ...lane }) => (
        <DrivingCar key={id} {...lane} />
      ))}
      <RainOverlay />
    </div>
  );
}

export default ResidentialStreet;
