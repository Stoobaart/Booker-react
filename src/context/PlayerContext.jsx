import { createContext, useContext } from "react";
import usePlayerActions from "../hooks/usePlayerActions";

const PlayerContext = createContext(null);

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
};

export const PlayerProvider = ({ children }) => {
  const { walk, teleport, pickupItem, hasArrived } = usePlayerActions();

  return (
    <PlayerContext.Provider
      value={{
        walk,
        teleport,
        pickupItem,
        hasArrived,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export default PlayerContext;
