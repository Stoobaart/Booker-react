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
import KitchenImage from "../../../../assets/images/backgrounds/victims-flat-kitchen.png";
import rainAudio from "../../../../assets/music/rain-interior.wav";
import RainyWindow from "../../../../shared/components/RainyWindow";
import windowView from "../../../../assets/images/backgrounds/victims-flat-kitchen-window.png";
import { arrivalFromHallway, binOccluder, exits, hotspots, kitchenWindow, obstacles } from "../data/victimsFlatKitchenObjects";
import "./VictimsFlatKitchen.scss";

// The victim's kitchen: a narrow galley lit by one failing fluorescent tube, the rain on the window
function VictimsFlatKitchen() {
  const dispatch = useDispatch();

  // The rain outside, a little louder here with the window right there
  useMusic(rainAudio, { volume: 0.45 });

  const { showTalkOverlay, speech, portrait, mood, runNextStep, setLinesAndSpeak } = useTalkActions();
  const inspect = useInspect(setLinesAndSpeak);

  useEffect(() => {
    dispatch(setCurrentScene("victims-flat-kitchen"));
  }, [dispatch]);

  return (
    <div
      id="game-container"
      className="game-container"
    >
      <section className="victims-flat-kitchen background">
        <RainyWindow {...kitchenWindow} view={windowView} />
        <img
          src={KitchenImage}
          alt="A dingy galley kitchen under a fluorescent light"
        />
      </section>

      <section className="foreground">
        <WalkArea scene="victims-flat-kitchen" obstacles={obstacles} />
        {/* About 1.75m tall wherever he stands on the lino: the living room's camera, but the floor
            runs further back and down to just below the screen */}
        <Frank
          scale={1.53}
          backScale={0.69}
          startPosition={arrivalFromHallway}
          direction="up"
        />
        <Occluder {...binOccluder} />
        {exits.map((exit) => (
          <NavigationItem key={exit.id} {...exit} />
        ))}
        {hotspots.map((hotspot) => (
          <Hotspot key={hotspot.id} {...hotspot} onInspect={() => inspect(hotspot)} />
        ))}
        {showTalkOverlay && (
          <TalkOverlay portrait={portrait} mood={mood} speech={speech} onNext={runNextStep} />
        )}
        {/* Now and then the tube stutters and the whole room dips */}
        <div className="victims-flat-kitchen__flicker" aria-hidden="true" />
      </section>
    </div>
  );
}

export default VictimsFlatKitchen;
