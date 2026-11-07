# Booker

This project demonstrates frontend engineering for a browser-based point-and-click adventure game built with React. It focuses on building a modular, state-driven game architecture that supports interactive scenes, inventory management, and narrative progression. The system is designed around predictable state transitions, scene-based routing, and a clear separation between game logic, UI rendering, and player interaction systems.

Set in London, you play as Frank, navigating environments, interacting with objects, collecting items, and progressing through a structured narrative system.

## Tech Stack

- **React 19** + **Vite** — component-based UI rendering and game view layer
- **Redux Toolkit** — centralised game state management (scene, inventory, progression)
- **React Router v7** — scene-level routing abstraction
- **SCSS** — structured styling system for scalable UI components
- **Pixel art asset pipeline** — consistent visual language using custom fonts, sprites, and audio assets

## Getting Started

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173`.

### Other commands

```bash
npm run build     # production build
npm run preview   # preview production build
npm run lint      # ESLint
```

### Deployment

Every push to `main` builds the game and publishes it to GitHub Pages (`.github/workflows/deploy.yml`) at https://stoobaart.github.io/Booker-react/. Production builds use the `/Booker-react/` base path (`vite.config.js`), which the router picks up as its `basename`; dev and e2e still run at `/`.

## Project Structure

```
src/
  features/
    deduction/        # The deductions cork board: deductionSlice, DeductionBoard, BoardSidebar, BoardNode, boardMath, deductions data
    dialogue/         # TalkOverlay, useTalkActions, dialogueSlice (talk options heard)
    game/             # gameSlice (scene, position, storyProgress)
    inventory/        # inventorySlice, the evidence box (Inventory UI)
    investigation/    # Frank's notebook: note definitions, investigationSlice, Notebook, NoteToast, useInspect
    tutorial/         # The station tutorial: steps data, tutorialSlice, TutorialOverlay (veil, spotlight hole, typed tips)
    player/           # Frank sprite, PlayerContext, usePlayerActions, useFrankIdle (idle fidgets)
    scenes/
      splash/                          # Title / start screen
      beginnings/                      # Intro scene
      greatPortlandStreetExterior/     # Street scene (rain, two-way traffic)
      greatPortlandStreetUnderground/  # Underground station platform
      greatPortlandStreetTicketHall/   # Ticket hall (Derek, animated ticket gate, rainy street through the doorway)
      residentialStreet/               # Side-scrolling terrace to the victim's flat (three screens wide)
      victimsFlatHallway/              # The victim's hallway (dark, three closed doors, a table of post)
      victimsFlatLivingRoom/           # The victim's living room (dark, old-fashioned, lamplit, TV off)
      victimsFlatKitchen/              # The victim's kitchen (galley, one fluorescent tube, rain on the window)
      victimsFlatBedroom/              # The victim's bedroom (posters, fairy lights, a 1997 top-end PC, rain on the window)
  shared/
    components/   # WalkArea, PickupItem, Hotspot (something painted into a background to inspect), NavigationItem, GameModal, NPC (static or sprite-sheet animated; talk, and inspect with `inspectLines`), DrivingCar (a lane of passing traffic), RainOverlay, RainSplashes, RainyWindow (the night and its rain behind a window cut out of a background), RouteMusic (in the layout: plays a track that carries on across several scenes)
    data/         # routeMusic (which scenes share a music track)
    hooks/        # useMusic, useIdleAnimation (NPC idle loops), useSideScroll (camera for scenes wider than the screen)
    utils/        # saveGame (localStorage)
  store/
    store.js      # Redux store
  assets/
    images/       # backgrounds, sprites, objects, portraits
    music/        # ambient tracks and music (.mp3)
    sfx/          # sound effects (.mp3; very short ones .wav, which starts without an MP3's few ms of silence)
    fonts/
tools/
  backgrounds/    # Python generators for the backgrounds and their cut-outs (see its README)
