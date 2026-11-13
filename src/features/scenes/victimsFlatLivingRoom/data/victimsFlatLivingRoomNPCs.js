import socoSprite from "../../../../assets/images/sprites/soco.png";
import socoPortrait from "../../../../assets/images/portraits/portrait-soco.png";
import { obstacles } from "./victimsFlatLivingRoomObjects";

// What they photograph, in turn
const body = { x: "880px", y: "560px" };
const coffeeTable = { x: "960px", y: "650px" };
const bookshelf = { x: "1360px", y: "520px" };

const victimsFlatLivingRoomNPCs = [
  {
    id: "soco",
    name: "Scene of crime officer",
    sprite: socoSprite,
    portrait: socoPortrait,
    // where the eyes are in the portrait's frames, to blink
    portraitEyes: [
      { x: 22, y: 41, width: 4, height: 3 },
      { x: 31, y: 41, width: 8, height: 3 },
    ],
    // 56x91 frames at 5.25x, a touch taller than Frank; drawn facing right
    spriteSheet: {
      columns: 14,
      rows: 3,
      width: "18.375rem",
      height: "29.875rem",
      idle: { name: "still", row: 2, frames: 1, duration: 1000 },
      // one photo: raise the camera, flash, lower it
      photograph: { name: "photograph", row: 0, frames: 14, duration: 2000, flashAt: 1000 },
      // two steps: the 2080ms between their spots is one and a half loops, three steps
      walk: { name: "walk", row: 1, frames: 12, duration: 1387 },
      // the camera at the eye, from the feet
      lens: { x: 79, y: -404 },
    },
    position: { x: "1260px", y: "745px" },
    // Every 20 seconds moves to the other spot; a few seconds after getting there takes one or two photos
    patrol: {
      interval: 20000,
      obstacles,
      // Frank walks round them: this much floor, round their feet
      footprint: { width: 70, depth: 60 },
      spots: [
        { x: "1260px", y: "745px", face: "left", subjects: [body], talkPosition: { x: "1070px", y: "820px" } },
        // In front of the coffee table: further left, the armchair would be in front of them
        {
          x: "790px",
          y: "795px",
          face: "right",
          subjects: [coffeeTable, bookshelf],
          talkPosition: { x: "980px", y: "850px" },
        },
      ],
    },
    talkOptions: [
      {
        id: "busy",
        line: "Got a minute?",
        replies: ["Not now, I'm working."],
        ends: true,
      },
    ],
  },
];

export default victimsFlatLivingRoomNPCs;
