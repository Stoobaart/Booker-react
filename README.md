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

## Project Structure

```
src/
  features/
    dialogue/         # TalkOverlay, useTalkActions
    game/             # gameSlice (scene, position, storyProgress)
    inventory/        # inventorySlice, Inventory UI
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
      testArea/                        # Dev sandbox
  shared/
    components/   # WalkArea, PickupItem, NavigationItem, GameModal, NPC (static or sprite-sheet animated; talk, and inspect with `inspectLines`), DrivingCar (a lane of passing traffic), RainOverlay, RainSplashes
    hooks/        # useMusic, useIdleAnimation (NPC idle loops), useSideScroll (camera for scenes wider than the screen)
    utils/        # saveGame (localStorage)
  store/
    store.js      # Redux store
  assets/
    images/       # backgrounds, sprites, objects, portraits
    music/        # ambient tracks (.wav)
    sfx/          # sound effects (.wav)
    fonts/
tools/
  backgrounds/    # Python generators for the backgrounds and their cut-outs (see its README)
```

## Game Canvas

The game uses a fixed-resolution canvas (1920x980px) to maintain consistent pixel-art rendering across devices. The UI layer is scaled using a CSS-driven transform system (--game-scale), ensuring visual consistency while preserving aspect ratio fidelity. User input is translated from screen space into game space via a coordinate mapping function (screenToGame) within the player interaction system.

## Save System

Game state is persisted via Redux subscriptions to localStorage, creating an automatic persistence layer for all gameplay progress. The system captures scene state, player position, inventory, and narrative flags, enabling full session restoration through a single entry point on game initialization.

## NPC Puzzle Facts

NPCs are AI-driven: `useNPCConversation` sends the persona and recent history to the Anthropic API. An NPC can also list `puzzleFacts` (`id` + `description`) in its scene data. For those NPCs the API is asked for a schema-constrained reply, `{ dialogue, revealedFacts }`, where `revealedFacts` may only contain that NPC's fact ids. Only `dialogue` is shown; the ids are checked against the NPC's list again and recorded in `npcSlice.discoveredFacts` (saved with the game, read with `selectHasDiscoveredFact`). Discovering a fact changes nothing by itself.

An NPC can also have a `puzzleResolution` (`description`, `storyFlag`, `resolvedPrompt`, optional `key`). The reply then carries a `resolved` boolean, true when the NPC's own words agree to it, and the game sets `storyProgress[storyFlag]`. After that the NPC is told it has happened (`resolvedPrompt`).

A `key` (`words`, `storyFlag`, `prompt`) is something the player has to say first, learned elsewhere in the game. The game looks for the words in what the player types. Until one is said, the NPC's persona does not contain them and `resolved` is ignored; once one is said, `storyProgress[key.storyFlag]` is set and `key.prompt` is added to the persona.

Derek (the station worker) stands by the gates in the ticket hall and has the facts `barrier_is_faulty` and `derek_fears_blame`. His key is the name of a colleague sacked for letting passengers through, which is only printed in the newspaper on the platform. When Frank names him and Derek is moved to let him through, `storyProgress.barrierReleased` is set and the ticket hall's exit to the street opens; until then Frank walks to the gates and comments that his card was rejected. The middle gate is a sprite (`TicketGate`) over an empty gap in the background: its paddle doors swing open when Derek releases the barrier, and are drawn already open if Frank comes back later.

## Scenes

| Route | Scene |
|---|---|
| `/` | Splash screen |
| `/great-portland-street` | Underground platform |
| `/great-portland-street-ticket-hall` | Station ticket hall at night (Derek, ticket barriers; the street doorway is cut out of the background, with the street scene and its rain behind it) |
| `/great-portland-street-exterior` | Street exterior at night (two-way traffic; the first time Frank steps out he says why he is here, setting `storyProgress.leftStation`; the left edge of the pavement leads to the residential street) |
| `/residential-street` | A long terrace in the rain, three screens wide and side-scrolling, with two-way traffic: smart by the station, run down at the far end, where a newsagent stands beside the victim's taped-off door, guarded by a constable eating a sandwich (scenery for now: `interactive: false`) |
| `/victims-flat-hallway` | The victim's flat, through the taped-off door on the residential street: a windowless hallway lit by one weak bulb, with three doors (the first on the left leads to the kitchen, the second to the living room; the bedroom, at the end, comes later) and a hall table of unopened post. The near edge of the carpet leads back out |
| `/victims-flat-living-room` | The victim's living room, through the hall's second door on the left (the same door, seen from inside): wallpapered, dark beige carpet, a sofa beside a table lamp (the only light), a round coffee table, two armchairs, a TV (off), a bookshelf and frames including the son's school photos. Frank walks round and behind the coffee table and armchairs (cut out of the background); the door leads back to the hall |
| `/victims-flat-kitchen` | The victim's kitchen, through the hall's first door on the left: a narrow galley of oak units, a stained cooker, the fridge with the son's drawing on it and the sink under the window, lit by one failing fluorescent tube that flickers now and then. The window's panes are cut out of the background, with the backs of the houses opposite and the rain behind them (`KitchenWindow`). Frank walks round and behind the overflowing pedal bin; the bottom edge leads back to the hall |

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
