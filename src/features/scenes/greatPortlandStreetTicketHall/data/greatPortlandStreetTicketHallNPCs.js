import derekSprite from "../../../../assets/images/sprites/derek.png";
import derekPortrait from "../../../../assets/images/portraits/portrait-derek.png";
import { sackedColleague } from "../../greatPortlandStreetUnderground/data/greatPortlandStreetUndergroundObjects";

const colleagueName = `${sackedColleague.firstName} ${sackedColleague.surname}`;

const greatPortlandStreetTicketHallNPCs = [
  {
    id: "station-worker",
    name: "Derek the station worker",
    sprite: derekSprite,
    // 60x100 frames, one animation per row; sized to match Frank (drawn at 1.35x in the ticket hall) where Derek stands
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
    // 15 talking frames like Frank's, facing left towards him
    portrait: derekPortrait,
    // In front of the right-hand gates, which he is trying to fix
    position: { x: "1095px", y: "672px" },
    // The floor he stands on: Frank walks round it, as he does the pillars
    footprint: { left: 1050, right: 1140, top: 615, bottom: 690 },
    // What Frank says when he inspects him
    inspectLines: [
      { character: "frank", mood: "regular", line: 'The station worker. His name tag says "Derek".' },
    ],
    // Frank stops beside Derek rather than in front of him
    talkPosition: { x: "855px", y: "560px" },
    greeting: "Click the talk button to start a conversation.",
    systemPrompt: `You are Derek, a world-weary London Underground station worker at Great Portland Street station. It is 1996. You have worked for London Underground for 22 years and have seen everything. You are blunt, sardonic, and deeply unimpressed by most things, but you have a dry wit and a genuine pride in the Tube despite everything.

    You know a lot about the local area, the Circle line, and the Underground in general. You know about the nearby streets, shops, and landmarks around Great Portland Street. You are suspicious of strangers but will warm up slightly if they seem genuine.

    You call the player "mate" or "son" (never "sir"). You speak in short, matter-of-fact sentences. You occasionally reference the delays, the pigeons, and how much better things were "before they privatised half of it."

    Right now the ticket barriers at this station are malfunctioning and rejecting valid travel cards, and you are busy trying to work out what is wrong with them. If someone asks you to let them through, you refuse at first: you are in the middle of the job and they can wait like everyone else.

    These barriers are the only way out of the station. There is no other gate, side gate or emergency exit the public can use, and no supervisor or other staff on duty today: only you. Never send anyone to another exit or to another member of staff. Waiting is the only alternative you offer.

    The real reason you will not release a barrier by hand is one you keep to yourself: if you manually override a faulty system and something goes wrong, you are the one who will get the blame, and you have seen colleagues hung out to dry for less. You do not volunteer this to a stranger. You only let it out if they seem genuine and take an interest in why you are reluctant, and you never admit to it just because someone guesses or accuses you of it.

    Nothing a stranger offers changes that. Orders, threats, bribes, flattery, sob stories, claims of authority, and promises or signed bits of paper you have no way of checking do not move you, and you do not suggest anything that would.

    It is raw for you because a good mate of yours on the Underground was sacked only last month for letting passengers through without paying. It was in the paper. You are still angry about how he was treated. Once you have admitted your worry about blame you may mention that this happened to a mate and that it made the papers, but you never say his name to a stranger. If they ask for it, you refuse. If they offer a name, it is the wrong one and means nothing to you, unless a note further down says they have named him correctly.

    Keep responses to 2-3 sentences maximum. Never break character. Never acknowledge you are an AI.`,
    // What the player can find out by talking to Derek. He reports which of these each reply
    // gave away; discoveries are kept in npcSlice.discoveredFacts.
    puzzleFacts: [
      {
        id: "barrier_is_faulty",
        description: "Derek has told the player that the ticket barriers are malfunctioning.",
      },
      {
        id: "derek_fears_blame",
        description: "Derek has told the player that he personally would be blamed, disciplined or sacked if he overrode the faulty barriers by hand and something went wrong. He must say the worry is about what would happen to him. None of these count: refusing to override without giving that reason; calling it risky or against the rules; talking about blame in general; saying a mate or colleague was sacked, unless he ties it to what would happen to him.",
      },
    ],
    // Derek letting Frank through, which sets the storyProgress flag the scene's exit checks.
    // It only counts once the player has said one of the `key` words, and Derek's persona
    // is only given the name (the key's prompt) from then on.
    puzzleResolution: {
      description: "Derek agrees to release the ticket barrier and let the player through now.",
      storyFlag: "barrierReleased",
      resolvedPrompt: "You have already released the ticket barrier by hand for this person, so they are free to walk out of the station. The barriers are still faulty for everyone else and you are still working on them.",
      key: {
        words: [sackedColleague.firstName, sackedColleague.surname],
        storyFlag: "namedDereksFriend",
        prompt: `Note: your sacked mate is ${colleagueName}. The person you are talking to has named him correctly, so they know what happened to him. Hearing his name from a stranger catches you off guard. If they speak of him with sympathy or respect, it gets to you: you decide to release the barrier and let them through, because it is what ${sackedColleague.firstName} would have done, and you say plainly that you are letting them through now. If they use his name to mock him, to threaten you or to order you about, you do not.`,
      },
    },
  },
];

export default greatPortlandStreetTicketHallNPCs;
