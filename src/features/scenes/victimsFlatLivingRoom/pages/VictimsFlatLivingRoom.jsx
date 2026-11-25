import { useEffect, useState } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { setCurrentScene } from "../../../game/slices/gameSlice";
import WalkArea from "../../../../shared/components/WalkArea";
import Frank from "../../../player/components/Frank";
import NavigationItem from "../../../../shared/components/NavigationItem";
import Occluder from "../../../../shared/components/Occluder";
import useMusic from "../../../../shared/hooks/useMusic";
import Hotspot from "../../../../shared/components/Hotspot";
import NPC from "../../../../shared/components/NPC";
import TalkOverlay from "../../../dialogue/components/TalkOverlay";
import useTalkActions from "../../../dialogue/hooks/useTalkActions";
import useInspect from "../../../investigation/hooks/useInspect";
import { selectHasDiscoveredNote } from "../../../investigation/slices/investigationSlice";
import Laptop from "../components/Laptop";
import { addItem } from "../../../inventory/slices/inventorySlice";
import { inventoryItems } from "../../../inventory/data/items";
import LivingRoomImage from "../../../../assets/images/backgrounds/victims-flat-living-room.png";
import rainAudio from "../../../../assets/music/rain-interior.mp3";
import { arrivalFromHallway, exits, hotspots, obstacles, occluders, props, victimBody } from "../data/victimsFlatLivingRoomObjects";
import victimsFlatLivingRoomNPCs from "../data/victimsFlatLivingRoomNPCs";
import "./VictimsFlatLivingRoom.scss";

function VictimsFlatLivingRoom() {
  const dispatch = useDispatch();
  const store = useStore();
  const [laptopOpen, setLaptopOpen] = useState(false);
  const carriedItems = useSelector((state) => state.inventory.items);
  const isCarried = (itemId) => carriedItems.some((item) => item.id === itemId);

  useMusic(rainAudio, { volume: 0.3 });

  const { showTalkOverlay, speech, isTyping, portrait, mood, runNextStep, setLinesAndSpeak } = useTalkActions();
  const inspect = useInspect(setLinesAndSpeak);

  useEffect(() => {
    dispatch(setCurrentScene("victims-flat-living-room"));
  }, [dispatch]);

  const inspectHotspot = (hotspot) => {
    if (hotspot.opensLaptop) return setLaptopOpen(true);
    const later = hotspot.linesOnceNoted;
    const knows = later && selectHasDiscoveredNote(store.getState(), later.noteId);
    inspect(knows ? { ...hotspot, lines: later.lines } : hotspot);
  };

  const pickUp = ({ pickup, noteId }) => {
    const { id, name, description, sprite } = inventoryItems[pickup.itemId];
    dispatch(addItem({ id, name, description, sprite }));
    inspect({ lines: pickup.lines, noteId });
  };

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
        <Frank
          scale={1.34}
          backScale={0.72}
          startPosition={arrivalFromHallway}
          direction="right"
        />
        <Occluder {...victimBody} />
        {occluders.map((occluder) => (
          <Occluder key={occluder.id} {...occluder} />
        ))}
        {props
          .filter((prop) => !isCarried(prop.itemId))
          .map((prop) => (
            <Occluder key={prop.id} {...prop} />
          ))}
        {exits.map((exit) => (
          <NavigationItem key={exit.id} {...exit} />
        ))}
        {victimsFlatLivingRoomNPCs.map((npc) => (
          <NPC key={npc.id} npc={npc} />
        ))}
        {hotspots
          .filter((hotspot) => !isCarried(hotspot.pickup?.itemId))
          .map((hotspot) => (
            <Hotspot
              key={hotspot.id}
              {...hotspot}
              onInspect={() => inspectHotspot(hotspot)}
              onPickup={hotspot.pickup && (() => pickUp(hotspot))}
            />
          ))}
        {showTalkOverlay && (
          <TalkOverlay portrait={portrait} mood={mood} speech={speech} isTyping={isTyping} onNext={runNextStep} />
        )}
        {laptopOpen && <Laptop onClose={() => setLaptopOpen(false)} />}
      </section>
    </div>
  );
}

export default VictimsFlatLivingRoom;
