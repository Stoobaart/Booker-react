import { sackedColleague } from "../../scenes/greatPortlandStreetUnderground/data/greatPortlandStreetUndergroundObjects";

const PLATFORM = "great-portland-street";
const TICKET_HALL = "great-portland-street-ticket-hall";
const DEREK = '[data-id="station-worker"]';
const clive = sackedColleague.firstName;

const hasNote = (id) => (state) => Boolean(state.investigation?.discoveredNoteIds?.includes(id));
const heard = (optionId) => (state) => Boolean(state.dialogue?.heardTalkOptions?.["station-worker"]?.includes(optionId));
const flag = (name) => (state) => Boolean(state.game?.storyProgress?.[name]);
const madeDeduction = (id) => (state) => Boolean(state.deduction?.madeDeductionIds?.includes(id));
const onBoard = (nodeId) => (state) =>
  Boolean(state.deduction?.boards?.[PLATFORM]?.nodes?.some((node) => node.id === nodeId));
const isBoardOpen = (state) => Boolean(state.deduction?.isBoardOpen);
const isChatOpen = (state) => (state.dialogue?.openChats ?? 0) > 0;
const isNotebookOpen = (state) => Boolean(state.investigation?.isNotebookOpen);

const BOARD_BUTTON = ".deduction-board-button";
const BOARD_AREA = [".board-sidebar", ".deduction-board__cork"];
const SPOOL = ".board-strings__spool";

// Talking to Derek, from wherever the player is: the chat's option, his menu's mouth, or Derek himself
const askDerek = (optionId, goal, inChat = goal) => [
  { selector: `[data-option-id="${optionId}"]`, text: inChat },
  { selector: `${DEREK} .talk-icon`, text: `${goal} Click the mouth to talk.` },
  { selector: DEREK, text: `${goal} Click him to talk.` },
];

const closeBoardFirst = { selector: ".deduction-board__close", when: isBoardOpen, text: "Close the board for now." };

