import { useLocation } from "react-router-dom";
import "./GreatPortlandStreetUnderground.scss";
import WalkArea from "../components/WalkArea";
import Frank from "../components/Frank";
import GreatPortlandStreetUndergroundImage from "../assets/images/backgrounds/great-portland-street.png";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentScene, setStoryProgress } from "../store/gameSlice";
import PickupItem from "../components/PickupItem";
import useTalkActions from "../hooks/useTalkActions";
import useMusic from "../hooks/useMusic";
import TalkOverlay from "../components/TalkOverlay";
import NavigationItem from "../components/NavigationItem";
import Train from "../components/Train";
import GameModal from "../components/GameModal";
import NewspaperContent from "../components/NewspaperContent";
import undergroundAmbience from "../assets/music/underground-ambience.wav";
import greatPortlandStreetUndergroundObjects from "../utils/greatPortlandStreetUndergroundObjects";

const MODAL_COMPONENTS = {
  newspaper: NewspaperContent,
};

function GreatPortlandStreetUnderground() {
  const dispatch = useDispatch();
  const location = useLocation();
  const fromExterior =
    location.state?.from === "/great-portland-street-exterior";
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

  const handleItemInteraction = (lines) => {
    if (lines) {
      setLinesAndSpeak(lines);
    }
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
            fromExterior ? { x: "3rem", y: "20rem" } : { x: "77%", y: "22rem" }
          }
          direction={fromExterior ? "down" : "left"}
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
                onInspect={() => item.modal ? setActiveModal(item.modal) : handleItemInteraction(item.lines)}
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
          id="to-street"
          name="Great Portland Street exterior"
          description="Head north to Great Portland Street exterior"
          position={{ x: "3rem", y: "20rem" }}
          size={{ width: "15rem", height: "21rem" }}
          to="/great-portland-street-exterior"
        />
      </section>
    </div>
  );
}

export default GreatPortlandStreetUnderground;
