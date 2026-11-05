import newspaper from "../../../../assets/images/objects/newspaper.png";

// Derek's key: the paper must be the only place the player can learn this name
export const sackedColleague = { firstName: "Clive", surname: "Hargreaves" };

const greatPortlandStreetUndergroundObjects = [
  {
    id: "newspaper-1",
    name: "Newspaper",
    description: "A folded newspaper, left on the bench",
    sprite: newspaper,
    spriteWidth: "108px",
    position: { x: "520px", y: "624px" },
    standAt: { x: "574px", y: "800px" },
    face: "up",
    collectable: false,
    noteId: "newspaper-sacked-tube-worker",
    modal: {
      type: "newspaper",
      props: {
        title: "The Evening Standard",
        date: "Monday, 4 March 1996",
        articles: [
          {
            headline: "CIRCLE LINE DELAYS CONTINUE INTO THIRD WEEK",
            body: "Commuters on the Circle line faced further disruption this morning as London Underground cited 'ongoing signalling works' near Great Portland Street. A spokesperson said services were expected to return to normal 'imminently', a word they have now used fourteen times this month.",
          },
          {
            headline: "LOCAL MAN FOUND LIVING ENTIRELY ON PLATFORM SNACKS",
            body: "A 43-year-old man was discovered last Tuesday having subsisted for eleven days on crisps purchased from the vending machine at Great Portland Street station. He described the experience as 'surprisingly manageable' and said he had 'no immediate plans to leave'.",
          },
          {
            headline: "TUBE WORKER SACKED FOR LETTING STRANDED PASSENGERS GO",
            body: `A London Underground employee has been dismissed for opening his station's ticket barriers by hand when they broke down, letting the passengers trapped inside out without paying. ${sackedColleague.firstName} ${sackedColleague.surname}, who had worked for the Underground for 19 years, said he 'wasn't going to leave people stuck down there all night'. Management said rules were rules, and the matter was now closed.`,
          },
          {
            headline: "PIGEONS GAINING GROUND",
            body: "Network Rail has confirmed a 34% increase in pigeon activity across Zone 1 stations. Experts warn the birds have 'become bold'. No further comment was provided.",
          },
        ],
      },
    },
  },
];

// Painted into the background
export const hotspots = [
  {
    id: "broken-camera",
    name: "Broken security camera",
    position: { x: "630px", y: "70px" },
    size: { width: "110px", height: "120px" },
    standAt: { x: "685px", y: "800px" },
    face: "up",
    lines: [
      { character: "frank", mood: "regular", line: "Looks out of action." },
      { character: "frank", mood: "regular", line: "The Underground ain't what it used to be." },
    ],
  },
  {
    id: "litter-poster",
    name: "Litter poster",
    position: { x: "1015px", y: "372px" },
    size: { width: "133px", height: "213px" },
    standAt: { x: "1081px", y: "800px" },
    face: "up",
    lines: [{ character: "frank", mood: "regular", line: "I guess no one looks at these." }],
  },
  {
    id: "mind-the-gap-poster",
    name: "Mind the gap poster",
    position: { x: "1150px", y: "372px" },
    size: { width: "125px", height: "213px" },
    standAt: { x: "1212px", y: "800px" },
    face: "up",
    lines: [{ character: "frank", mood: "regular", line: "Mind the gap." }],
  },
  {
    id: "far-posters",
    name: "Posters",
    position: { x: "1555px", y: "372px" },
    size: { width: "310px", height: "213px" },
    standAt: { x: "1710px", y: "800px" },
    face: "up",
    lines: [{ character: "frank", mood: "regular", line: "Nothing interesting." }],
  },
];

// The platform wall right of the stairs (the notch in the walk area's clip-path), so he steps down off them before crossing
export const platformWall = { left: 230, right: 1980, top: 600, bottom: 774 };

export const obstacles = [platformWall];

export default greatPortlandStreetUndergroundObjects;
