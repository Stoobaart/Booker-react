import { sackedColleague } from "../../scenes/greatPortlandStreetUnderground/data/greatPortlandStreetUndergroundObjects";

// A note's text never changes: new information is a new id. `pinnable: false` keeps it off the deductions board.
// The victim's flat notes are placeholders.
const notes = [
  {
    id: "flat-hallway-post",
    investigationId: "victims-flat",
    roomId: "hallway",
    title: "Post on the hall table",
    text: "A week of post on the hall table, none of it opened. Bills, a takeaway menu, and a final demand from the electricity board.",
  },
  {
    id: "flat-living-room-ashtray",
    investigationId: "victims-flat",
    roomId: "living-room",
    title: "The ashtray",
    text: "Two brands of cigarette in the ashtray on the coffee table. Somebody else smoked here, and not long ago.",
  },
  {
    id: "flat-kitchen-pedal-bin",
    investigationId: "victims-flat",
    roomId: "kitchen",
    title: "The pedal bin",
    text: "Two empty bottles of cheap Scotch in the bin, and a photograph torn into too many pieces to put back together.",
  },
  {
    id: "flat-kitchen-sink",
    investigationId: "victims-flat",
    roomId: "kitchen",
    title: "Two mugs",
    text: "Two mugs left in the sink, both still with cold tea in them. Someone had company.",
  },
  {
    id: "flat-bedroom-computer",
    investigationId: "victims-flat",
    roomId: "bedroom",
    title: "The computer",
    text: "A brand new computer in the corner, a couple of grand's worth, its screensaver still running. Too much money for a flat like this.",
  },
  {
    id: "flat-bedroom-posters",
    investigationId: "victims-flat",
    roomId: "bedroom",
    title: "The posters",
    text: "Football, a band and a film on the walls, and pennants over the bed. A kid's room, or somebody who never grew out of one.",
  },
  {
    id: "newspaper-sacked-tube-worker",
    investigationId: "great-portland-street",
    roomId: "platform",
    title: "Sacked Tube worker",
    text: `${sackedColleague.firstName} ${sackedColleague.surname}, nineteen years on the Underground, sacked for opening the ticket barriers by hand when they broke down and letting stranded passengers out. In the Evening Standard, Monday 4 March 1996.`,
  },
  {
    id: "ticket-barrier-rejected",
    investigationId: "great-portland-street",
    roomId: "ticket-hall",
    title: "Broken ticket barriers",
    pinnable: false,
    text: "The barriers keep spitting Frank's travel card back out, and they're the only way out of the station to the street.",
  },
  {
    id: "derek-station-worker",
    investigationId: "great-portland-street",
    roomId: "ticket-hall",
    title: "Derek, the station worker",
    text: "Derek works the ticket hall at Great Portland Street. Twenty-odd years in, and it shows.",
  },
  {
    id: "derek-fears-blame",
    investigationId: "great-portland-street",
    roomId: "ticket-hall",
    title: "The station worker is afraid to open the barriers manually",
    text: "The station worker won't override the barrier by hand: if anything goes wrong, it's his neck on the line. Maybe I can persuade him somehow.",
  },
  {
    id: "derek-opened-barrier",
    investigationId: "great-portland-street",
    roomId: "ticket-hall",
    title: "Derek opened the barrier",
    pinnable: false,
    text: `Derek opened the gate for me in the end. Reminding him what ${sackedColleague.firstName} would have done did the trick, though he'd rather nobody heard about it.`,
  },
];

export const investigationNotes = Object.fromEntries(notes.map((note) => [note.id, note]));
