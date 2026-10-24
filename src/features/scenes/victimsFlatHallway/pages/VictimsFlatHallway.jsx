import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { setCurrentScene } from "../../../game/slices/gameSlice";
import WalkArea from "../../../../shared/components/WalkArea";
import Frank from "../../../player/components/Frank";
import NavigationItem from "../../../../shared/components/NavigationItem";
import Occluder from "../../../../shared/components/Occluder";
import useMusic from "../../../../shared/hooks/useMusic";
import Hotspot from "../../../../shared/components/Hotspot";
import TalkOverlay from "../../../dialogue/components/TalkOverlay";
import useTalkActions from "../../../dialogue/hooks/useTalkActions";
import useInspect from "../../../investigation/hooks/useInspect";
import HallwayImage from "../../../../assets/images/backgrounds/victims-flat-hallway.png";
import rainAudio from "../../../../assets/music/rain-interior.wav";
import { arrivalFromBedroom, arrivalFromKitchen, arrivalFromLivingRoom, arrivalFromStreet, exits, hotspots, obstacles, tableOccluder } from "../data/victimsFlatHallwayObjects";
import "./VictimsFlatHallway.scss";

// The victim's hallway: windowless, one weak bulb, three doors and a table of unopened post
function VictimsFlatHallway() {
  const dispatch = useDispatch();
  const location = useLocation();
  const from = location.state?.from;
  // Back out of a room, he's in front of its door; in from the street, by the front door
  const arrival = {
    "/victims-flat-living-room": { position: arrivalFromLivingRoom, direction: "down" },
    "/victims-flat-kitchen": { position: arrivalFromKitchen, direction: "right" },
    "/victims-flat-bedroom": { position: arrivalFromBedroom, direction: "down" },
  }[from] ?? { position: arrivalFromStreet, direction: "up" };

  // The rain outside, muffled
  useMusic(rainAudio, { volume: 0.4 });

  const { showTalkOverlay, speech, portrait, mood, runNextStep, setLinesAndSpeak } = useTalkActions();
  const inspect = useInspect(setLinesAndSpeak);

  useEffect(() => {
    dispatch(setCurrentScene("victims-flat-hallway"));
  }, [dispatch]);

  return (
    <div
      id="game-container"
      className="game-container"
    >
      <section className="victims-flat-hallway background">
        <img
          src={HallwayImage}
          alt="A dark hallway"
        />
      </section>

      <section className="foreground">
        <WalkArea scene="victims-flat-hallway" obstacles={obstacles} />
        {/* He starts right by the camera and the hall runs a long way back, so he shrinks a lot
            walking down it */}
        <Frank
          scale={1.8}
          backScale={0.44}
          startPosition={arrival.position}
          direction={arrival.direction}
        />
        <Occluder {...tableOccluder} />
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

export default VictimsFlatHallway;
