import { sackedColleague } from "../../scenes/greatPortlandStreetUnderground/data/greatPortlandStreetUndergroundObjects";

// A note's text never changes: new information is a new id.
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
    title: "Sacked Tube worker",
    text: `${sackedColleague.firstName} ${sackedColleague.surname}, nineteen years on the Underground, sacked for letting passengers through without paying. In the Evening Standard, Monday 4 March 1996.`,
  },
  {
    id: "derek-station-worker",
    title: "Derek",
    text: "Derek works the ticket hall at Great Portland Street. Twenty-odd years in, and it shows.",
  },
  {
    id: "derek-fears-blame",
    title: "Why Derek won't open the barrier",
    text: "If Derek lets anyone through the faulty barrier and something goes wrong, he's the one who carries the can.",
  },
];

export const investigationNotes = Object.fromEntries(notes.map((note) => [note.id, note]));
