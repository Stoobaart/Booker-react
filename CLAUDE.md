# Booker

Browser point-and-click adventure game (React 19 + Vite + Redux Toolkit + React Router v7 + SCSS). Set in London, 1996; you play as Frank.

## Commands
- `npm run dev` — dev server at http://localhost:5173
- `npm run lint` — ESLint (run before finishing any change)
- `npm run build` — production build (run to catch import/build errors)
- `npm test` — Vitest in watch mode; `npm run test:run` — run once (run before finishing any change)
- `npm run test:e2e` — Playwright browser tests (starts its own Vite server on port 4789; override with `E2E_PORT`). First time: `npx playwright install chromium`

## Testing
- Vitest + React Testing Library + jsdom. Tests sit next to the code they test (`inventorySlice.test.js` beside `inventorySlice.js`).
- Add or update tests with any logic change: reducers, `saveGame.js`, `features/player/utils/playerMath.js`, hooks, interactive components.
- Use `renderWithProviders()` from `src/test/renderWithProviders.jsx` for components needing Redux or `PlayerContext`; its mock player actions call their callback straight away ("Frank arrived").
- jsdom has no layout or CSS animation, so walking, scaling and anything that depends on real layout belongs in the Playwright tests in `e2e/`. Keep DOM-free maths in `playerMath.js` so it stays unit-testable.
- E2E tests import `test`/`expect` from `e2e/fixtures.js`, which fails the test on any uncaught page error, and provides `startNewGame`, `continueGame`, `seedSave` helpers.
- Prefer `seedSave(page, arrivedAtStationSave)` to skip the arrival train when a test doesn't need the intro.
- Play and stop sounds with `playSound(audio)` / `pauseSound(audio)` from `shared/utils/gameAudio.js`, never `audio.play()` / `pause()` directly: it silences everything while the page is hidden (minimised, other tab, asleep) and resumes it after. `playSound` returns `play()`'s promise, which rejects when interrupted; always `.catch(() => {})` it or the e2e error check fails.
- CI (`.github/workflows/ci.yml`) runs lint, unit tests, build and e2e on every PR and push to `main`.
- Gotcha: `beforeEach(() => fn())` returning a function makes Vitest call it as cleanup — use braces.

## Project structure
Feature-based, not type-based. Each feature folder has subfolders as needed:
`components/`, `pages/`, `hooks/`, `context/`, `slices/`, `data/`, and an `index.js` barrel.

- `src/features/scenes/<sceneName>/` — one folder per scene; `pages/<Scene>.jsx` + `.scss`, scene-only components in `components/`, objects/NPCs in `data/<scene>Objects.js` / `data/<scene>NPCs.js`
- `src/features/{game,inventory,player,dialogue}/` — game systems
- `src/shared/` — reusable across scenes: `WalkArea`, `PickupItem`, `NavigationItem`, `NPC`, `GameModal`, `NPCDialogueModal`, hooks (`useMusic`, `useTypewriter`), `utils/saveGame.js`
- `src/store/store.js` — the only file in `store/`
- Routes are registered in `src/App.jsx`
- `tools/backgrounds/` — Python scripts that generate the backgrounds and their occluder cut-outs; `build.sh <scene>` reruns one and copies the result into `src/assets/images/backgrounds/`. To change a background, edit its script and rebuild rather than editing the PNG; a new location gets a new script there.

