import "./GreatPortlandStreet.scss";
import WalkArea from "../components/WalkArea";
import Frank from "../components/Frank";
import GreatPortlandStreetImage from "../assets/images/backgrounds/great-portland-street.png";
import { useState } from "react";
import PickupItem from "../components/PickupItem";
import useTalkActions from "../hooks/useTalkActions";
import portraitFrankRegular from "../assets/images/portraits/portrait-frank-regular.png";
import portraitFrankAngry from "../assets/images/portraits/portrait-frank-angry.png";

function GreatPortlandStreet() {
  const [pickedUpItems, setPickedUpItems] = useState([]);
  const {
    showTalkOverlay,
    speech,
    portrait,
    mood,
    runNextStep,
    setLinesAndSpeak,
  } = useTalkActions();

  const handleItemPickup = (itemId) => {
    setPickedUpItems((prev) => [...prev, itemId]);

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

  return (
    <div
      id="game-container"
      className="game-container"
    >
      <section className="great-portland-street background">
        <img
          src={GreatPortlandStreetImage}
          alt="Great Portland Street"
        />
      </section>

      <section className="foreground">
        <WalkArea scene="great-portland-street" />
        <Frank />
        {showTalkOverlay && (
          <div
            className="talk-overlay"
            onClick={runNextStep}
          >
            <div className={`portrait ${portrait}`}>
              <img
                id="portrait-sprite"
                className="portrait-image"
                src={mood === "angry" ? portraitFrankAngry : portraitFrankRegular}
                alt=""
              />
            </div>
            <div className="speech">{speech}</div>
          </div>
        )}
        {testItems.map(
          (item) =>
            !pickedUpItems.includes(item.id) && (
              <PickupItem
                key={item.id}
                id={item.id}
                name={item.name}
                description={item.description}
                sprite={item.sprite}
                position={item.position}
                onPickup={handleItemPickup}
              />
            )
        )}
      </section>
    </div>
  );
}

export default GreatPortlandStreet;
