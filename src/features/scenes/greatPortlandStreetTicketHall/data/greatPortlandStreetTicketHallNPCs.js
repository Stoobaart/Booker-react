import derekSprite from "../../../../assets/images/sprites/derek.png";
import derekPortrait from "../../../../assets/images/portraits/portrait-derek.png";
import { sackedColleague } from "../../greatPortlandStreetUnderground/data/greatPortlandStreetUndergroundObjects";

const clive = sackedColleague.firstName;

const greatPortlandStreetTicketHallNPCs = [
  {
    id: "station-worker",
    name: "Derek the station worker",
    // Shown in the chat until Frank has read his name tag
    unknownName: "Station worker",
    nameNoteId: "derek-station-worker",
    sprite: derekSprite,
    // Sized to match Frank (1.35x in this scene) where Derek stands
    spriteSheet: {
      columns: 16,
      rows: 3,
      width: "16.875rem",
      height: "30.5rem",
      idle: { name: "breathe", row: 0, frames: 8, duration: 3200 },
      actions: [
        { name: "check-watch", row: 1, frames: 16, duration: 2400 },
        { name: "scratch-chin", row: 2, frames: 16, duration: 2400 },
      ],
      idleLoops: [1, 3],
    },
    portrait: derekPortrait,
    speechColor: "#ff9933",
    position: { x: "1095px", y: "672px" },
    footprint: { left: 1050, right: 1140, top: 615, bottom: 690 },
    inspectLines: [
      { character: "frank", mood: "regular", line: 'The station worker. His name tag says "Derek".' },
    ],
    inspectNoteId: "derek-station-worker",
    talkPosition: { x: "881px", y: "634px" },
    // Frank says the line, then the NPC says each reply, one click each; noteId is noted at the end
    talkOptions: [
      {
        id: "good-evening",
        line: "Good evening",
        replies: ["Evenin' sir"],
      },
      {
        id: "barriers",
        line: "Hi, I can't get past the barriers, can you help?",
        replies: [
          "Barriers are on the blink mate",
          "I'm working on it, you'll have to wait. And no, I can't manually override it as it's my neck on the line",
        ],
        requiresStoryFlag: "triedBarrier",
        hiddenByStoryFlag: "barrierReleased",
        noteId: "derek-fears-blame",
      },
      {
        id: "ask-about-clive",
        line: "I read about the guy that was fired for letting people out",
        replies: [`Yeah, ${clive}. Upstanding bloke he was`],
        requiresDeduction: "derek-knew-sacked-worker",
      },
      {
        id: "what-would-clive-do",
        line: `C'mon, what would ${clive} do?`,
        replies: [`You're right, rules be damned, I'm doing this for ${clive}`],
        requiresHeard: "ask-about-clive",
        requiresDeduction: "derek-fears-ending-up-like-clive",
        hiddenByStoryFlag: "barrierReleased",
        // Closes the chat; the scene opens the gate, then Derek says releasedLines
        setsStoryFlag: "barrierReleased",
        noteId: "derek-opened-barrier",
        ends: true,
      },
      {
        id: "goodbye",
        line: "Goodbye",
        replies: ["Take care"],
        ends: true,
      },
    ],
    releasedLines: [{ speaker: "npc", text: "Let's just keep this between us" }],
  },
];

export default greatPortlandStreetTicketHallNPCs;
