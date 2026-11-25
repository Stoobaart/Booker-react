import coffeeTable from "../../../../assets/images/backgrounds/victims-flat-living-room-coffee-table.png";
import armchairLeft from "../../../../assets/images/backgrounds/victims-flat-living-room-armchair-left.png";
import armchairRight from "../../../../assets/images/backgrounds/victims-flat-living-room-armchair-right.png";
import glass from "../../../../assets/images/backgrounds/victims-flat-living-room-glass.png";
import pillBottle from "../../../../assets/images/backgrounds/victims-flat-living-room-pill-bottle.png";
import bedding from "../../../../assets/images/backgrounds/victims-flat-living-room-bedding.png";
import tablets from "../../../../assets/images/backgrounds/victims-flat-living-room-tablets.png";
import idCard from "../../../../assets/images/backgrounds/victims-flat-living-room-id-card.png";
import body from "../../../../assets/images/objects/victim-body.png";
import { fullName, prescription, victim } from "./victim";

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

// Rendered with the room but kept out of its background, so they can be taken away; positions printed by build.sh.
// One with an itemId goes once Frank has picked it up.
export const props = [
  { id: "glass", sprite: glass, position: { x: "900px", y: "620px" }, baseY: 729, alwaysVisible: true },
  { id: "pill-bottle", itemId: "pill-bottle", sprite: pillBottle, position: { x: "708px", y: "524px" }, baseY: 636, alwaysVisible: true },
  { id: "bedding", sprite: bedding, position: { x: "540px", y: "512px" }, baseY: 641, alwaysVisible: true },
  { id: "tablets", sprite: tablets, position: { x: "956px", y: "652px" }, baseY: 729, alwaysVisible: true },
  { id: "id-card", itemId: "work-pass", sprite: idCard, position: { x: "1000px", y: "636px" }, baseY: 729, alwaysVisible: true },
];

export const obstacles = [victimBody, ...occluders].map((o) => o.footprint);

export const hotspots = [
  {
    id: "victim-body",
    name: "The body",
    position: { x: "830px", y: "420px" },
    size: { width: "130px", height: "180px" },
    standAt: { x: "900px", y: "800px" },
    face: "up",
    lines: [
      { character: "frank", mood: "regular", line: "Slumped back on the sofa, head lolled to one side. Like he nodded off watching the telly." },
      { character: "frank", mood: "regular", line: "No marks on him that I can see. No bruising, nothing torn." },
      { character: "frank", mood: "regular", line: "Nothing knocked over either. If there was a struggle, it wasn't in here." },
    ],
  },
  {
    id: "glass",
    name: "The glass",
    position: { x: "896px", y: "612px" },
    size: { width: "32px", height: "44px" },
    standAt: { x: "900px", y: "790px" },
    face: "up",
    lines: [
      { character: "frank", mood: "regular", line: "A glass of water, nearly empty." },
      { character: "frank", mood: "regular", line: "Right next to the tablets. Something to wash them down with." },
    ],
  },
  {
    id: "tablets",
    name: "The tablets",
    position: { x: "950px", y: "640px" },
    size: { width: "62px", height: "26px" },
    standAt: { x: "960px", y: "800px" },
    face: "up",
    lines: [
      { character: "frank", mood: "regular", line: `Tablets. ${prescription.loose} loose on the table, little white ones.` },
      { character: "frank", mood: "regular", line: `Same as the ${prescription.inBottle} left in that pill bottle. ${prescription.remaining}, all told.` },
    ],
    noteId: "flat-living-room-tablets",
  },
  {
    id: "id-card",
    name: "The work pass",
    position: { x: "994px", y: "628px" },
    size: { width: "44px", height: "24px" },
    standAt: { x: "1010px", y: "800px" },
    face: "up",
    lines: [
      { character: "frank", mood: "regular", line: `A work pass. ${fullName}, ${victim.jobTitle}, ${victim.employer}.` },
      { character: "frank", mood: "regular", line: "His photo's on it. Same face as on the sofa, only less grey." },
    ],
    noteId: "flat-living-room-security-pass",
    // Picking it up notes it too, in case he never looked first
    pickup: {
      itemId: "work-pass",
      lines: [{ character: "frank", mood: "regular", line: `${fullName}'s work pass. I'll hang on to this.` }],
    },
  },
  {
    id: "pill-bottle",
    name: "The pill bottle",
    position: { x: "702px", y: "516px" },
    size: { width: "28px", height: "36px" },
    standAt: { x: "700px", y: "690px" },
    face: "up",
    lines: [
      { character: "frank", mood: "regular", line: "A prescription bottle, right by his hand. A few still rattling about in it." },
      { character: "frank", mood: "regular", line: `${prescription.medicine}, from ${prescription.pharmacy}. Made out to ${prescription.owner}.` },
      { character: "frank", mood: "regular", line: "That's not his name." },
      { character: "frank", mood: "regular", line: `${prescription.quantity} tablets, dispensed ${prescription.dispensed}.` },
    ],
    noteId: "flat-living-room-prescription",
    pickup: {
      itemId: "pill-bottle",
      lines: [
        { character: "frank", mood: "regular", line: `${prescription.medicine}, made out to ${prescription.owner}. Not his name.` },
        { character: "frank", mood: "regular", line: "This is coming with me." },
      ],
    },
  },
  {
    id: "family-photograph",
    name: "The family photograph",
    position: { x: "780px", y: "344px" },
    size: { width: "50px", height: "56px" },
    standAt: { x: "805px", y: "690px" },
    face: "up",
    lines: [
      { character: "frank", mood: "regular", line: "Him and a lad, out in a park somewhere, both grinning." },
      { character: "frank", mood: "regular", line: "Same lad's in the school photos. His son, I'd say. He kept him where he could see him." },
    ],
    // Once the neighbour has named the boy
    linesOnceNoted: {
      noteId: "flat-kitchen-son-sam",
      lines: [
        { character: "frank", mood: "regular", line: `Him and ${victim.son}, out in a park somewhere, both grinning.` },
        { character: "frank", mood: "regular", line: "He kept the lad where he could see him." },
      ],
    },
  },
  {
    id: "laptop",
    name: "The laptop",
    position: { x: "1355px", y: "472px" },
    size: { width: "40px", height: "56px" },
    standAt: { x: "1190px", y: "700px" },
    face: "right",
    opensLaptop: true,
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
      { character: "frank", mood: "regular", line: "Someone's been sleeping on that sofa. Him, I'd bet, not a guest." },
    ],
    noteId: "flat-living-room-bedding",
  },
];