// In order. A step's targets are tried in turn: the first whose `when` passes and that is on screen is highlighted.
// `info` steps wait for Next; `action` ones for `doneWhen` (checked while it's the current step) or `doneOn` (a tutorial action).
// `passedWhen` is a lasting fact that means the player is past this step, so a save made mid-way picks up after it.
const tutorialSteps = [
  {
    id: "welcome",
    scene: PLATFORM,
    kind: "info",
    targets: [{ text: "London, 1996. You're Frank. Let's learn the ropes." }],
  },
  {
    id: "walk",
    scene: PLATFORM,
    kind: "action",
    targets: [{ selector: "#walk-area", text: "Click anywhere on the floor to walk there." }],
    doneOn: "walk",
  },
  {
    id: "click-newspaper",
    scene: PLATFORM,
    kind: "action",
    targets: [{ selector: '[data-id="newspaper-1"]', text: "The cursor points at things you can use. Click the newspaper." }],
    doneOn: "menu:newspaper-1",
  },
  {
    id: "inspect-newspaper",
    scene: PLATFORM,
    kind: "action",
    targets: [
      { selector: '[data-id="newspaper-1"] .inspect-icon', text: "The magnifying glass takes a closer look." },
      { selector: '[data-id="newspaper-1"]', text: "Click the newspaper, then the magnifying glass." },
    ],
    passedWhen: hasNote("newspaper-sacked-tube-worker"),
  },
  {
    id: "note-toast",
    scene: PLATFORM,
    kind: "action",
    holdsToast: true,
    targets: [
      { selector: ".note-toast", text: "When you find something important, a note pops up here. Click it." },
      { selector: ".notebook-button", text: "Frank notes down what he finds. Open his notebook." },
    ],
    doneWhen: isNotebookOpen,
  },
  {
    id: "notebook-page",
    scene: PLATFORM,
    kind: "info",
    targets: [{ selector: ".notebook__page", text: "Your notebook keeps everything Frank learns, by place." }],
  },
  {
    id: "notebook-tabs",
    scene: PLATFORM,
    kind: "info",
    targets: [{ selector: ".notebook__tabs", text: "Each case gets its own tab." }],
  },
  {
    id: "close-notebook",
    scene: PLATFORM,
    kind: "action",
    targets: [{ selector: ".notebook__close", text: "Close it for now." }],
    doneWhen: (state) => !isNotebookOpen(state),
  },
  {
    id: "notebook-button",
    scene: PLATFORM,
    kind: "info",
    targets: [{ selector: ".notebook-button", text: "Open it again any time from here." }],
  },
  {
    id: "to-ticket-hall",
    scene: PLATFORM,
    kind: "action",
    targets: [{ selector: "#to-ticket-hall", text: "Head up the stairs to the ticket hall." }],
    passedWhen: (state) => state.game?.currentScene === TICKET_HALL || flag("triedBarrier")(state),
  },
  {
    id: "try-barrier",
    scene: TICKET_HALL,
    kind: "action",
    targets: [{ selector: "#to-street", text: "That's the way out. Try the ticket barriers." }],
    passedWhen: flag("triedBarrier"),
  },
  {
    id: "click-derek",
    scene: TICKET_HALL,
    kind: "action",
    targets: [{ selector: DEREK, text: "The station worker might help. Click him." }],
    doneOn: "menu:station-worker",
  },
  {
    id: "inspect-derek",
    scene: TICKET_HALL,
    kind: "action",
    targets: [
      { selector: `${DEREK} .inspect-icon`, text: "You can inspect people too." },
      { selector: DEREK, text: "Click him, then the magnifying glass." },
    ],
    passedWhen: hasNote("derek-station-worker"),
  },
  {
    id: "talk-derek",
    scene: TICKET_HALL,
    kind: "action",
    targets: [
      { selector: `${DEREK} .talk-icon`, text: "Now click the mouth to talk to him." },
      { selector: DEREK, text: "Click Derek, then the mouth, to talk to him." },
    ],
    doneWhen: isChatOpen,
  },
  {
    id: "ask-barriers",
    scene: TICKET_HALL,
    kind: "action",
    targets: askDerek("barriers", "Ask Derek about the barriers.", "Choose what Frank says. Ask about the barriers."),
    passedWhen: heard("barriers"),
  },
  {
    id: "talk-notes",
    scene: TICKET_HALL,
    kind: "info",
    holdsToast: true,
    targets: [{ selector: ".note-toast", text: "What people tell you is noted down too." }],
  },
  {
    id: "say-goodbye",
    scene: TICKET_HALL,
    kind: "action",
    targets: [{ selector: '[data-option-id="goodbye"]', text: "He won't budge. Say goodbye for now." }],
    doneWhen: (state) => !isChatOpen(state),
  },
  {
    id: "open-board",
    scene: TICKET_HALL,
    kind: "action",
    targets: [{ selector: BOARD_BUTTON, text: "Time to think. Open your deductions board." }],
    doneWhen: isBoardOpen,
  },
  {
    id: "board-sidebar",
    scene: TICKET_HALL,
    kind: "info",
    targets: [{ selector: ".board-sidebar", text: "Your notes wait here. Pin them on the cork to piece things together." }],
  },
  {
    id: "pin-newspaper",
    scene: TICKET_HALL,
    kind: "action",
    targets: [
      { selector: BOARD_AREA, ring: '[data-ref-id="note:newspaper-sacked-tube-worker"]', when: isBoardOpen, text: "Drag the sacked Tube worker onto the board." },
      { selector: BOARD_BUTTON, text: "Open your deductions board." },
    ],
    passedWhen: onBoard("note:newspaper-sacked-tube-worker"),
  },
  {
    id: "pin-derek",
    scene: TICKET_HALL,
    kind: "action",
    targets: [
      { selector: BOARD_AREA, ring: '[data-ref-id="note:derek-station-worker"]', when: isBoardOpen, text: "Now pin Derek." },
      { selector: BOARD_BUTTON, text: "Open your deductions board." },
    ],
    passedWhen: onBoard("note:derek-station-worker"),
  },
  {
    id: "tie-string",
    scene: TICKET_HALL,
    kind: "action",
    targets: [
      { selector: ".deduction-board__cork", ring: SPOOL, when: isBoardOpen, text: "Click the spool for string, then click one note, then the other." },
      { selector: BOARD_BUTTON, text: "Open your deductions board." },
    ],
    passedWhen: madeDeduction("derek-knew-sacked-worker"),
  },
  {
    id: "post-it",
    scene: TICKET_HALL,
    kind: "info",
    targets: [{
      selector: '[data-node-id="deduction:derek-knew-sacked-worker"]',
      text: "Clues that connect make a deduction. Deductions give Frank new things to say.",
    }],
  },
  {
    id: "close-board",
    scene: TICKET_HALL,
    kind: "action",
    targets: [{ selector: ".deduction-board__close", text: "Close the board." }],
    doneWhen: (state) => !isBoardOpen(state),
  },
  {
    id: "ask-about-clive",
    scene: TICKET_HALL,
    kind: "action",
    targets: [closeBoardFirst, ...askDerek("ask-about-clive", `Ask Derek about ${clive}.`)],
    passedWhen: heard("ask-about-clive"),
  },
  {
    id: "chain-deduction",
    scene: TICKET_HALL,
    kind: "action",
    targets: [
      { selector: '[data-option-id="goodbye"]', when: isChatOpen, text: "Say goodbye, then think it over." },
      {
        selector: BOARD_AREA,
        ring: '[data-ref-id="note:derek-fears-blame"]',
        when: (state) => isBoardOpen(state) && !onBoard("note:derek-fears-blame")(state),
        text: "Pin the note about Derek's fear.",
      },
      {
        selector: ".deduction-board__cork",
        ring: '[data-node-id="deduction:derek-knew-sacked-worker"]',
        when: isBoardOpen,
        text: "Now string his fear to your post-it. Deductions can build on each other.",
      },
      { selector: BOARD_BUTTON, text: `Derek respected ${clive}, but he's scared of ending up like him. Open your board.` },
    ],
    passedWhen: madeDeduction("derek-fears-ending-up-like-clive"),
  },
  {
    id: "persuade-derek",
    scene: TICKET_HALL,
    kind: "action",
    targets: [
      closeBoardFirst,
      ...askDerek("what-would-clive-do", "Now persuade him."),
      // Only after a reload: until then the gate is still --opening and Derek's lines are to come
      { selector: "#to-street", unless: ".ticket-gate--opening", when: flag("barrierReleased"), text: "The gate's open. Off you go." },
    ],
    doneOn: "released-lines-heard",
    passedWhen: flag("leftStation"),
  },
  {
    id: "finish",
    scene: TICKET_HALL,
    kind: "info",
    targets: [{ text: "You know the ropes now. Head on through the gate, Frank." }],
    // A save from before the tutorial that's already past the gate never sees it
    passedWhen: (state) => flag("leftStation")(state) || (flag("barrierReleased")(state) && !state.tutorial?.doneStepId),
  },
];

export const tutorialStepIds = tutorialSteps.map((step) => step.id);

export default tutorialSteps;
