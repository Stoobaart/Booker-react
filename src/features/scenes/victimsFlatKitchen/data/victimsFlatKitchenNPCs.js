import neighbourSprite from "../../../../assets/images/sprites/neighbour.png";
import neighbourPortrait from "../../../../assets/images/portraits/portrait-neighbour.png";
import neighbourDragPortrait from "../../../../assets/images/portraits/portrait-neighbour-drag.png";
import { neighbour, neighbourName, victim } from "../../victimsFlatLivingRoom/data/victim";

// What it takes for her to let slip the boy's name: most of Frank's five approaches nice, and no more than two pressing
export const REVEAL_RAPPORT = 3;
export const REVEAL_MAX_DEFENSIVENESS = 2;

const victimsFlatKitchenNPCs = [
  {
    id: "neighbour",
    name: "Neighbour",
    sprite: neighbourSprite,
    portrait: neighbourPortrait,
    portraitEyes: [
      { x: 21, y: 42, width: 5, height: 4 },
      { x: 31, y: 42, width: 9, height: 4 },
    ],
    portraitAction: {
      src: neighbourDragPortrait,
      frames: 20,
      duration: 3200,
      every: [6000, 14000],
    },
    speechColor: "#e3a6c0",
    // 52x84 frames at 5x; drawn by tools/backgrounds/neighbour-sprite.py
    spriteSheet: {
      columns: 8,
      rows: 2,
      width: "16.25rem",
      height: "26.25rem",
      idle: { name: "lean", row: 0, frames: 1, duration: 1000 },
      // a drag on her cigarette every few seconds
      actions: [{ name: "drag", row: 1, frames: 8, duration: 2400 }],
      idleLoops: [3, 6],
    },
    // Leaning back against the counter under the window, left of the sink
    position: { x: "844px", y: "706px" },
    footprint: { left: 840, right: 910, top: 666, bottom: 718 },
    talkPosition: { x: "950px", y: "745px" },
    // Her account plays the first time Frank talks to her; then four topics, each asked one of three ways.
    // Nice ones win her round, pressing ones put her on guard. With all four asked, and the bottle in his pocket,
    // he can show it to her: whether she lets slip the boy's name rests on how he's treated her.
    talkOptions: [
      {
        id: "shut-down",
        auto: true,
        requiresStoryFlag: "neighbourClosedUp",
        ends: true,
        lines: [{ speaker: "npc", text: "I've told you all I'm going to. Please, just leave me be." }],
      },
      {
        id: "account",
        auto: true,
        lines: [
          { speaker: "frank", text: "You're the one who found him?" },
          { speaker: "npc", text: `${neighbour.firstName}. I'm across the landing. We were neighbours first, and friends after. Good friends, by the end.` },
          { speaker: "npc", text: "Once or twice a week we'd have a pot of tea, his place or mine. A natter, nothing more." },
          { speaker: "npc", text: "He gave me a spare key. You do, don't you, with someone you trust." },
          { speaker: "npc", text: "I hadn't seen him for a couple of days. That's not like him. Not a peep through the wall." },
          { speaker: "npc", text: "So I let myself in. The smell hit me in the hall. And there he was, slumped on the sofa." },
          { speaker: "npc", text: "I knew straight off. I didn't go near him, I couldn't. I went back out and rang you lot." },
          { speaker: "npc", text: "Last time I saw him he was round mine for a cuppa, same as ever. Nothing out of the ordinary." },
        ],
      },
      {
        id: "their-friendship",
        line: "Ask about the two of them",
        approaches: [
          {
            id: "nice",
            line: "Sounds like you two looked out for each other.",
            replies: ["We did. I'd take him round a plate on a Sunday, and he'd put up my shelves and fix my telly."],
            effect: { rapport: 1 },
          },
          {
            id: "neutral",
            line: "How well did you know him?",
            replies: ["Well enough. It was nods on the stairs to start with, then tea, then... friends."],
          },
          {
            id: "pressing",
            line: "A key to a man's flat. That's more than neighbourly.",
            replies: ["And what's that supposed to mean? He was my friend. That's all he was."],
            effect: { defensiveness: 1 },
          },
        ],
        then: {
          lines: [
            { speaker: "npc", text: "It crept up on us, I suppose. Eleven years across a landing. You get close." },
            { speaker: "npc", text: "That's why he gave me the key. He trusted me, and I trusted him." },
          ],
        },
      },
      {
        id: "recent-behaviour",
        line: "Ask how he'd been lately",
        approaches: [
          {
            id: "nice",
            line: "Had he seemed himself lately? You'd have noticed, if anyone did.",
            replies: ["You're right, I did."],
            effect: { rapport: 1 },
          },
          {
            id: "neutral",
            line: "Did you notice any change in him?",
            replies: ["Now you mention it."],
          },
          {
            id: "pressing",
            line: "Something was going on with him. What was it?",
            replies: ["Don't take that tone with me. I'm not one of your suspects."],
            effect: { defensiveness: 1 },
          },
        ],
        then: {
          lines: [
            { speaker: "npc", text: "He'd not been right these last few weeks. On edge." },
            // She says more to someone she's warmed to
            {
              speaker: "npc",
              text: "Jumpy. Miles away half the time. He'd stop in the middle of a sentence and look at the door.",
              when: { minRapport: 1, maxDefensiveness: 1 },
            },
            {
              speaker: "npc",
              text: `I asked him straight out, what's the matter, ${victim.firstName}? He laughed it off. Said it was work, said it was nothing.`,
              when: { minRapport: 1, maxDefensiveness: 1 },
            },
            { speaker: "npc", text: "I asked him about it. He said it was nothing.", unless: { minRapport: 1, maxDefensiveness: 1 } },
          ],
        },
      },
      {
        id: "work",
        line: "Ask about his work",
        approaches: [
          {
            id: "nice",
            line: "Did he ever talk to you about his job?",
            replies: ["Now and then, over a cuppa."],
            effect: { rapport: 1 },
          },
          {
            id: "neutral",
            line: "What did he do for a living?",
            replies: ["He worked nights."],
          },
          {
            id: "pressing",
            line: "Where did he work? I need specifics.",
            replies: ["Specifics? I was his neighbour, not his boss."],
            effect: { defensiveness: 1 },
          },
        ],
        then: {
          lines: [
            { speaker: "npc", text: "Security guard, nights. Somewhere in the City, one of the money places. A bank, I think." },
            { speaker: "npc", text: "He never said which, and I never asked what he did there. You don't, do you?" },
          ],
        },
      },
      {
        id: "family",
        line: "Ask about his family",
        approaches: [
          {
            id: "nice",
            line: "Was there anyone he was close to? Family?",
            replies: ["Oh, yes."],
            effect: { rapport: 1 },
          },
          {
            id: "neutral",
            line: "Did he have any family?",
            replies: ["He did."],
          },
          {
            id: "pressing",
            line: "There's a kid's bedroom in there. Whose is it?",
            replies: ["His son's, obviously. You've got eyes, haven't you?"],
            effect: { defensiveness: 1 },
          },
        ],
        then: {
          lines: [
            { speaker: "npc", text: "He's got a son. Lovely boy. I've had him round mine for squash and biscuits more times than I can count." },
            { speaker: "npc", text: "That boy was everything to him. Everything. He'd talk about him for hours." },
            { speaker: "npc", text: "Whatever else, he was a devoted dad. Nobody could say otherwise." },
          ],
        },
      },
      // With all four asked and the bottle on him; she shuts down after, either way, so it's shown once
      {
        id: "show-pill-bottle",
        requiresHeard: ["their-friendship", "recent-behaviour", "work", "family"],
        requiresItem: "pill-bottle",
        hiddenByStoryFlag: "neighbourClosedUp",
        line: "Show her the pill bottle",
        lines: [
          { speaker: "frank", text: `This was on the table by him. It's made out to ${neighbourName}. Recognise it?` },
          { speaker: "npc", text: "Oh... that's mine." },
          { speaker: "npc", text: "I gave him those. He'd been having trouble sleeping, and I had a spare prescription." },
          { speaker: "npc", text: "I gave him the whole bottle. It was unopened. I thought he'd just take one now and then, when he needed it." },
          { speaker: "npc", text: "I never thought... I didn't think anything like this would happen." },
          { speaker: "frank", text: "Why give him the whole bottle? Why not just a couple of tablets?" },
        ],
        noteId: "flat-kitchen-neighbours-pills",
        setsStoryFlag: "neighbourShownBottle",
        then: {
          approaches: [
            {
              id: "nice",
              line: "You were trying to help him, weren't you?",
              replies: ["Of course I was. He'd been having trouble sleeping for a while. I had a spare prescription and thought it might help. I didn't see the harm."],
              effect: { rapport: 1 },
            },
            {
              id: "neutral",
              line: "You thought giving him the whole bottle was appropriate?",
              replies: ["I suppose I didn't really think it through. I wasn't using them any more. I thought he'd take one when he couldn't sleep."],
            },
            {
              id: "pressing",
              line: "You handed someone else an entire bottle of prescription medication?",
              replies: ["I know how it sounds! I wasn't trying to hurt him. He was my friend. I was only trying to help."],
              effect: { defensiveness: 1 },
            },
          ],
          then: {
            outcomes: [
              // Won round, she lets her guard down
              {
                when: { minRapport: REVEAL_RAPPORT, maxDefensiveness: REVEAL_MAX_DEFENSIVENESS },
                lines: [
                  { speaker: "npc", text: "I just wanted to help him. He was having such a hard time lately..." },
                  { speaker: "npc", text: `And what am I supposed to tell ${victim.son}? How do I explain that I gave his dad those tablets?` },
                  { speaker: "frank", text: `${victim.son}?` },
                  { speaker: "npc", text: "...I've said too much. I'd like you to go now, please. I'm not saying anything else." },
                ],
                noteId: "flat-kitchen-son-sam",
                setsStoryFlag: ["samNameRevealed", "neighbourClosedUp"],
                ends: true,
              },
              {
                lines: [
                  { speaker: "npc", text: "And what am I supposed to tell his boy? I can't have him thinking I did this to his dad..." },
                  { speaker: "npc", text: "...No. I'm not doing this, not with you. I'd like you to go now, please." },
                ],
                setsStoryFlag: "neighbourClosedUp",
                ends: true,
              },
            ],
          },
        },
      },
    ],
  },
];

export const npcFootprints = victimsFlatKitchenNPCs.map((npc) => npc.footprint);

export default victimsFlatKitchenNPCs;
