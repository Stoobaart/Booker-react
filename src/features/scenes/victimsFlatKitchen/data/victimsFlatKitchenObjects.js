import pedalBin from "../../../../assets/images/backgrounds/victims-flat-kitchen-bin.png";
import fridgeInside from "../../../../assets/images/backgrounds/victims-flat-kitchen-fridge-inside.png";
import fridgeDoor from "../../../../assets/images/backgrounds/victims-flat-kitchen-fridge-door.png";
import cupboardsInside from "../../../../assets/images/backgrounds/victims-flat-kitchen-cupboards-inside.png";
import cupboardsDoor from "../../../../assets/images/backgrounds/victims-flat-kitchen-cupboards-door.png";

// His feet are just below the screen
export const arrivalFromHallway = { x: "844px", y: "606px" };

// Position printed by tools/backgrounds/victims-flat-kitchen.py
export const kitchenWindow = {
  position: { x: "860px", y: "276px" },
  size: { width: "200px", height: "160px" },
};

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

export const binOccluder = {
  id: "pedal-bin",
  sprite: pedalBin,
  position: { x: "1036px", y: "584px" },
  baseY: 744,
  footprint: { left: 1031, right: 1123, top: 727, bottom: 762 },
};

export const obstacles = [binOccluder.footprint];

// Doors that open when inspected: their swing's frames, and the numbers, are printed by tools/backgrounds/victims-flat-kitchen.py
export const openings = [
  {
    id: "fridge",
    inside: fridgeInside,
    door: fridgeDoor,
    position: { x: "920px", y: "472px" },
    size: { width: "400px", height: "508px" },
    frames: 4,
    baseY: 874,
    // the door, standing open in the aisle
    footprint: { left: 931, right: 1196, top: 819, bottom: 889 },
  },
  {
    id: "cupboards",
    inside: cupboardsInside,
    door: cupboardsDoor,
    position: { x: "468px", y: "72px" },
    size: { width: "340px", height: "356px" },
    frames: 4,
    baseY: 914,
  },
];

export const hotspots = [
  {
    id: "sink",
    name: "The sink",
    position: { x: "885px", y: "435px" },
    size: { width: "80px", height: "65px" },
    standAt: { x: "960px", y: "712px" },
    face: "up",
    lines: [
      { character: "frank", mood: "regular", line: "Two mugs, cold tea in both." },
      { character: "frank", mood: "regular", line: "Nobody makes two cups of tea for themselves." },
    ],
    noteId: "flat-kitchen-sink",
  },
  {
    id: "pedal-bin",
    name: "The pedal bin",
    position: { x: "1035px", y: "580px" },
    size: { width: "85px", height: "180px" },
    standAt: { x: "955px", y: "745px" },
    face: "right",
    lines: [
      { character: "frank", mood: "regular", line: "Two empty bottles of Scotch, the cheap stuff." },
      { character: "frank", mood: "regular", line: "And a photograph, torn up small. Someone meant it." },
    ],
    noteId: "flat-kitchen-pedal-bin",
  },
  {
    id: "fridge",
    name: "The fridge",
    opens: "fridge",
    position: { x: "1195px", y: "540px" },
    size: { width: "102px", height: "420px" },
    // clear of the door's swing
    standAt: { x: "868px", y: "948px" },
    face: "right",
    lines: [
      { character: "frank", mood: "regular", line: "Next to nothing in here but a birthday cake. Not from a supermarket, either." },
      { character: "frank", mood: "regular", line: "Pink icing, a ribbon, candles waiting. Somebody went to a lot of trouble." },
    ],
  },
  {
    id: "cupboards",
    name: "The cupboards",
    opens: "cupboards",
    position: { x: "470px", y: "70px" },
    size: { width: "175px", height: "360px" },
    standAt: { x: "834px", y: "936px" },
    face: "left",
    lines: [
      { character: "frank", mood: "regular", line: "A tin of beans, some teabags and a jar of jam." },
      { character: "frank", mood: "regular", line: "Bare as a monk's larder." },
    ],
  },
  {
    id: "calendar",
    name: "The calendar",
    position: { x: "1446px", y: "107px" },
    size: { width: "114px", height: "253px" },
    standAt: { x: "1131px", y: "1046px" },
    face: "right",
    lines: [
      { character: "frank", mood: "regular", line: "A calendar. One date ringed in red, and nothing else written on the whole month." },
    ],
  },
];
