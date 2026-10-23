import bed from "../../../../assets/images/backgrounds/victims-flat-bedroom-bed.png";

// In from the hall, Frank stands in the doorway right by the camera, looking into the room over his
// shoulder: his feet are just below the bottom of the screen
export const arrivalFromHallway = { x: "844px", y: "616px" };

// The window over the bed, its blind pulled up: the panes are a hole in the background, with the
// street at night and its rain behind it (tools/backgrounds/victims-flat-bedroom.py prints where)
export const bedroomWindow = {
  position: { x: "864px", y: "316px" },
  size: { width: "288px", height: "160px" },
};

// The bulbs of the fairy lights round the window: { x, y, colour } (top-left, on the art's 4px grid),
// written by tools/backgrounds/victims-flat-bedroom.py, which paints them unlit into the background
export { default as fairyLights } from "./fairyLights.json";

// The near edge of the carpet: back out through the door behind the viewer
export const exits = [
  {
    id: "to-hallway",
    name: "Hallway",
    description: "Back out to the hall",
    position: { x: "480px", y: "940px" },
    size: { width: "960px", height: "40px" },
    zIndex: 2,
    // back towards the camera, to where he came in
    walkTo: { x: "960px", y: "1055px" },
    to: "/victims-flat-hallway",
  },
];

// The furniture out on the carpet, cut out of the background: each is drawn over Frank while his
// feet are further back than its baseY, and he walks round its footprint
export const occluders = [
  {
    id: "bed",
    sprite: bed,
    position: { x: "404px", y: "452px" },
    baseY: 803,
    footprint: { left: 399, right: 957, top: 683, bottom: 808 },
  },
];

// The corner desk with the computer on it, and its chair: walked round, but never drawn over Frank,
// as there's no way behind them. He can still squeeze between the foot of the bed and the desk to
// stand at the window, clear of the desk.
export const deskFootprint = { left: 1145, right: 1505, top: 673, bottom: 796 };
export const chairFootprint = { left: 1139, right: 1334, top: 727, bottom: 793 };

export const obstacles = [...occluders.map((o) => o.footprint), deskFootprint, chairFootprint];
