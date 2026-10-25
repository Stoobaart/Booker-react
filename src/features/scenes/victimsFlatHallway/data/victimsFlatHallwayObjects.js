import hallTable from "../../../../assets/images/backgrounds/victims-flat-hallway-table.png";

// His feet are below the screen
export const arrivalFromStreet = { x: "984px", y: "826px" };

export const arrivalFromLivingRoom = { x: "684px", y: "357px" };

export const arrivalFromBedroom = { x: "844px", y: "201px" };

// His feet are just below the screen
export const arrivalFromKitchen = { x: "604px", y: "647px" };

export const exits = [
  {
    id: "leave-flat",
    name: "Front door",
    description: "Back out to the street",
    position: { x: "480px", y: "940px" },
    size: { width: "960px", height: "40px" },
    zIndex: 2,
    walkTo: { x: "1100px", y: "1250px" },
    to: "/residential-street",
  },
  {
    id: "to-living-room",
    name: "Living room",
    description: "Go into the living room",
    position: { x: "727px", y: "206px" },
    size: { width: "90px", height: "575px" },
    walkTo: { x: "800px", y: "781px" },
    to: "/victims-flat-living-room",
  },
  {
    id: "to-kitchen",
    name: "Kitchen",
    description: "Go into the kitchen",
    position: { x: "497px", y: "84px" },
    size: { width: "138px", height: "896px" },
    walkTo: { x: "720px", y: "1071px" },
    to: "/victims-flat-kitchen",
  },
  {
    id: "to-bedroom",
    name: "Bedroom",
    description: "Go into the bedroom",
    position: { x: "889px", y: "256px" },
    size: { width: "141px", height: "344px" },
    walkTo: { x: "960px", y: "625px" },
    to: "/victims-flat-bedroom",
  },
];

export const tableOccluder = {
  id: "hall-table",
  sprite: hallTable,
  position: { x: "1100px", y: "612px" },
  baseY: 935,
  footprint: { left: 1100, right: 1320, top: 850, bottom: 940 },
};

export const obstacles = [tableOccluder.footprint];

export const hotspots = [
  {
    id: "hall-table-post",
    name: "The post on the hall table",
    position: { x: "1100px", y: "605px" },
    size: { width: "115px", height: "55px" },
    standAt: { x: "1020px", y: "880px" },
    face: "right",
    lines: [
      { character: "frank", mood: "regular", line: "A week's post, and not one envelope opened." },
      { character: "frank", mood: "regular", line: "Bills mostly. Somebody stopped caring, or stopped coming home." },
    ],
    noteId: "flat-hallway-post",
  },
];
