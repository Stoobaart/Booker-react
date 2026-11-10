import { connectionIdFor, nodeIdFor } from "../../deduction/slices/deductionSlice";
import { deductionsById } from "../../deduction/data/deductions";

// Places to start a game from, for testing (offered on the splash screen in development only).
// Each is a whole save, as buildSaveData writes one, holding everything a player must have done to get there.

const note = (refId, x, y) => ({ id: nodeIdFor("note", refId), kind: "note", refId, x, y });
const postIt = (refId, x, y) => ({ id: nodeIdFor("deduction", refId), kind: "deduction", refId, x, y });
const string = (from, to) => ({ id: connectionIdFor(from, to), from, to });
const stringFor = (deductionId) => string(deductionsById[deductionId].from, deductionsById[deductionId].to);

// Out of the station: Derek persuaded, both deductions on the station's board, the tutorial done
const stationDone = {
  game: {
    currentScene: "great-portland-street-exterior",
    playerPosition: null,
    playerDirection: null,
    storyProgress: { arrivedAtStation: true, triedBarrier: true, barrierReleased: true, leftStation: true },
  },
  inventory: { items: [] },
  investigation: {
    discoveredNoteIds: [
      "newspaper-sacked-tube-worker",
      "ticket-barrier-rejected",
      "derek-station-worker",
      "derek-fears-blame",
      "derek-opened-barrier",
    ],
    openedInvestigationIds: ["great-portland-street"],
  },
  dialogue: {
    heardTalkOptions: { "station-worker": ["good-evening", "barriers", "ask-about-clive", "what-would-clive-do"] },
  },
  deduction: {
    boards: {
      "great-portland-street": {
        // the second post-it is pinned by restoreBoards, from its string
        nodes: [
          note("newspaper-sacked-tube-worker", 0.25, 0.3),
          note("derek-station-worker", 0.65, 0.3),
          postIt("derek-knew-sacked-worker", 0.45, 0.5),
          note("derek-fears-blame", 0.75, 0.65),
        ],
        connections: [stringFor("derek-knew-sacked-worker"), stringFor("derek-fears-ending-up-like-clive")],
      },
    },
    madeDeductionIds: ["derek-knew-sacked-worker", "derek-fears-ending-up-like-clive"],
  },
  tutorial: { doneStepId: "finish", skipped: false },
};

const startPoints = [
  {
    id: "flat-hallway-first-arrival",
    label: "Flat hallway, first arrival",
    // Through the door from the street: the flat's case isn't open yet, so arriving opens it
    save: { ...stationDone, game: { ...stationDone.game, currentScene: "victims-flat-hallway" } },
  },
];

export default startPoints;
