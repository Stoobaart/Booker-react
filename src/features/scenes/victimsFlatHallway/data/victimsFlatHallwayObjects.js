import hallTable from "../../../../assets/images/backgrounds/victims-flat-hallway-table.png";

// In from the street, Frank stands just inside the front door, right by the camera, so we look down
// the hall over his shoulder: his feet are below the bottom of the screen
export const arrivalFromStreet = { x: "984px", y: "826px" };

// Out of the living room, he's in the hall just in front of its door
export const arrivalFromLivingRoom = { x: "684px", y: "357px" };

// The near edge of the carpet: back out of the front door behind the viewer
export const exits = [
  {
    id: "leave-flat",
    name: "Front door",
    description: "Back out to the street",
    position: { x: "480px", y: "940px" },
    size: { width: "960px", height: "40px" },
    zIndex: 2,
    // back towards the camera, to where he came in
    walkTo: { x: "1100px", y: "1250px" },
    to: "/residential-street",
  },
  {
    id: "to-living-room",
    name: "Living room",
    description: "Go into the living room",
    // the second door along the left-hand wall, and the carpet in front of it
    position: { x: "727px", y: "206px" },
    size: { width: "90px", height: "575px" },
    walkTo: { x: "800px", y: "781px" },
    to: "/victims-flat-living-room",
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

// The other two doors, closed for now: the kitchen first on the left, the bedroom at the end.
// (The second on the left is the living room, in exits.)
export const doors = {
  kitchen: { left: 497, top: 84, right: 635, bottom: 980 },
  bedroom: { left: 889, top: 256, right: 1030, bottom: 600 },
};
