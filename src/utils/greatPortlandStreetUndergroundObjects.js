const greatPortlandStreetUndergroundObjects = [
  {
    id: "banana-1",
    name: "Banana",
    description: "A slightly bruised banana",
    sprite:
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Ctext x="5" y="30" font-size="30"%3E🍌%3C/text%3E%3C/svg%3E',
    position: { x: "450px", y: "700px" },
    lines: [
      { character: "frank", mood: "regular", line: "A banana? Sure, I'll take it." },
      { character: "frank", mood: "regular", line: "Might come in handy later..." },
    ],
  },
  {
    id: "car-1",
    name: "Toy Car",
    description: "A small red toy car",
    sprite:
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Ctext x="5" y="30" font-size="30"%3E🚗%3C/text%3E%3C/svg%3E',
    position: { x: "800px", y: "800px" },
    lines: [
      { character: "frank", mood: "regular", line: "Oh nice, a toy car!" },
      { character: "frank", mood: "angry", line: "I wonder what I should do with this..." },
    ],
  },
  {
    id: "beer-1",
    name: "Beer",
    description: "A cold bottle of beer",
    sprite:
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Ctext x="5" y="30" font-size="30"%3E🍺%3C/text%3E%3C/svg%3E',
    position: { x: "1050px", y: "850px" },
    lines: [
      { character: "frank", mood: "regular", line: "A cold one! Don't mind if I do." },
    ],
  },
];

export default greatPortlandStreetUndergroundObjects;
