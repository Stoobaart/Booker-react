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
    player/           # Frank sprite, PlayerContext, usePlayerActions
    scenes/
      splash/                          # Title / start screen
      beginnings/                      # Intro scene
      greatPortlandStreetExterior/     # Street scene (rain, driving car)
      greatPortlandStreetUnderground/  # Underground station
      testArea/                        # Dev sandbox
  shared/
    components/   # WalkArea, PickupItem, NavigationItem, GameModal
    hooks/        # useMusic
    utils/        # saveGame (localStorage)
  store/
    store.js      # Redux store
  assets/
    images/       # backgrounds, sprites, objects, portraits
    music/        # ambient tracks (.wav)
    sfx/          # sound effects (.wav)
    fonts/
```

## Game Canvas

The game uses a fixed-resolution canvas (1920x980px) to maintain consistent pixel-art rendering across devices. The UI layer is scaled using a CSS-driven transform system (--game-scale), ensuring visual consistency while preserving aspect ratio fidelity. User input is translated from screen space into game space via a coordinate mapping function (screenToGame) within the player interaction system.

## Save System

Game state is persisted via Redux subscriptions to localStorage, creating an automatic persistence layer for all gameplay progress. The system captures scene state, player position, inventory, and narrative flags, enabling full session restoration through a single entry point on game initialization.

## Scenes

| Route | Scene |
|---|---|
| `/` | Splash screen |
| `/great-portland-street` | Underground station |
| `/great-portland-street-exterior` | Street exterior |

## Item Interactions

The interaction system is event-driven, where game objects expose context-specific actions (inspect, collect, etc.). Interactions trigger controlled player movement followed by state transitions, decoupling UI input from game logic execution. This ensures consistent behaviour across different interaction types and scenes.

## Player Controls

Player movement is driven by pointer-based input, with screen coordinates converted into game-world positions. The system supports both desktop and mobile interaction patterns, including click-to-move navigation and touch-based teleportation for accessibility on smaller devices.

| Input | Action |
|---|---|
| Left click | Walk to position |
| Double tap (mobile) | Teleport to position |
| Click item | Open interaction menu |
