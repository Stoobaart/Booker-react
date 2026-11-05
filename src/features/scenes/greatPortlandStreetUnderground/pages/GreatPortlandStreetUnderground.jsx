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
import useFrankNudges from "../../../dialogue/hooks/useFrankNudges";
import useInspect from "../../../investigation/hooks/useInspect";
import useMusic from "../../../../shared/hooks/useMusic";
import TalkOverlay from "../../../dialogue/components/TalkOverlay";
import NavigationItem from "../../../../shared/components/NavigationItem";
import Hotspot from "../../../../shared/components/Hotspot";
import Train from "../components/Train";
import GameModal from "../../../../shared/components/GameModal";
import NewspaperContent from "../components/NewspaperContent";
import { playSound } from "../../../../shared/utils/gameAudio";
import undergroundAmbience from "../../../../assets/music/underground-ambience.mp3";
import pageTurnSfx from "../../../../assets/sfx/page-turn.wav";
import greatPortlandStreetUndergroundObjects, { hotspots, obstacles } from "../data/greatPortlandStreetUndergroundObjects";

const MODAL_COMPONENTS = {
  newspaper: NewspaperContent,
};

// Played as a modal opens and again as it closes
const MODAL_SOUNDS = {
  newspaper: { src: pageTurnSfx, volume: 0.6 },
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
  const [modalAudio] = useState(() => new Map());
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
    isTyping,
    portrait,
    mood,
    runNextStep,
    setLinesAndSpeak,
  } = useTalkActions();
  useFrankNudges({ showTalkOverlay, setLinesAndSpeak });

  const inspect = useInspect(setLinesAndSpeak);

  const handleItemInteraction = (lines) => {
    if (lines) {
      setLinesAndSpeak(lines);
    }
  };

  const playModalSound = (modal) => {
    const sound = MODAL_SOUNDS[modal.type];
    if (!sound) return;
    if (!modalAudio.has(modal.type)) {
      const audio = new Audio(sound.src);
      audio.volume = sound.volume;
      modalAudio.set(modal.type, audio);
    }
    const audio = modalAudio.get(modal.type);
    audio.currentTime = 0;
    playSound(audio).catch(() => {});
  };

  const openModal = (modal) => {
    playModalSound(modal);
    setActiveModal(modal);
  };

  const closeModal = () => {
    playModalSound(activeModal);
    setActiveModal(null);
  };

  const handleInspect = (item) => {
    if (item.modal) openModal(item.modal);
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
        <WalkArea scene="great-portland-street" obstacles={obstacles} />
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
            isTyping={isTyping}
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
                spriteWidth={item.spriteWidth}
                position={item.position}
                standAt={item.standAt}
                face={item.face}
                collectable={item.collectable}
                onInspect={() => handleInspect(item)}
                onPickup={() => handleItemInteraction()}
              />
            ),
        )}
        {hotspots.map((hotspot) => (
          <Hotspot key={hotspot.id} {...hotspot} onInspect={() => inspect(hotspot)} />
        ))}
        {activeModal && (() => {
          const ModalContent = MODAL_COMPONENTS[activeModal.type];
          return (
            <GameModal onClose={closeModal}>
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
