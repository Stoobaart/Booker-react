import { useLocation } from "react-router-dom";
import "./GreatPortlandStreetTicketHall.scss";
import WalkArea from "../../../../shared/components/WalkArea";
import Frank from "../../../player/components/Frank";
import GreatPortlandStreetTicketHallImage from "../../../../assets/images/backgrounds/great-portland-street-ticket-hall.png";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentScene } from "../../../game/slices/gameSlice";
import useTalkActions from "../../../dialogue/hooks/useTalkActions";
import useInspect from "../../../investigation/hooks/useInspect";
import useMusic from "../../../../shared/hooks/useMusic";
import TalkOverlay from "../../../dialogue/components/TalkOverlay";
import NavigationItem from "../../../../shared/components/NavigationItem";
import NPC from "../../../../shared/components/NPC";
import StreetDoorway from "../components/StreetDoorway";
import TicketGate from "../components/TicketGate";
import Occluder from "../../../../shared/components/Occluder";
import undergroundAmbience from "../../../../assets/music/underground-ambience.wav";
import rainAudio from "../../../../assets/music/rain-exterior.wav";
import { barrierLockedLines, obstacles, occluders, platformExits, streetDoorway } from "../data/greatPortlandStreetTicketHallObjects";
import greatPortlandStreetTicketHallNPCs from "../data/greatPortlandStreetTicketHallNPCs";

function GreatPortlandStreetTicketHall() {
  const dispatch = useDispatch();
  const location = useLocation();
  const fromExterior =
    location.state?.from === "/great-portland-street-exterior";
  const barrierReleased = useSelector(
    (state) => state.game.storyProgress?.barrierReleased,
  );
  useMusic(undergroundAmbience, { volume: 0.2 });
  useMusic(rainAudio, { volume: 0.12 });

  useEffect(() => {
    dispatch(setCurrentScene("great-portland-street-ticket-hall"));
  }, [dispatch]);

  const {
    showTalkOverlay,
    speech,
    portrait,
    mood,
    runNextStep,
    setLinesAndSpeak,
  } = useTalkActions();
  const inspect = useInspect(setLinesAndSpeak);

  return (
    <div
      id="game-container"
      className="game-container"
    >
      <section className="great-portland-street-ticket-hall background">
        <StreetDoorway {...streetDoorway} />
        <img
          src={GreatPortlandStreetTicketHallImage}
          alt="Great Portland Street ticket hall"
        />
      </section>

      <section className="foreground">
        <WalkArea scene="great-portland-street-ticket-hall" obstacles={obstacles} />
        <TicketGate open={Boolean(barrierReleased)} />
        {/* The photo is taken from far back, so Frank is larger than elsewhere */}
        <Frank
          scale={1.35}
          startPosition={
            fromExterior ? { x: "50.5rem", y: "12.75rem" } : { x: "76.161px", y: "482.817px" }
          }
          direction={fromExterior ? "down" : "up"}
        />
        {occluders.map((occluder) => (
          <Occluder key={occluder.id} {...occluder} />
        ))}
        {showTalkOverlay && (
          <TalkOverlay
            portrait={portrait}
            mood={mood}
            speech={speech}
            onNext={runNextStep}
          />
        )}
        {greatPortlandStreetTicketHallNPCs.map((npc) => (
          <NPC
            key={npc.id}
            npc={npc}
            onInspect={npc.inspectLines && (() => inspect({ lines: npc.inspectLines, noteId: npc.inspectNoteId }))}
          />
        ))}
        <NavigationItem
          id="to-street"
          name="Great Portland Street exterior"
          description="Go through the ticket barriers to Great Portland Street"
          position={{ x: "50rem", y: "17rem" }}
          size={{ width: "13.5rem", height: "18rem" }}
          to="/great-portland-street-exterior"
          onBlocked={barrierReleased ? undefined : () => setLinesAndSpeak(barrierLockedLines)}
        />
        {platformExits.map((exit) => (
          <NavigationItem
            key={exit.id}
            id={exit.id}
            name="Great Portland Street platform"
            description="Head back down to the platform"
            position={exit.position}
            size={exit.size}
            to="/great-portland-street"
          />
        ))}
      </section>
    </div>
  );
}

export default GreatPortlandStreetTicketHall;
