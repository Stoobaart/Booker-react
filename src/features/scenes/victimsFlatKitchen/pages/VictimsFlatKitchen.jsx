import { useCallback, useEffect, useMemo, useState } from "react";
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
import rainAudio from "../../../../assets/music/rain-interior.mp3";
import RainyWindow from "../../../../shared/components/RainyWindow";
import windowView from "../../../../assets/images/backgrounds/victims-flat-kitchen-window.png";
import OpeningDoor from "../components/OpeningDoor";
import { arrivalFromHallway, binOccluder, exits, hotspots, kitchenWindow, obstacles, openings } from "../data/victimsFlatKitchenObjects";
import "./VictimsFlatKitchen.scss";

function VictimsFlatKitchen() {
  const dispatch = useDispatch();

  useMusic(rainAudio, { volume: 0.45 });

  const { showTalkOverlay, speech, isTyping, portrait, mood, runNextStep, setLinesAndSpeak } = useTalkActions();
  const inspect = useInspect(setLinesAndSpeak);
  // Opened by inspecting them, they stay open while he talks about what's inside, then swing shut
  const [opened, setOpened] = useState({});
  const doorState = (id) => (opened[id] ? (showTalkOverlay ? "open" : "closing") : null);
  const closed = useCallback((id) => setOpened((o) => Object.fromEntries(Object.entries(o).filter(([k]) => k !== id))), []);
  const blocking = useMemo(
    () => [...obstacles, ...openings.filter((o) => opened[o.id] && o.footprint).map((o) => o.footprint)],
    [opened],
  );

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
        <WalkArea scene="victims-flat-kitchen" obstacles={blocking} />
        <Frank
          scale={1.53}
          backScale={0.69}
          startPosition={arrivalFromHallway}
          direction="up"
        />
        <Occluder {...binOccluder} />
        {openings.map((opening) => (
          <OpeningDoor key={opening.id} {...opening} state={doorState(opening.id)} onClosed={closed} />
        ))}
        {exits.map((exit) => (
          <NavigationItem key={exit.id} {...exit} />
        ))}
        {hotspots.map((hotspot) => (
          <Hotspot
            key={hotspot.id}
            {...hotspot}
            onInspect={() => {
              if (hotspot.opens) setOpened((o) => ({ ...o, [hotspot.opens]: true }));
              inspect(hotspot);
            }}
          />
        ))}
        {showTalkOverlay && (
          <TalkOverlay portrait={portrait} mood={mood} speech={speech} isTyping={isTyping} onNext={runNextStep} />
        )}
        <div className="victims-flat-kitchen__flicker" aria-hidden="true" />
      </section>
    </div>
  );
}

export default VictimsFlatKitchen;
