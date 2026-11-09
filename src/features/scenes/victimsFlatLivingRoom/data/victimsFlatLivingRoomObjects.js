import coffeeTable from "../../../../assets/images/backgrounds/victims-flat-living-room-coffee-table.png";
import armchairLeft from "../../../../assets/images/backgrounds/victims-flat-living-room-armchair-left.png";
import armchairRight from "../../../../assets/images/backgrounds/victims-flat-living-room-armchair-right.png";
import glass from "../../../../assets/images/backgrounds/victims-flat-living-room-glass.png";
import pillBottle from "../../../../assets/images/backgrounds/victims-flat-living-room-pill-bottle.png";
import bedding from "../../../../assets/images/backgrounds/victims-flat-living-room-bedding.png";
import body from "../../../../assets/images/objects/victim-body.png";

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

// The victim, slumped on the sofa's left cushion; drawn before the occluders so the coffee table covers his shins
export const victimBody = {
  id: "victim-body",
  sprite: body,
  position: { x: "792px", y: "362px" },
  baseY: 680,
  footprint: { left: 836, right: 946, top: 655, bottom: 690 },
  alwaysVisible: true,
};

export const occluders = [
  {
    id: "coffee-table",
    sprite: coffeeTable,
    // over the body's legs, which are behind it
    alwaysVisible: true,
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

// Rendered with the room but kept out of its background, so they can be taken away; positions printed by build.sh
export const props = [
  { id: "glass", sprite: glass, position: { x: "900px", y: "620px" }, baseY: 729, alwaysVisible: true },
  { id: "pill-bottle", sprite: pillBottle, position: { x: "708px", y: "524px" }, baseY: 636, alwaysVisible: true },
  { id: "bedding", sprite: bedding, position: { x: "540px", y: "512px" }, baseY: 641, alwaysVisible: true },
];

export const obstacles = [victimBody, ...occluders].map((o) => o.footprint);

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
  // after the coffee table, so it's on top where they overlap
  {
    id: "glass",
    name: "The glass",
    position: { x: "896px", y: "612px" },
    size: { width: "32px", height: "44px" },
    standAt: { x: "900px", y: "790px" },
    face: "up",
    lines: [
      { character: "frank", mood: "regular", line: "A tumbler, a finger of whisky left in the bottom." },
      { character: "frank", mood: "regular", line: "He never got round to finishing it." },
    ],
  },
  {
    id: "pill-bottle",
    name: "The pill bottle",
    position: { x: "702px", y: "516px" },
    size: { width: "28px", height: "36px" },
    standAt: { x: "700px", y: "690px" },
    face: "up",
    lines: [
      { character: "frank", mood: "regular", line: "A prescription bottle, right by his hand." },
      { character: "frank", mood: "regular", line: "I'll want a look at that label." },
    ],
  },
  {
    id: "family-photograph",
    name: "The family photograph",
    position: { x: "780px", y: "344px" },
    size: { width: "50px", height: "56px" },
    standAt: { x: "805px", y: "690px" },
    face: "up",
    lines: [
      { character: "frank", mood: "regular", line: "A school photo. Same lad in the other two, a few years older in each." },
      { character: "frank", mood: "regular", line: "His son, I'd say." },
    ],
  },
  {
    id: "laptop",
    name: "The laptop",
    position: { x: "1355px", y: "472px" },
    size: { width: "40px", height: "56px" },
    standAt: { x: "1190px", y: "700px" },
    face: "right",
    lines: [
      { character: "frank", mood: "regular", line: "A laptop, tucked in between the books." },
      { character: "frank", mood: "regular", line: "Odd place to keep one, and they don't come cheap." },
    ],
  },
  {
    id: "bedding",
    name: "The bedding",
    position: { x: "540px", y: "512px" },
    size: { width: "108px", height: "90px" },
    standAt: { x: "600px", y: "690px" },
    face: "up",
    lines: [
      { character: "frank", mood: "regular", line: "A duvet and a pillow, rolled up in the corner." },
      { character: "frank", mood: "regular", line: "Someone's been sleeping on that sofa." },
    ],
  },
];
