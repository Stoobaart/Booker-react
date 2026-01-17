import "./TestArea.scss";
import TestAreaImage from "../assets/images/backgrounds/test-area.png";
import rainGif from "../assets/images/backgrounds/rain.gif";
import clockObject from "../assets/images/objects/clock.gif";
import { useEffect, useRef, useState } from "react";
import testAreaPianoAudio from "../assets/music/test-area-piano.wav";
import rainAudio from "../assets/music/rain-interior.wav";
import WalkArea from "../components/WalkArea";
import Frank from "../components/Frank";
import PickupItem from "../components/PickupItem";

function TestArea() {
  const rainAudioRef = useRef(new Audio(rainAudio));
  const testAreaPianoAudioRef = useRef(new Audio(testAreaPianoAudio));
  const [pickedUpItems, setPickedUpItems] = useState([]);

  const handleItemPickup = (itemId) => {
    setPickedUpItems((prev) => [...prev, itemId]);
  };

  // Test items - replace sprite URLs with actual images later
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

  useEffect(() => {
    const rainAudio = rainAudioRef.current;
    rainAudio.loop = true;
    const testAreaPianoAudio = testAreaPianoAudioRef.current;
    testAreaPianoAudio.loop = true;

    rainAudio.play();
    testAreaPianoAudio.play();

    return () => {
      rainAudio.pause();
      testAreaPianoAudio.pause();
    };
  }, []);

  return (
    <div
      id="game-container"
      className="game-container"
    >
      <section className="test-area background">
        <img
          className="rain"
          src={rainGif}
          alt=""
        />
        <img
          className="scene"
          src={TestAreaImage}
          alt=""
        />
        <img
          className="clock"
          src={clockObject}
          alt=""
        />
      </section>

      <section className="foreground">
        <WalkArea scene="test-area" />
        <Frank />

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

export default TestArea;
