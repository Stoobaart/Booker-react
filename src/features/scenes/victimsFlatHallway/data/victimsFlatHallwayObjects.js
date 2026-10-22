import hallTable from "../../../../assets/images/backgrounds/victims-flat-hallway-table.png";

// In from the street, Frank stands just inside the front door, right by the camera, so we look down
// the hall over his shoulder: his feet are below the bottom of the screen
export const arrivalFromStreet = { x: "984px", y: "826px" };

// The near edge of the carpet: back out of the front door behind the viewer
export const exits = [
  {
    id: "leave-flat",
    name: "Front door",
    description: "Back out to the street",
    position: { x: "480px", y: "940px" },
    size: { width: "960px", height: "40px" },
    zIndex: 2,
    to: "/residential-street",
  },
];

// The hall table against the right-hand wall, with the post on it: drawn over Frank while he is
// further down the hall than its front legs, and walked round
export const tableOccluder = {
  id: "hall-table",
  sprite: hallTable,
  position: { x: "1100px", y: "612px" },
  baseY: 935,
  footprint: { left: 1100, right: 1320, top: 850, bottom: 940 },
};

export const obstacles = [tableOccluder.footprint];

// The three closed doors: the kitchen and bedroom along the left-hand wall, the living room at the
// end. Not used yet: their rooms come later.
export const doors = {
  kitchen: { left: 497, top: 84, right: 635, bottom: 980 },
  bedroom: { left: 727, top: 206, right: 768, bottom: 781 },
  livingRoom: { left: 889, top: 256, right: 1030, bottom: 600 },
};