## Game canvas & coordinates
- `#root` is a fixed 1920x980 canvas scaled via `--game-scale` (set in `src/main.jsx`).
- Pointer coords must go through `screenToGame()` in `src/features/player/utils/playerMath.js` (accounts for scale, centering offset and a side-scrolling scene's camera) — never use raw page/client coords as game positions.
- A scene wider than the screen (`residentialStreet`) puts its background and foreground in a `.scene-world` div as wide as the scene and calls `useSideScroll(worldRef, width)`; everything in it is positioned in scene px. Keep `RainOverlay` and other screen-fixed layers outside it.
- A rainy scene has `RainOverlay` (falling rain, over everything) and `RainSplashes` (drops landing) as the first child of its foreground, with `top` at the scene's ground line (and `width` if it side-scrolls), so it's under Frank and other foreground objects.
- Player actions (`walk`, `walkTo`, `teleport`, `pickupItem`) come from `PlayerContext`.
- Frank's depth scaling is the `--depth-scale` CSS variable on `#player-container`, which resizes `.player-frame`. Don't scale him with a `transform`: under his drop-shadow filter that blurs the pixel art in Safari.
- `frank.png` is a 16x13 grid of 60x100 frames, one animation per row (rows listed in `Frank.scss`), drawn as a background on the frame-sized `#player-sprite`.

## State & saving
- Story flags live in `gameSlice.storyProgress`; set with `setStoryProgress('flagName')`. Add new flags to `initialState` with a `false` default.
- Read `storyProgress` with optional chaining (`storyProgress?.flag`) — old saves may lack new keys.
- Redux state auto-saves to localStorage (`booker-save`) via the subscriber in `main.jsx` using `buildSaveData()` from `saveGame.js`, so keep the store serialisable.
- Continue restores with the `restore*` actions (`restoreGameState`, `restoreInventory`, `restoreNotes`, `restoreOpenedInvestigations`, `restoreHeardTalkOptions`, `restoreMadeDeductions`, `restoreBoards`), which replace state rather than add to it.
- Export slice actions individually.

## Conventions
- Plain JSX, no TypeScript.
- SCSS with BEM-style nesting; each component/page imports its own `.scss`. No CSS modules.
- Pixel art: `image-rendering: pixelated`; font `PressStart2PType`; sizes in `rem` (16px base).
- Sprite animations use `steps(N)` on `background-position-x` / `translateX`.
- z-index layers: items and NPCs 2, Frank 3, `Occluder` and NPCs 4 (only while Frank is behind them, i.e. his feet are further up the screen than theirs), item menus 6, modals 20+.
- For scenery Frank walks behind (pillars etc.), cut it out of the background as a PNG and add it to the scene data as an `Occluder` with a `baseY`: it covers him only while his feet are above that line. Give it a `footprint` too and pass the footprints to `WalkArea`'s `obstacles`: walks are routed round them (`planPath` in `playerMath.js`), so he never walks through it. NPCs layer against Frank by their feet (`position.y`) automatically; give one a `footprint` and add it to `obstacles` to have him walk round them too.
- The HUD buttons (top right) are pixel icons styled by `shared/components/HudButton.scss`, sized by `--hud-icon-scale` (a whole multiple, bigger on phones so they can be tapped; `shared/utils/hudScale.js`). Their icons are drawn by `tools/backgrounds/ui-icons.py` (`build.sh icons`).
- The mouse cursors are pixel art too (also `ui-icons.py`): use `cursor: var(--cursor-pointer)` on anything clickable and `var(--cursor-default)` to reset, never the bare `pointer` / `default` keywords. The variables are on `:root` in `App.scss`.
- The inventory is the evidence box (`Inventory.jsx`): one `INVENTORY_ANIMATION_MS` animation opens it (slide in, lid off, items up) and the same keyframes, reversed, close it, so it stays mounted while it closes. It shows `ITEMS_PER_ROW` items at a time; its arrows sink the row back into the box and raise the next (`ROW_SWAP_MS` each way). Its art (`evidence-box.py`, also `build.sh icons`) is three images on one canvas, stacked, and the SCSS places things in the art's pixels (`--art`).
- Things Frank can carry are defined in `features/inventory/data/items.js` (sprites drawn by `tools/backgrounds/item-sprites.py`, `build.sh items`).
- Don't use `useRef` for values that drive rendering — use `useState(() => init)`.
- Scene content (objects, NPCs) goes in the scene's `data/` file as plain objects, not hard-coded in JSX.

## Investigation notes
- What Frank learns goes in his notebook, never the inventory. The inventory is only for things he carries; `addItem` counts repeats as quantity.
- Every note is defined in `src/features/investigation/data/investigationNotes.js` (`{ id, title, text, investigationId?, roomId?, pinnable? }`; `pinnable: false` keeps it out of the deductions board's sidebar). Investigations and their rooms, in tab order, are in `investigations.js`. A test fails if a note's room or investigation doesn't exist.
- An investigation's notebook tab shows once it's opened (`openAtStart`, or a scene dispatching `openInvestigation(id)` on arrival, as the flat's hallway does) or has a note. Opening one announces "New case notes" in `NoteToast` (after any new note); clicking it opens the notebook on that tab (`openNotebook(tabId)`). `openedInvestigationIds` is saved.
- Scene data points at a note with `noteId` (also on an NPC's talk option), or `inspectNoteId` on an NPC. Scenes record it with `useInspect(setLinesAndSpeak)` (or `discoverNote(id)`), which ignores repeats, so never track "already found" in the scene.
- A note's text is fixed: new information is a new note id. Redux and the save keep only ids.
- The deductions board (`features/deduction/`, HUD cork-board icon) pins notes and inventory items as nodes on a cork board: `deductionSlice.boards[boardId].nodes` (`{ id: 'kind:refId', kind, refId, x, y }`, positions as fractions of the board inside its frame; `removeNode` sends one back to the sidebar). Strings between nodes are `connections` (`{ id, from, to }`, undirected, `connectNodes` / `disconnectNodes`), drawn by `BoardStrings` from a rope simulation in `utils/rope.js`. Pointer maths is in `utils/boardMath.js`; dragging is tested in `e2e/deduction.spec.js`. The boards are saved (`deduction.boards`, not `isBoardOpen`) and restored on Continue with `restoreBoards`.
- A deduction (`features/deduction/data/deductions.js`: `{ id, boardId, text, from, to }`) is a post-it the board pins when a string joins its `from` and `to` nodes (either can be another deduction's post-it, `deduction:<id>`, to chain them); the reducers keep post-its in step with the strings (`syncDeductions`), so cutting that string removes it. Its own string, to the middle of the one that made it, can't be cut, and it has no X. `madeDeductionIds` remembers it was made even after it comes off (`selectHasMadeDeduction`, saved, restored with `restoreMadeDeductions` before `restoreBoards`): that's what dialogue choices will check.
- A deduction's `talkTo` names who it gives Frank something new to say to. Frank's two one-off tutorial lines come from `nextNudge` (`features/dialogue/utils/nudges.js`), spoken by `useFrankNudges` in each scene once nothing else is on screen (no speech, chat or notebook): with his first two pinnable notes he says to use the board once it's shut (`boardNudged`), and once a deduction has opened a talk option he can say and hasn't, he says to ask its `talkTo` straight away, over the board (`talkNudged`; every deduction an option needs must have a `talkTo`, `allNPCs` in `features/dialogue/data/npcs.js` lists who to check). `TalkOverlay` moves itself above the board (`talk-overlay--over-board`) whenever the board is open. Seed both flags `true` in e2e saves that don't test them, or Frank talks over the test.
- Things painted into a background are inspected through a `Hotspot` (`position`, `size`, `standAt`, `face`, in the scene's `hotspots` data).

## NPC dialogue
- Clicking an NPC offers talk (a mouth icon); give it `inspectLines` and pass `onInspect` to `NPC` (the scene speaks the lines with `setLinesAndSpeak`) to offer inspect (the magnifying glass) too.
- Talking opens `NPCDialogueModal`, whose box holds only the NPC's `talkOptions` (`{ id, line, replies: [...] }` in the scene's `data/*NPCs.js`). Choosing one hides the box and plays Frank's `line` then each reply, typed beside the speaker's portrait, one click per line. Whether an option is offered is `isTalkOptionAvailable` (`features/dialogue/utils/talkOptions.js`): `requiresStoryFlag`, `requiresDeduction` (a made deduction id), `requiresHeard` (another option of the NPC's played to the end) and `hiddenByStoryFlag`. Once played to the end, an option's `noteId` is noted and its `setsStoryFlag` set; one with `ends: true` closes the chat after its last line (and is never greyed). Otherwise, once played to the end the option is greyed out but can be replayed; `dialogueSlice.heardTalkOptions[npcId]` records it (saved, restored with `restoreHeardTalkOptions`).
- The chat header shows an NPC's `unknownName` until Frank has found their `nameNoteId` note (Derek: "Station worker" until his name tag is inspected), then their `name`.
- An NPC with `interactive: false` in its data is scenery for now: it animates and layers with Frank, but clicks pass through it (the residential street's constable).
- An NPC's `speechColor` colours their lines in the chat (Derek's is orange); Frank's are white.
- An NPC's `portrait` is a talking strip like Frank's (`assets/images/portraits/`: 15 frames of 80x96 on the dark red circle), drawn facing left towards Frank's. `NPCDialogueModal` animates whichever portrait's line is typing out.
- Derek stands in the ticket hall; `storyProgress.barrierReleased` unblocks its exit to the street (`NavigationItem`'s `onBlocked`) and opens the `TicketGate` sprite in the gap left for it in the background. Trying the gate before then sets `triedBarrier`, which unlocks asking Derek about the barriers; the `derek-knew-sacked-worker` deduction unlocks asking about Clive; once that's heard, the `derek-fears-ending-up-like-clive` deduction (the first post-it strung to the `derek-fears-blame` note) unlocks "what would Clive do?", which sets `barrierReleased` and closes the chat; `TicketGate`'s `onOpened` (end of its animation) then has the scene play Derek's `releasedLines` as a script. Route order: platform → ticket hall → street. Use `barrierReleasedSave` in e2e tests that need to leave the station.
- Pass `NPCDialogueModal` a `script` (`[{ speaker, text }]`) to play just those lines with no options box, then close.

## Workflow
- One feature per branch, small PRs into `main`.
- For anything beyond a small fix, plan first, then implement.
- Keep `README.md` in sync when adding scenes, routes or systems.
