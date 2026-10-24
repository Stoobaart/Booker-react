import pedalBin from "../../../../assets/images/backgrounds/victims-flat-kitchen-bin.png";

// In from the hall, Frank stands in the kitchen doorway right by the camera, looking down the galley
// over his shoulder: his feet are just below the bottom of the screen
export const arrivalFromHallway = { x: "844px", y: "606px" };

// The panes of the window over the sink: a hole in the background, with the night and its rain
// behind it (tools/backgrounds/victims-flat-kitchen.py prints where it is)
export const kitchenWindow = {
  position: { x: "860px", y: "276px" },
  size: { width: "200px", height: "160px" },
};

// The near edge of the floor: back out through the door behind the viewer
export const exits = [
  {
    id: "to-hallway",
    name: "Hallway",
    description: "Back out to the hall",
    position: { x: "480px", y: "940px" },
    size: { width: "960px", height: "40px" },
    zIndex: 2,
    // back towards the camera, to where he came in
    walkTo: { x: "960px", y: "1055px" },
    to: "/victims-flat-hallway",
  },
];

// The overflowing pedal bin standing out on the lino: drawn over Frank while his feet are further
// back than its middle, and walked round
export const binOccluder = {
  id: "pedal-bin",
  sprite: pedalBin,
  position: { x: "1036px", y: "584px" },
  baseY: 744,
  footprint: { left: 1031, right: 1123, top: 727, bottom: 762 },
};

export const obstacles = [binOccluder.footprint];

// Things painted into the room that Frank can look at (shared/components/Hotspot): he walks to
// standAt, turns to face it and says its lines, and its note goes in his notebook
// (features/investigation/data/investigationNotes.js)
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
    // beside it, looking down into it
    standAt: { x: "955px", y: "745px" },
    face: "right",
    lines: [
      { character: "frank", mood: "regular", line: "Two empty bottles of Scotch, the cheap stuff." },
      { character: "frank", mood: "regular", line: "And a photograph, torn up small. Someone meant it." },
    ],
    noteId: "flat-kitchen-pedal-bin",
  },
];
