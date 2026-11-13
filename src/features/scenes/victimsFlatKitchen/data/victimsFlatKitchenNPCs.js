import neighbourSprite from "../../../../assets/images/sprites/neighbour.png";
import neighbourPortrait from "../../../../assets/images/portraits/portrait-neighbour.png";
import neighbourDragPortrait from "../../../../assets/images/portraits/portrait-neighbour-drag.png";

const victimsFlatKitchenNPCs = [
  {
    id: "neighbour",
    name: "Neighbour",
    sprite: neighbourSprite,
    portrait: neighbourPortrait,
    portraitEyes: [
      { x: 21, y: 42, width: 5, height: 4 },
      { x: 31, y: 42, width: 9, height: 4 },
    ],
    portraitAction: {
      src: neighbourDragPortrait,
      frames: 20,
      duration: 3200,
      every: [6000, 14000],
    },
    speechColor: "#e3a6c0",
    // 52x84 frames at 5x; drawn by tools/backgrounds/neighbour-sprite.py
    spriteSheet: {
      columns: 8,
      rows: 2,
      width: "16.25rem",
      height: "26.25rem",
      idle: { name: "lean", row: 0, frames: 1, duration: 1000 },
      // a drag on her cigarette every few seconds
      actions: [{ name: "drag", row: 1, frames: 8, duration: 2400 }],
      idleLoops: [3, 6],
    },
    // Leaning back against the counter under the window, left of the sink
    position: { x: "844px", y: "706px" },
    footprint: { left: 840, right: 910, top: 666, bottom: 718 },
    talkPosition: { x: "950px", y: "745px" },
    // Placeholder until her conversation is written
    talkOptions: [
      {
        id: "placeholder",
        line: "You live next door?",
        replies: ["Across the landing. I'll talk to you in a bit, love. Let me finish this first."],
        ends: true,
      },
    ],
  },
];

export const npcFootprints = victimsFlatKitchenNPCs.map((npc) => npc.footprint);

export default victimsFlatKitchenNPCs;
