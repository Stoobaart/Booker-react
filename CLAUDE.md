# Booker

Browser point-and-click adventure game (React 19 + Vite + Redux Toolkit + React Router v7 + SCSS). Set in London, 1996; you play as Frank.

## Commands
- `npm run dev` — dev server at http://localhost:5173
- `npm run lint` — ESLint (run before finishing any change)
- `npm run build` — production build (run to catch import/build errors)
- No test suite yet — verify changes by running the game and play-testing the affected scene.

## Project structure
Feature-based, not type-based. Each feature folder has subfolders as needed:
`components/`, `pages/`, `hooks/`, `context/`, `slices/`, `data/`, and an `index.js` barrel.

- `src/features/scenes/<sceneName>/` — one folder per scene; `pages/<Scene>.jsx` + `.scss`, scene-only components in `components/`, objects/NPCs in `data/<scene>Objects.js` / `data/<scene>NPCs.js`
- `src/features/{game,inventory,npc,player,dialogue}/` — game systems
- `src/shared/` — reusable across scenes: `WalkArea`, `PickupItem`, `NavigationItem`, `NPC`, `GameModal`, `NPCDialogueModal`, hooks (`useMusic`, `useTypewriter`, `useNPCConversation`, `useSpeechInput`), `utils/saveGame.js`
- `src/store/store.js` — the only file in `store/`
- Routes are registered in `src/App.jsx`

## Game canvas & coordinates
- `#root` is a fixed 1920x980 canvas scaled via `--game-scale` (set in `src/main.jsx`).
- Pointer coords must go through `screenToGame()` in `src/features/player/hooks/usePlayerActions.js` (accounts for scale and centering offset) — never use raw page/client coords as game positions.
- Player actions (`walk`, `walkTo`, `teleport`, `pickupItem`) come from `PlayerContext`.

## State & saving
- Story flags live in `gameSlice.storyProgress`; set with `setStoryProgress('flagName')`. Add new flags to `initialState` with a `false` default.
- Read `storyProgress` with optional chaining (`storyProgress?.flag`) — old saves may lack new keys.
- Redux state auto-saves to localStorage (`booker-save`) via the subscriber in `main.jsx`, so keep the store serialisable.
- Export slice actions individually.

## Conventions
- Plain JSX, no TypeScript.
- SCSS with BEM-style nesting; each component/page imports its own `.scss`. No CSS modules.
- Pixel art: `image-rendering: pixelated`; font `PressStart2PType`; sizes in `rem` (16px base).
- Sprite animations use `steps(N)` on `background-position-x` / `translateX`.
- z-index layers: items 2, Frank 3, item menus 6, modals 20+.
- Don't use `useRef` for values that drive rendering — use `useState(() => init)`.
- Scene content (objects, NPCs) goes in the scene's `data/` file as plain objects, not hard-coded in JSX.

## NPC dialogue (LLM)
- `useNPCConversation` calls the Anthropic API directly from the browser using `VITE_ANTHROPIC_API_KEY` (`.env`, gitignored). This exposes the key in the client bundle — fine for local dev only; needs a backend proxy before any public deploy.
- NPC personas are `systemPrompt` strings in the scene's `data/*NPCs.js`.

## Workflow
- One feature per branch, small PRs into `main`.
- For anything beyond a small fix, plan first, then implement.
- Keep `README.md` in sync when adding scenes, routes or systems.
