import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store/store'
import { saveGame } from './utils/saveGame'
import './index.scss'
import App from './App.jsx'

store.subscribe(() => {
  const state = store.getState();
  if (!state.game.currentScene) return;

  const container = document.getElementById('player-container');
  const playerPosition = container
    ? { x: container.style.left, y: container.style.top }
    : state.game.playerPosition;

  saveGame({
    game: { ...state.game, playerPosition },
    inventory: state.inventory,
  });
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
