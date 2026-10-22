import coffeeTable from "../../../../assets/images/backgrounds/victims-flat-living-room-coffee-table.png";
import armchairLeft from "../../../../assets/images/backgrounds/victims-flat-living-room-armchair-left.png";
import armchairRight from "../../../../assets/images/backgrounds/victims-flat-living-room-armchair-right.png";

// In from the hall, Frank stands at the foot of the door on the left-hand wall, facing into the room,
// clear of the left armchair (standing inside an obstacle would let his first walk go through it)
export const arrivalFromHallway = { x: "184px", y: "411px" };

export const exits = [
  {
    id: "to-hallway",
    name: "Hallway",
    description: "Back out to the hall",
    // the door on the left-hand wall: the same door as the hall's second on the left
    position: { x: "94px", y: "186px" },
    size: { width: "215px", height: "727px" },
    // the carpet at the foot of the door
    walkTo: { x: "290px", y: "835px" },
    to: "/victims-flat-hallway",
  },
];

// The furniture standing out on the carpet, cut out of the background: each is drawn over Frank
// while his feet are further back than its baseY, and he walks round its footprint
export const occluders = [
  {
    id: "coffee-table",
    sprite: coffeeTable,
    position: { x: "864px", y: "612px" },
    baseY: 729,
    footprint: { left: 851, right: 1068, top: 693, bottom: 773 },
  },
  {
    id: "armchair-left",
    sprite: armchairLeft,
    position: { x: "448px", y: "532px" },
    baseY: 803,
    footprint: { left: 430, right: 730, top: 760, bottom: 870 },
  },
  {
    id: "armchair-right",
    sprite: armchairRight,
    // nearer the camera and over to the right, clear of the TV
    position: { x: "1292px", y: "556px" },
    baseY: 865,
    footprint: { left: 1290, right: 1700, top: 800, bottom: 940 },
  },
];

export const obstacles = occluders.map((o) => o.footprint);
