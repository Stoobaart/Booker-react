const greatPortlandStreetUndergroundObjects = [
  {
    id: "banana-1",
    name: "Banana",
    description: "A slightly bruised banana",
    sprite:
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Ctext x="5" y="30" font-size="30"%3E🍌%3C/text%3E%3C/svg%3E',
    position: { x: "450px", y: "700px" },
    collectable: true,
    lines: [
      { character: "frank", mood: "regular", line: "A banana. Looks a bit past it." },
      { character: "frank", mood: "regular", line: "Someone's left this here for a while." },
    ],
  },
  {
    id: "car-1",
    name: "Toy Car",
    description: "A small red toy car",
    sprite:
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Ctext x="5" y="30" font-size="30"%3E🚗%3C/text%3E%3C/svg%3E',
    position: { x: "800px", y: "800px" },
    collectable: true,
    lines: [
      { character: "frank", mood: "regular", line: "A toy car. On a tube platform." },
      { character: "frank", mood: "angry", line: "Some kid's going to be gutted about that." },
    ],
  },
  {
    id: "newspaper-1",
    name: "Newspaper",
    description: "A rolled up newspaper, left on the platform",
    sprite:
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Ctext x="5" y="30" font-size="30"%3E📰%3C/text%3E%3C/svg%3E',
    position: { x: "450px", y: "620px" },
    collectable: false,
    modal: {
      type: "newspaper",
      props: {
        title: "The Evening Standard",
        date: "Monday, 2 March 2026",
        articles: [
          {
            headline: "CIRCLE LINE DELAYS CONTINUE INTO THIRD WEEK",
            body: "Commuters on the Circle line faced further disruption this morning as TfL cited 'ongoing signalling works' near Great Portland Street. A spokesperson said services were expected to return to normal 'imminently', a word they have now used fourteen times this month.",
          },
          {
            headline: "LOCAL MAN FOUND LIVING ENTIRELY ON PLATFORM SNACKS",
            body: "A 43-year-old man was discovered last Tuesday having subsisted for eleven days on crisps purchased from the vending machine at Great Portland Street station. He described the experience as 'surprisingly manageable' and said he had 'no immediate plans to leave'.",
          },
          {
            headline: "PIGEONS GAINING GROUND",
            body: "Network Rail has confirmed a 34% increase in pigeon activity across Zone 1 stations. Experts warn the birds have 'become bold'. No further comment was provided.",
          },
        ],
      },
    },
  },
  {
    id: "beer-1",
    name: "Beer",
    description: "A cold bottle of beer",
    sprite:
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Ctext x="5" y="30" font-size="30"%3E🍺%3C/text%3E%3C/svg%3E',
    position: { x: "1050px", y: "850px" },
    collectable: true,
    lines: [
      { character: "frank", mood: "regular", line: "Someone left a beer down here." },
      { character: "frank", mood: "regular", line: "Still cold too. Tube's good for something." },
    ],
  },
];

export default greatPortlandStreetUndergroundObjects;
