const greatPortlandStreetUndergroundObjects = [
  {
    id: "banana-1",
    name: "Banana",
    description: "A slightly bruised banana",
    sprite:
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Ctext x="5" y="30" font-size="30"%3E🍌%3C/text%3E%3C/svg%3E',
    position: { x: "450px", y: "700px" },
    collectable: true,
    lines: [
      { character: "frank", mood: "regular", line: "A banana. Looks a bit past it." },
      { character: "frank", mood: "regular", line: "Someone's left this here for a while." },
    ],
  },
  {
    id: "car-1",
    name: "Toy Car",
    description: "A small red toy car",
    sprite:
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Ctext x="5" y="30" font-size="30"%3E🚗%3C/text%3E%3C/svg%3E',
    position: { x: "800px", y: "800px" },
    collectable: true,
    lines: [
      { character: "frank", mood: "regular", line: "A toy car. On a tube platform." },
      { character: "frank", mood: "angry", line: "Some kid's going to be gutted about that." },
    ],
  },
  {
    id: "beer-1",
    name: "Beer",
    description: "A cold bottle of beer",
    sprite:
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Ctext x="5" y="30" font-size="30"%3E🍺%3C/text%3E%3C/svg%3E',
    position: { x: "1050px", y: "850px" },
    collectable: true,
    lines: [
      { character: "frank", mood: "regular", line: "Someone left a beer down here." },
      { character: "frank", mood: "regular", line: "Still cold too. Tube's good for something." },
    ],
  },
];

export default greatPortlandStreetUndergroundObjects;
