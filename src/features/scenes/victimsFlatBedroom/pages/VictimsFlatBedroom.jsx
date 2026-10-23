import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setCurrentScene } from "../../../game/slices/gameSlice";
import WalkArea from "../../../../shared/components/WalkArea";
import Frank from "../../../player/components/Frank";
import NavigationItem from "../../../../shared/components/NavigationItem";
import Occluder from "../../../../shared/components/Occluder";
import RainyWindow from "../../../../shared/components/RainyWindow";
import useMusic from "../../../../shared/hooks/useMusic";
import BedroomImage from "../../../../assets/images/backgrounds/victims-flat-bedroom.png";
import windowView from "../../../../assets/images/backgrounds/victims-flat-bedroom-window.png";
import rainAudio from "../../../../assets/music/rain-interior.wav";
import FairyLights from "../components/FairyLights";
import { arrivalFromHallway, bedroomWindow, exits, fairyLights, obstacles, occluders } from "../data/victimsFlatBedroomObjects";
import "./VictimsFlatBedroom.scss";

// The victim's bedroom: posters, fairy lights round the window, and an expensive computer in the
// corner with its screensaver running
function VictimsFlatBedroom() {
  const dispatch = useDispatch();

  // The rain outside, on the window right there
  useMusic(rainAudio, { volume: 0.45 });

  useEffect(() => {
    dispatch(setCurrentScene("victims-flat-bedroom"));
  }, [dispatch]);

  return (
    <div
      id="game-container"
      className="game-container"
    >
      <section className="victims-flat-bedroom background">
        <RainyWindow {...bedroomWindow} view={windowView} />
        <img
          src={BedroomImage}
          alt="A bedroom at night, lit by a bedside lamp, fairy lights and a computer screen"
        />
        <FairyLights bulbs={fairyLights} />
      </section>

      <section className="foreground">
        <WalkArea scene="victims-flat-bedroom" obstacles={obstacles} />
        {/* About 1.75m tall wherever he stands on the carpet: the kitchen's camera and floor depth */}
        <Frank
          scale={1.53}
          backScale={0.66}
          startPosition={arrivalFromHallway}
          direction="up"
        />
        {occluders.map((occluder) => (
          <Occluder key={occluder.id} {...occluder} />
        ))}
        {exits.map((exit) => (
          <NavigationItem key={exit.id} {...exit} />
        ))}
      </section>
    </div>
  );
}

export default VictimsFlatBedroom;