```

## Game Canvas

The game uses a fixed-resolution canvas (1920x980px) to maintain consistent pixel-art rendering across devices. The UI layer is scaled using a CSS-driven transform system (--game-scale), ensuring visual consistency while preserving aspect ratio fidelity. User input is translated from screen space into game space via a coordinate mapping function (screenToGame) within the player interaction system.

## Save System

Game state is persisted via Redux subscriptions to localStorage, creating an automatic persistence layer for all gameplay progress. The system captures scene state, player position, inventory, the notes found, the deductions boards, how far the tutorial got, and narrative flags, enabling full session restoration through a single entry point on game initialization.

## Investigation Notes

Frank keeps what he learns apart from what he carries. Physical things he picks up go in the inventory (`inventorySlice`); what he finds out goes in his notebook as notes (`features/investigation/`).

The inventory is an evidence box: its icon slides the box in from the right with the lid on, the lid pops off and the items rise out of it, and picking one out shows its evidence tag beside the box. It holds four items in a row; with more, arrows on its front sink that row back into the box and raise the next. Closing plays it backwards. The whole thing takes `INVENTORY_ANIMATION_MS` (1.5s), and the box art is drawn by `tools/backgrounds/evidence-box.py`.

- **Definitions:** every note is defined in `investigation/data/investigationNotes.js`: `{ id, title, text, investigationId?, roomId? }`. The investigations, and their rooms, are in `investigations.js`, in tab order. A note with no investigation goes in the General tab. A note's text never changes: when Frank learns more, that's a new note.
- **State:** `investigationSlice` keeps only the ids found (`discoveredNoteIds`, saved with the game and restored on Continue). `discoverNote(id)` ignores ids already found and unknown ones, so scenes can dispatch it every time.
- **Where notes come from:** scene data points at a note with a `noteId`:
  - on a `Hotspot`, an invisible inspect-only box over the background art, with `standAt` and `face` for where Frank stands to look
  - on a `PickupItem`'s object (the newspaper)
  - `inspectNoteId` on an NPC
  - a `noteId` on an NPC's talk option, noted once that conversation has played to the end

  Scenes handle an inspect with `useInspect(setLinesAndSpeak)`: Frank says the lines and the note is recorded.
- **UI:** the notepad icon (top right, beside the inventory's evidence box) opens the notebook, with a tab per investigation opened so far and notes grouped by room. Great Portland St is open from the start (`openAtStart`); the victim's flat opens when Frank reaches its hallway (`openInvestigation`), and a tab also shows once it has a note. `NoteToast` announces a note the first time it's found, and a newly opened investigation as "New case notes" (clicking it opens the notebook on that tab). The investigations opened are saved (`openedInvestigationIds`) and restored with `restoreOpenedInvestigations`.

## Tutorial

A new game teaches itself on the platform and in the ticket hall (`features/tutorial/`). The canvas dims except for a spotlight hole round the one thing to click, with a typed tip beside it (Next for tips that just explain, nothing for ones that wait for the player to do it), and a Skip link that asks first.

- **Platform:** walking, clicking the newspaper and inspecting it, the "Note added" toast (held on screen until the player clicks it), the notebook (its pages, tabs, close button and HUD icon), then the stairs.
- **Ticket hall:** trying the barriers, inspecting Derek, talking to him and asking about the barriers, notes coming from conversations, then the deductions board: pinning the newspaper and Derek, stringing them into a post-it, asking Derek about Clive, building a second deduction on the first, and persuading Derek, who opens the gate.
- **How it works:** the steps are data (`data/tutorialSteps.js`); each names what to highlight (falling back as the player moves between Derek, his menu and the chat) and what finishes it: Next, a change in the game's state, or an action a component reports with `reportTutorialAction`. `tutorialSlice` keeps the furthest step done and whether it was skipped; both are saved, and a save made mid-way picks up where the player had got to.

## Deductions Board

The cork-board icon (top right, left of the notebook) opens the deductions board (`features/deduction/`). There's one board per investigation (`data/boards.js`, from `investigations.js`), each on a tab once its investigation's notebook tab shows; it opens on the board for the scene Frank is in, or else the first. The sidebar lists the notes Frank has found for that board's investigation (and any belonging to none), so the station's and the flat's notes can't be mixed, and on an Evidence tab everything in the inventory, which can go on any board. Dragging one onto the cork pins it there as a node (an index card for a note, a polaroid for an item), and it leaves the sidebar so it can't be pinned twice. Pinned nodes can be dragged about the board, and are kept wholly on it. A node's X (showing on hover, or always on a touch screen) takes it off the board and back to the sidebar.

- **Strings:** red strings hang from a nail in the board's top-left corner. Clicking them picks one up; clicking a card ties it to that card's pin, and clicking a second card ties the other end, connecting the two. Clicking anything else (or Escape) lets go. Chains are built a string at a time. Clicking a tied string picks it out with an X in its middle that cuts it. Each string is a small rope simulation (`utils/rope.js`, drawn every frame by `BoardStrings`), so it sags, swings, and stays on both pins as the cards move.
- **Deductions:** connecting the right two nodes makes a deduction, which Frank writes on a post-it (`data/deductions.js`: `{ id, boardId, text, from, to }`, with `from` and `to` node ids, either way round). The post-it is pinned below the string, tied to its middle by a string of its own that can't be cut, and has no X. Cutting the string that made it (or taking either card off) takes the post-it off too. Other strings make nothing, so nothing can go wrong. The station's two are the tutorial: the newspaper's sacked Tube worker and Derek's note make "Did Derek know the sacked Tube worker, Clive?", and stringing that post-it to the station worker's fear of opening the barriers makes "Derek fears ending up like Clive, but respected him": a post-it can be strung like any card, so deductions build on each other, and cutting the first takes the second with it. Frank can get the fear note before he's read Derek's name tag, so it doesn't name him. A note with `pinnable: false` ("Broken ticket barriers", "Derek opened the barrier") stays in the notebook but isn't listed on the board.
- **Deductions made:** `deductionSlice.madeDeductionIds` records every deduction Frank has made, and keeps it after its post-it comes off. `selectHasMadeDeduction(state, id)` reads it, and talk options' `requiresDeduction` checks it.
- **State:** `deductionSlice` keeps `boards[boardId].nodes`, each `{ id, kind: 'note' | 'item' | 'deduction', refId, x, y }`, with `x` and `y` the node's centre as fractions of the board (so it's the same at any screen size). They're drawn in that order, and moving one puts it last, so the node dropped last is on top. `boards[boardId].connections` records the strings, `{ id, from, to }` between two node ids (no direction); taking a node off the board cuts its strings. Every change to the strings puts on or takes off the post-its they make. `placeNode` refuses a note from another investigation (`canPinOn`), and `restoreBoards` sends one saved on the wrong board (from before there was a board each) back to the sidebar, with its strings. The boards (cards, their positions and order, and strings, but not whether the board is open) and the deductions made are saved with the game, and Continue puts them back with `restoreMadeDeductions` then `restoreBoards`.
- **Dragging:** pointer events, so it works with touch too. The pointer maths (fractions of the board inside its frame, keeping a node on the board) is in `utils/boardMath.js`.


The victim's flat has placeholder hotspots (the post on the hall table, the coffee table, the kitchen sink and pedal bin, the bedroom's computer and posters) with draft notes, waiting for the real clues.

## NPC Dialogue

Talking to an NPC opens `NPCDialogueModal`, a box holding the NPC's `talkOptions` (`{ id, line, replies }` in its scene data). Clicking one hides the box and plays the conversation: Frank's `line`, then each of the NPC's `replies`, each typed out beside the speaker's talking portrait (in the NPC's `speechColor`, if they have one), one click per line. An option can wait for a story flag (`requiresStoryFlag`), a deduction made on the board (`requiresDeduction`) or another option heard to the end (`requiresHeard`), and goes once `hiddenByStoryFlag` is set (`isTalkOptionAvailable` in `features/dialogue/utils/talkOptions.js`). One with `setsStoryFlag` sets it once played to the end, one with a `noteId` adds that note to Frank's notebook once played to the end, and one with `ends: true` closes the chat after its last line. Any other option played to the end is greyed out, but can be played again; `dialogueSlice.heardTalkOptions` records which, and is saved with the game.

An NPC can have an `unknownName` and a `nameNoteId`: the box's header shows `unknownName` until that note is in Frank's notebook, then `name`. Derek is "Station worker" until Frank inspects him and reads his name tag.

Derek (the station worker) stands by the gates in the ticket hall. Frank can say good evening and goodbye. Once he has tried the gate and been turned back (`storyProgress.triedBarrier`), he can also ask for help with the barriers, and Derek says they're broken, Frank will have to wait, and he won't override them by hand because it's his neck on the line. That notes `derek-fears-blame`: Frank will have to persuade him. Once Frank has made the deduction "Did Derek know the sacked Tube worker?" he can say he read about the man who was fired (sacked for letting stranded passengers out when the barriers broke), and Derek remembers Clive. Once he's heard that and made "Derek fears ending up like Clive, but respected him", Frank can ask what Clive would do: Derek gives in, the chat closes, `storyProgress.barrierReleased` is set and the gate swings open; when it has (`TicketGate`'s `onOpened`), Derek asks Frank to keep it between them (his `releasedLines`, played as an `NPCDialogueModal` `script`), and the exit to the street is open. Frank notes `derek-opened-barrier`. Until then Frank walks to the gates, comments that his card was rejected, and notes the blocker (`ticket-barrier-rejected`). The middle gate is a sprite (`TicketGate`) over an empty gap in the background: its paddle doors swing open when the barrier is released, and are drawn already open if Frank comes back later.

## Scenes

| Route | Scene |
|---|---|
| `/` | Splash screen |
| `/great-portland-street` | Underground platform |
| `/great-portland-street-ticket-hall` | Station ticket hall at night (Derek, ticket barriers; the street doorway is cut out of the background, with the street scene and its rain behind it) |
| `/great-portland-street-exterior` | Street exterior at night (two-way traffic; the first time Frank steps out he says why he is here, setting `storyProgress.leftStation`; the left edge of the pavement leads to the residential street) |
| `/residential-street` | A long terrace in the rain, three screens wide and side-scrolling, with two-way traffic: smart by the station, run down at the far end, where a newsagent stands beside the victim's taped-off door, guarded by a constable eating a sandwich (scenery for now: `interactive: false`) |
| `/victims-flat-hallway` | The victim's flat, through the taped-off door on the residential street: a windowless hallway lit by one weak bulb, with three doors (the first on the left leads to the kitchen, the second to the living room, the one at the end to the bedroom) and a hall table of unopened post. The near edge of the carpet leads back out |
| `/victims-flat-living-room` | The victim's living room, through the hall's second door on the left (the same door, seen from inside): wallpapered, dark beige carpet, a sofa beside a table lamp (the only light), a round coffee table, two armchairs, a TV (off), a bookshelf and frames including the son's school photos. Frank walks round and behind the coffee table and armchairs (cut out of the background); the door leads back to the hall |
| `/victims-flat-kitchen` | The victim's kitchen, through the hall's first door on the left: a narrow galley of oak units, a stained cooker, the fridge with the son's drawing on it and the sink under the window, lit by one failing fluorescent tube that flickers now and then. The window's panes are cut out of the background, with the backs of the houses opposite and the rain behind them (`RainyWindow`). Frank walks round and behind the overflowing pedal bin; the bottom edge leads back to the hall |
| `/victims-flat-bedroom` | The victim's bedroom, through the door at the end of the hall: posters, pennants and a dartboard, a pine bed under a big window with its blind pulled up and fairy lights round it (painted unlit in the background; `FairyLights` lights each bulb over the top and twinkles it out of step with the rest), and in the back right-hand corner a top-of-the-range 1997 PC (full tower, 17" CRT with a starfield screensaver, speakers, inkjet, joystick) on a corner desk. Lit by the bedside lamp, the fairy lights and the screen. The window shows the street at night and its rain (`RainyWindow`). Frank walks round the bed, the desk and the chair, and behind the bed; the bottom edge leads back to the hall |

## Item Interactions

The interaction system is event-driven, where game objects expose context-specific actions (inspect, collect, etc.). Interactions trigger controlled player movement followed by state transitions, decoupling UI input from game logic execution. This ensures consistent behaviour across different interaction types and scenes.

## Rain

A rainy scene has two layers. `RainOverlay` is the falling rain, fixed to the screen over everything. `RainSplashes` is the rain landing: a canvas of pixel-art splashes laid over the ground only, from `top` (where the scene's ground starts, in game px) to `bottom` (980 by default), so each scene lines it up with its own pavement. It sits in the foreground under Frank, cars and items, so they pass over the splashes. Splashes grow towards the front of the ground. In a side-scrolling scene, pass the scene's `width`; splashes only appear in the stretch under the camera.

Passing traffic is `DrivingCar`, one per lane (a scene lists its lanes in its data file: direction, `near`/`far` lane, timing, volume). Cars keep to the left. In a side-scrolling scene they go outside the `.scene-world`, on the screen, so a car is only seen and heard as it drives past the camera.

## Side-Scrolling Scenes

A scene wider than the 1920px screen wraps its background and foreground in a `.scene-world` element as wide as the scene, and calls `useSideScroll(worldRef, width)`. Each frame it reads where Frank is (mid-walk too) and slides the world left to keep him centred, stopping at either end. Positions in the scene (Frank's, exits', items') are in scene coordinates; `screenToGame()` adds the camera's offset, so clicks land in the right place and walking, pathfinding and saving work unchanged. The camera is 0 in every other scene.

## Depth: Walking Behind Scenery

Scenery Frank can pass behind (the ticket hall's pillars, the residential street's lamps along the kerb) is cut out of the background as its own PNG and drawn by `Occluder` over Frank, but only while his feet are further up the screen than the scenery's base. Each also has a floor footprint; `WalkArea` takes these as `obstacles`, and every walk is planned round them (shortest route via their corners), so he goes round a pillar rather than through it. A click inside a footprint stops him at its edge. NPCs work the same way: one is drawn over Frank while his feet are further up the screen than theirs (their `position.y`), and an NPC with a `footprint` (Derek) is added to the scene's `obstacles` so Frank walks round them.

## Player Controls

Player movement is driven by pointer-based input, with screen coordinates converted into game-world positions. The system supports both desktop and mobile interaction patterns, including click-to-move navigation and touch-based teleportation for accessibility on smaller devices.

| Input | Action |
|---|---|
| Left click | Walk to position |
| Double tap (mobile) | Teleport to position |
| Click item | Open interaction menu |
