import streetLamps from "../../../../assets/images/backgrounds/residential-street-lamps.png";
import residentialStreetNPCs from "./residentialStreetNPCs";

// The street is three screens wide; Frank comes in from the station at its right-hand end
export const STREET_WIDTH = 5760;

// Where the houses meet the pavement: the rain splashes on everything below
export const GROUND_TOP = 572;

export const arrivalFromStation = { x: "5460px", y: "12rem" };

// Out of the victim's flat, he's on the step in front of its door, facing the street
export const arrivalFromFlat = { x: "577px", y: "176px" };

export const exits = [
  {
    id: "to-station",
    name: "Great Portland Street",
    description: "Head back to the station",
    // the end of the terrace and the pavement in front of it, down to the foot of the walk area
    position: { x: "5664px", y: "25rem" },
    size: { width: "6rem", height: "18rem" },
    zIndex: 2,
    to: "/great-portland-street-exterior",
  },
  {
    id: "to-victims-flat",
    name: "The victim's flat",
    description: "Go into the flat",
    // the narrow door beside the newsagent, under the police tape
    position: { x: "618px", y: "209px" },
    size: { width: "150px", height: "357px" },
    to: "/victims-flat-hallway",
  },
];

// The street lamps stand on the kerb, in front of the pavement Frank walks along, so they are cut
// out of the background as one layer drawn over him. Each lamp's foot is a footprint he walks round.
const LAMP_XS = [860, 1340, 2200, 3000, 3800, 4600, 5400];

export const lampsOccluder = {
  id: "street-lamps",
  sprite: streetLamps,
  position: { x: "0px", y: "0px" },
  baseY: 700,
};

// The soggy mattress dumped against the railings
const mattressFootprint = { left: 1490, right: 1910, top: 560, bottom: 618 };

export const obstacles = [
  ...LAMP_XS.map((x) => ({ left: x - 26, right: x + 26, top: 676, bottom: 706 })),
  mattressFootprint,
  ...residentialStreetNPCs.filter((npc) => npc.footprint).map((npc) => npc.footprint),
];
