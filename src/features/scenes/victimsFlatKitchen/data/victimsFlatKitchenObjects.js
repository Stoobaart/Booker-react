import pedalBin from "../../../../assets/images/backgrounds/victims-flat-kitchen-bin.png";

// His feet are just below the screen
export const arrivalFromHallway = { x: "844px", y: "606px" };

// Position printed by tools/backgrounds/victims-flat-kitchen.py
export const kitchenWindow = {
  position: { x: "860px", y: "276px" },
  size: { width: "200px", height: "160px" },
};

export const exits = [
  {
    id: "to-hallway",
    name: "Hallway",
    description: "Back out to the hall",
    position: { x: "480px", y: "940px" },
    size: { width: "960px", height: "40px" },
    zIndex: 2,
    walkTo: { x: "960px", y: "1055px" },
    to: "/victims-flat-hallway",
  },
];

export const binOccluder = {
  id: "pedal-bin",
  sprite: pedalBin,
  position: { x: "1036px", y: "584px" },
  baseY: 744,
  footprint: { left: 1031, right: 1123, top: 727, bottom: 762 },
};

export const obstacles = [binOccluder.footprint];

export const hotspots = [
  {
    id: "sink",
    name: "The sink",
    position: { x: "885px", y: "435px" },
    size: { width: "80px", height: "65px" },
    standAt: { x: "960px", y: "712px" },
    face: "up",
    lines: [
      { character: "frank", mood: "regular", line: "Two mugs, cold tea in both." },
      { character: "frank", mood: "regular", line: "Nobody makes two cups of tea for themselves." },
    ],
    noteId: "flat-kitchen-sink",
  },
  {
    id: "pedal-bin",
    name: "The pedal bin",
    position: { x: "1035px", y: "580px" },
    size: { width: "85px", height: "180px" },
    standAt: { x: "955px", y: "745px" },
    face: "right",
    lines: [
      { character: "frank", mood: "regular", line: "Two empty bottles of Scotch, the cheap stuff." },
      { character: "frank", mood: "regular", line: "And a photograph, torn up small. Someone meant it." },
    ],
    noteId: "flat-kitchen-pedal-bin",
  },
];
