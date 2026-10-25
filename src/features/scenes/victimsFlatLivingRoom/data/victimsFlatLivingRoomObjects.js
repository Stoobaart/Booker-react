import coffeeTable from "../../../../assets/images/backgrounds/victims-flat-living-room-coffee-table.png";
import armchairLeft from "../../../../assets/images/backgrounds/victims-flat-living-room-armchair-left.png";
import armchairRight from "../../../../assets/images/backgrounds/victims-flat-living-room-armchair-right.png";

// Clear of the armchair: starting inside an obstacle lets his first walk go through it
export const arrivalFromHallway = { x: "184px", y: "411px" };

export const exits = [
  {
    id: "to-hallway",
    name: "Hallway",
    description: "Back out to the hall",
    position: { x: "94px", y: "186px" },
    size: { width: "215px", height: "727px" },
    walkTo: { x: "290px", y: "835px" },
    to: "/victims-flat-hallway",
  },
];

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
    position: { x: "1292px", y: "556px" },
    baseY: 865,
    footprint: { left: 1290, right: 1700, top: 800, bottom: 940 },
  },
];

export const obstacles = occluders.map((o) => o.footprint);

export const hotspots = [
  {
    id: "coffee-table",
    name: "The coffee table",
    position: { x: "860px", y: "605px" },
    size: { width: "200px", height: "70px" },
    standAt: { x: "960px", y: "800px" },
    face: "up",
    lines: [
      { character: "frank", mood: "regular", line: "Two kinds of cigarette ends in the ashtray." },
      { character: "frank", mood: "regular", line: "Somebody had a guest." },
    ],
    noteId: "flat-living-room-ashtray",
  },
];
