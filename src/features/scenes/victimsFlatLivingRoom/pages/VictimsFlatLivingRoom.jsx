import { useEffect } from "react";
import { useDispatch } from "react-redux";
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
import LivingRoomImage from "../../../../assets/images/backgrounds/victims-flat-living-room.png";
import rainAudio from "../../../../assets/music/rain-interior.wav";
import { arrivalFromHallway, exits, hotspots, obstacles, occluders } from "../data/victimsFlatLivingRoomObjects";
import "./VictimsFlatLivingRoom.scss";

// The victim's living room: not redecorated in decades, lit by one table lamp, the TV off
function VictimsFlatLivingRoom() {
  const dispatch = useDispatch();

  // The rain outside, muffled
  useMusic(rainAudio, { volume: 0.3 });

  const { showTalkOverlay, speech, portrait, mood, runNextStep, setLinesAndSpeak } = useTalkActions();
  const inspect = useInspect(setLinesAndSpeak);

  useEffect(() => {
    dispatch(setCurrentScene("victims-flat-living-room"));
  }, [dispatch]);

  return (
    <div
      id="game-container"
      className="game-container"
    >
      <section className="victims-flat-living-room background">
        <img
          src={LivingRoomImage}
          alt="A dark, old-fashioned living room"
        />
      </section>

      <section className="foreground">
        <WalkArea scene="victims-flat-living-room" obstacles={obstacles} />
        {/* About 1.75m tall wherever he stands on the carpet */}
        <Frank
          scale={1.34}
          backScale={0.72}
          startPosition={arrivalFromHallway}
          direction="right"
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

export default VictimsFlatLivingRoom;
