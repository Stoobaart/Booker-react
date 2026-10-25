import leftPillar from "../../../../assets/images/backgrounds/great-portland-street-ticket-hall-left-pillar.png";
import rightPillar from "../../../../assets/images/backgrounds/great-portland-street-ticket-hall-right-pillar.png";
import greatPortlandStreetTicketHallNPCs from "./greatPortlandStreetTicketHallNPCs";

// The stairs are off screen, past the side walls' TRAINS signs
export const platformExits = [
  {
    id: "to-platform",
    position: { x: "103.375rem", y: "8rem" },
    size: { width: "15.625rem", height: "53.25rem" },
  },
  {
    id: "to-platform-left",
    position: { x: "1rem", y: "8rem" },
    size: { width: "15.625rem", height: "53.25rem" },
  },
];

export const streetDoorway = {
  position: { x: "852px", y: "176px" },
  size: { width: "132px", height: "140px" },
};

export const barrierLockedLines = [
  { character: "frank", mood: "angry", line: "Barrier's spat my travel card back out." },
  { character: "frank", mood: "regular", line: "That bloke in the uniform might be able to let me through." },
];

export const occluders = [
  {
    id: "left-pillar",
    sprite: leftPillar,
    position: { x: "464px", y: "160px" },
    baseY: 740,
    footprint: { left: 488, right: 692, top: 680, bottom: 756 },
  },
  {
    id: "right-pillar",
    sprite: rightPillar,
    position: { x: "1164px", y: "160px" },
    baseY: 745,
    footprint: { left: 1164, right: 1370, top: 685, bottom: 762 },
  },
];

export const obstacles = [
  ...occluders.map((occluder) => occluder.footprint),
  ...greatPortlandStreetTicketHallNPCs.filter((npc) => npc.footprint).map((npc) => npc.footprint),
];
