import "./GreatPortlandStreetUnderground.scss";
import WalkArea from "../components/WalkArea";
import Frank from "../components/Frank";
import GreatPortlandStreetUndergroundImage from "../assets/images/backgrounds/great-portland-street.png";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentScene } from "../store/gameSlice";
import PickupItem from "../components/PickupItem";
import useTalkActions from "../hooks/useTalkActions";
import useMusic from "../hooks/useMusic";
import TalkOverlay from "../components/TalkOverlay";
import NavigationItem from "../components/NavigationItem";
import undergroundAmbience from "../assets/music/underground-ambience.wav";
import greatPortlandStreetUndergroundObjects from "../utils/greatPortlandStreetUndergroundObjects";

function GreatPortlandStreetUnderground() {
  const dispatch = useDispatch();
  const inventoryItems = useSelector((state) => state.inventory.items);
  useMusic(undergroundAmbience, { volume: 0.5 });

  useEffect(() => {
    dispatch(setCurrentScene("great-portland-street"));
  }, [dispatch]);

  const {
    showTalkOverlay,
    speech,
    portrait,
    mood,
    runNextStep,
    setLinesAndSpeak,
  } = useTalkActions();

  const handleItemPickup = (lines) => {
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
        <WalkArea scene="great-portland-street" />
        <Frank startPosition={{ x: "7%", y: "22rem" }} />
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
                onPickup={() => handleItemPickup(item.lines)}
              />
            ),
        )}
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
