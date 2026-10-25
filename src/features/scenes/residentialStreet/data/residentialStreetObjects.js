import streetLamps from "../../../../assets/images/backgrounds/residential-street-lamps.png";
import residentialStreetNPCs from "./residentialStreetNPCs";

export const STREET_WIDTH = 5760;

export const GROUND_TOP = 572;

export const arrivalFromStation = { x: "5460px", y: "12rem" };

export const arrivalFromFlat = { x: "577px", y: "176px" };

export const exits = [
  {
    id: "to-station",
    name: "Great Portland Street",
    description: "Head back to the station",
    position: { x: "5664px", y: "25rem" },
    size: { width: "6rem", height: "18rem" },
    zIndex: 2,
    to: "/great-portland-street-exterior",
  },
  {
    id: "to-victims-flat",
    name: "The victim's flat",
    description: "Go into the flat",
    position: { x: "618px", y: "209px" },
    size: { width: "150px", height: "357px" },
    walkTo: { x: "693px", y: "570px" },
    to: "/victims-flat-hallway",
  },
];

// The lamps are in front of the pavement, so they're one layer always drawn over Frank
const LAMP_XS = [860, 1340, 2200, 3000, 3800, 4600, 5400];

export const lampsOccluder = {
  id: "street-lamps",
  sprite: streetLamps,
  position: { x: "0px", y: "0px" },
  baseY: 700,
};

const mattressFootprint = { left: 1490, right: 1910, top: 560, bottom: 618 };

export const obstacles = [
  ...LAMP_XS.map((x) => ({ left: x - 26, right: x + 26, top: 676, bottom: 706 })),
  mattressFootprint,
  ...residentialStreetNPCs.filter((npc) => npc.footprint).map((npc) => npc.footprint),
];
