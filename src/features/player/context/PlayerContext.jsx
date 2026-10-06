import { createContext, useContext } from "react";
import usePlayerActions from "../hooks/usePlayerActions";

const PlayerContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components -- hook is tied to this provider
export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
};

export const PlayerProvider = ({ children }) => {
  const { walk, walkTo, teleport, pickupItem, hasArrived } = usePlayerActions();

  return (
    <PlayerContext.Provider
      value={{
        walk,
        walkTo,
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
