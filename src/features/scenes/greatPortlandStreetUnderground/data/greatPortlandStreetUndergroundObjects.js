import newspaper from "../../../../assets/images/objects/newspaper.png";

// The Tube worker in the newspaper. Naming him to Derek is how Frank gets through the barrier,
// so the paper is the only place the player can learn it.
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
    // Reading it notes the sacked Tube worker, the name Derek needs to hear
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
            headline: "TUBE WORKER SACKED OVER FREE RIDES",
            body: `A London Underground employee has been dismissed after it emerged he had been letting passengers in and out of his station without paying. ${sackedColleague.firstName} ${sackedColleague.surname}, who had worked for the Underground for 19 years, said he did it because 'tickets were too expensive for the service they got'. Management said the matter was now closed.`,
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

export default greatPortlandStreetUndergroundObjects;
