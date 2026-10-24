import { useLocation } from "react-router-dom";
import "./GreatPortlandStreetUnderground.scss";
import WalkArea from "../../../../shared/components/WalkArea";
import Frank from "../../../player/components/Frank";
import GreatPortlandStreetUndergroundImage from "../../../../assets/images/backgrounds/great-portland-street.png";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentScene, setStoryProgress } from "../../../game/slices/gameSlice";
import PickupItem from "../../../../shared/components/PickupItem";
import useTalkActions from "../../../dialogue/hooks/useTalkActions";
import useInspect from "../../../investigation/hooks/useInspect";
import useMusic from "../../../../shared/hooks/useMusic";
import TalkOverlay from "../../../dialogue/components/TalkOverlay";
import NavigationItem from "../../../../shared/components/NavigationItem";
import Train from "../components/Train";
import GameModal from "../../../../shared/components/GameModal";
import NewspaperContent from "../components/NewspaperContent";
import undergroundAmbience from "../../../../assets/music/underground-ambience.wav";
import greatPortlandStreetUndergroundObjects from "../data/greatPortlandStreetUndergroundObjects";

const MODAL_COMPONENTS = {
  newspaper: NewspaperContent,
};

function GreatPortlandStreetUnderground() {
  const dispatch = useDispatch();
  const location = useLocation();
  const fromTicketHall =
    location.state?.from === "/great-portland-street-ticket-hall";
  const inventoryItems = useSelector((state) => state.inventory.items);
  const arrivedAtStation = useSelector(
    (state) => state.game.storyProgress?.arrivedAtStation,
  );
  const [showTrain] = useState(() => !arrivedAtStation);
  const [activeModal, setActiveModal] = useState(null);
  useMusic(undergroundAmbience, { volume: 0.5 });

  useEffect(() => {
    dispatch(setCurrentScene("great-portland-street"));
    if (showTrain) {
      dispatch(setStoryProgress("arrivedAtStation"));
    }
  }, [dispatch, showTrain]);

  const {
    showTalkOverlay,
    speech,
    portrait,
    mood,
    runNextStep,
    setLinesAndSpeak,
  } = useTalkActions();

  const inspect = useInspect(setLinesAndSpeak);

  const handleItemInteraction = (lines) => {
    if (lines) {
      setLinesAndSpeak(lines);
    }
  };

  // Reading the paper opens it up; anything else, Frank says what he sees. Either way, its note
  // goes in his notebook.
  const handleInspect = (item) => {
    if (item.modal) setActiveModal(item.modal);
    inspect(item);
  };

  return (
    <div
      id="game-container"
      className="game-container"
    >
      <section className="great-portland-street background">
        <img
          src={GreatPortlandStreetUndergroundImage}
          alt="Great Portland Street"
        />
      </section>

      <section className="foreground">
        {showTrain && <Train />}
        <WalkArea scene="great-portland-street" />
        <Frank
          startPosition={
            fromTicketHall ? { x: "3rem", y: "20rem" } : { x: "77%", y: "22rem" }
          }
          direction={fromTicketHall ? "down" : "left"}
        />
        {showTalkOverlay && (
          <TalkOverlay
            portrait={portrait}
            mood={mood}
            speech={speech}
            onNext={runNextStep}
          />
        )}
        {greatPortlandStreetUndergroundObjects.map(
          (item) =>
            !inventoryItems.some((inv) => inv.id === item.id) && (
              <PickupItem
                key={item.id}
                id={item.id}
                name={item.name}
                description={item.description}
                sprite={item.sprite}
                position={item.position}
                collectable={item.collectable}
                onInspect={() => handleInspect(item)}
                onPickup={() => handleItemInteraction()}
              />
            ),
        )}
        {activeModal && (() => {
          const ModalContent = MODAL_COMPONENTS[activeModal.type];
          return (
            <GameModal onClose={() => setActiveModal(null)}>
              <ModalContent {...activeModal.props} />
            </GameModal>
          );
        })()}
        <NavigationItem
          id="to-ticket-hall"
          name="Great Portland Street ticket hall"
          description="Go up the stairs to the ticket hall"
          position={{ x: "0rem", y: "22rem" }}
          size={{ width: "15.5rem", height: "26rem" }}
          to="/great-portland-street-ticket-hall"
        />
      </section>
    </div>
  );
}

export default GreatPortlandStreetUnderground;
