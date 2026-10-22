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
