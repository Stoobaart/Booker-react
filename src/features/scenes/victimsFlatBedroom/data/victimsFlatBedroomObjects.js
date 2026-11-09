import bed from "../../../../assets/images/backgrounds/victims-flat-bedroom-bed.png";
import schoolwork from "../../../../assets/images/backgrounds/victims-flat-bedroom-schoolwork.png";

// His feet are just below the screen
export const arrivalFromHallway = { x: "844px", y: "616px" };

// Position printed by tools/backgrounds/victims-flat-bedroom.py
export const bedroomWindow = {
  position: { x: "864px", y: "316px" },
  size: { width: "288px", height: "160px" },
};

// Written by tools/backgrounds/victims-flat-bedroom.py
export { default as fairyLights } from "./fairyLights.json";

export const exits = [
  {
    id: "to-hallway",
    name: "Hallway",
    description: "Back out to the hall",
    // a thin strip along the bottom edge, so clicks on the floor near it don't leave
    position: { x: "480px", y: "930px" },
    size: { width: "960px", height: "50px" },
    zIndex: 2,
    walkTo: { x: "960px", y: "1055px" },
    to: "/victims-flat-hallway",
  },
];

export const occluders = [
  {
    id: "bed",
    sprite: bed,
    position: { x: "404px", y: "452px" },
    baseY: 803,
    footprint: { left: 399, right: 957, top: 683, bottom: 808 },
  },
];

// Rendered with the room but kept out of its background, so they can be taken away; positions printed by build.sh
export const props = [
  // on the duvet, so it layers with Frank as the bed does
  { id: "schoolwork", sprite: schoolwork, position: { x: "600px", y: "600px" }, baseY: 803, alwaysVisible: true },
];

// No occluder: there's no way behind the desk
export const deskFootprint = { left: 1145, right: 1505, top: 673, bottom: 796 };
export const chairFootprint = { left: 1139, right: 1334, top: 727, bottom: 793 };

export const obstacles = [...occluders.map((o) => o.footprint), deskFootprint, chairFootprint];

export const hotspots = [
  {
    id: "computer",
    name: "The computer",
    position: { x: "1240px", y: "440px" },
    size: { width: "110px", height: "105px" },
    standAt: { x: "1240px", y: "820px" },
    face: "up",
    lines: [
      { character: "frank", mood: "regular", line: "A brand new computer, screensaver still going." },
      { character: "frank", mood: "regular", line: "That's a couple of grand, in a flat like this." },
    ],
    noteId: "flat-bedroom-computer",
  },
  {
    id: "posters",
    name: "The posters",
    position: { x: "60px", y: "230px" },
    size: { width: "180px", height: "310px" },
    standAt: { x: "580px", y: "880px" },
    face: "left",
    lines: [
      { character: "frank", mood: "regular", line: "Football, a band, a film." },
      { character: "frank", mood: "regular", line: "A kid's room. Or somebody who never grew out of one." },
    ],
    noteId: "flat-bedroom-posters",
  },
  {
    id: "certificate",
    name: "The certificate",
    position: { x: "1405px", y: "335px" },
    size: { width: "75px", height: "105px" },
    standAt: { x: "1320px", y: "840px" },
    face: "right",
    lines: [
      { character: "frank", mood: "regular", line: "A certificate, framed. Outstanding achievement, it says." },
      { character: "frank", mood: "regular", line: "Somebody was proud of that." },
    ],
  },
  {
    id: "drawings",
    name: "The drawings",
    position: { x: "640px", y: "430px" },
    size: { width: "165px", height: "105px" },
    standAt: { x: "990px", y: "710px" },
    face: "left",
    lines: [
      { character: "frank", mood: "regular", line: "Crayon drawings. A house, and a man holding a boy's hand." },
      { character: "frank", mood: "regular", line: "Someone's kept these." },
    ],
  },
  {
    id: "schoolwork",
    name: "The schoolwork",
    position: { x: "600px", y: "590px" },
    size: { width: "240px", height: "45px" },
    standAt: { x: "720px", y: "840px" },
    face: "up",
    lines: [
      { character: "frank", mood: "regular", line: "Exercise books. Sums, ticked in red, all the way down the page." },
      { character: "frank", mood: "regular", line: "Somebody's homework." },
    ],
  },
];
