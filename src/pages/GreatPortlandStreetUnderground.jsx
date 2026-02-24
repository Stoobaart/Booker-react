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

  const handleItemPickup = () => {
    // Test lines for talk overlay
    setLinesAndSpeak([
      {
        character: "frank",
        mood: "regular",
        line: "Oh nice, I picked something up!",
      },
      {
        character: "frank",
        mood: "angry",
        line: "I wonder what I should do with this...",
      },
    ]);
  };

  const testItems = [
    {
      id: "banana-1",
      name: "Banana",
      description: "A slightly bruised banana",
      sprite:
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Ctext x="5" y="30" font-size="30"%3E🍌%3C/text%3E%3C/svg%3E',
      position: { x: "450px", y: "700px" },
    },
    {
      id: "car-1",
      name: "Toy Car",
      description: "A small red toy car",
      sprite:
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Ctext x="5" y="30" font-size="30"%3E🚗%3C/text%3E%3C/svg%3E',
      position: { x: "800px", y: "800px" },
    },
    {
      id: "beer-1",
      name: "Beer",
      description: "A cold bottle of beer",
      sprite:
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Ctext x="5" y="30" font-size="30"%3E🍺%3C/text%3E%3C/svg%3E',
      position: { x: "1050px", y: "850px" },
    },
  ];

  const navItems = [
    {
      id: "to-street",
      name: "Great Portland Street exterior",
      description: "Head north to Great Portland Street exterior",
      position: { x: "3rem", y: "20rem" },
      size: { width: "15rem", height: "21rem" },
      to: "/great-portland-street-exterior",
    },
  ];

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
        {testItems.map(
          (item) =>
            !inventoryItems.some((inv) => inv.id === item.id) && (
              <PickupItem
                key={item.id}
                id={item.id}
                name={item.name}
                description={item.description}
                sprite={item.sprite}
                position={item.position}
                onPickup={handleItemPickup}
              />
            ),
        )}
        {navItems.map((nav) => (
          <NavigationItem
            key={nav.id}
            id={nav.id}
            name={nav.name}
            description={nav.description}
            position={nav.position}
            size={nav.size}
            to={nav.to}
          />
        ))}
      </section>
    </div>
  );
}

export default GreatPortlandStreetUnderground;
