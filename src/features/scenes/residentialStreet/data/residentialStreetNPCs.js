import constableSprite from "../../../../assets/images/sprites/constable.png";

// The first officer on scene, guarding the victim's door and getting through his supper. Not
// clickable yet.
const residentialStreetNPCs = [
  {
    id: "constable",
    name: "Police constable",
    sprite: constableSprite,
    interactive: false,
    // 60x100 frames, one animation per row; sized to match Frank where the constable stands
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
    // On the pavement just to the right of the taped-off door
    // (the bottom of his frame: his boots stand a little above it)
    position: { x: "820px", y: "635px" },
    // Frank walks round him, passing well in front: his body fills the pavement's depth on screen,
    // so a shallow footprint looks like walking through him. Still leaves a gap before the lamp, and
    // a narrow one behind him (the walk area starts at 565) for Frank to just slip past his back.
    footprint: { left: 780, right: 860, top: 584, bottom: 660 },
  },
];

export default residentialStreetNPCs;
