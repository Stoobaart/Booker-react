import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setCurrentScene } from "../../../game/slices/gameSlice";
import WalkArea from "../../../../shared/components/WalkArea";
import Frank from "../../../player/components/Frank";
import NavigationItem from "../../../../shared/components/NavigationItem";
import Occluder from "../../../../shared/components/Occluder";
import RainyWindow from "../../../../shared/components/RainyWindow";
import useMusic from "../../../../shared/hooks/useMusic";
import Hotspot from "../../../../shared/components/Hotspot";
import TalkOverlay from "../../../dialogue/components/TalkOverlay";
import useTalkActions from "../../../dialogue/hooks/useTalkActions";
import useInspect from "../../../investigation/hooks/useInspect";
import BedroomImage from "../../../../assets/images/backgrounds/victims-flat-bedroom.png";
import windowView from "../../../../assets/images/backgrounds/victims-flat-bedroom-window.png";
import rainAudio from "../../../../assets/music/rain-interior.wav";
import FairyLights from "../components/FairyLights";
import { arrivalFromHallway, bedroomWindow, exits, fairyLights, hotspots, obstacles, occluders } from "../data/victimsFlatBedroomObjects";
import "./VictimsFlatBedroom.scss";

function VictimsFlatBedroom() {
  const dispatch = useDispatch();

  useMusic(rainAudio, { volume: 0.45 });

  const { showTalkOverlay, speech, portrait, mood, runNextStep, setLinesAndSpeak } = useTalkActions();
  const inspect = useInspect(setLinesAndSpeak);

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
        {hotspots.map((hotspot) => (
          <Hotspot key={hotspot.id} {...hotspot} onInspect={() => inspect(hotspot)} />
        ))}
        {showTalkOverlay && (
          <TalkOverlay portrait={portrait} mood={mood} speech={speech} onNext={runNextStep} />
        )}
      </section>
    </div>
  );
}

export default VictimsFlatBedroom;
