import constableSprite from "../../../../assets/images/sprites/constable.png";

const residentialStreetNPCs = [
  {
    id: "constable",
    name: "Police constable",
    sprite: constableSprite,
    interactive: false,
    spriteSheet: {
      columns: 8,
      rows: 4,
      width: "15.125rem",
      height: "27.25rem",
      idle: { name: "breathe", row: 0, frames: 8, duration: 3200 },
      actions: [
        { name: "look-at-sandwich", row: 1, frames: 8, duration: 2000 },
        { name: "adjust-sandwich", row: 2, frames: 8, duration: 1600 },
        { name: "bite", row: 3, frames: 8, duration: 2400 },
      ],
      idleLoops: [1, 3],
    },
    // The bottom of his frame; his boots stand a little above it
    position: { x: "820px", y: "635px" },
    // Deep, as his body fills the pavement on screen; still leaves gaps before the lamp and behind him
    footprint: { left: 780, right: 860, top: 584, bottom: 660 },
  },
];

export default residentialStreetNPCs;
