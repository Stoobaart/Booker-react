import { useLocation } from "react-router-dom";
import useMusic from "../hooks/useMusic";
import { musicForPath } from "../data/routeMusic";

const RouteMusic = () => {
  const track = musicForPath(useLocation().pathname);
  useMusic(track?.src ?? null, { volume: track?.volume ?? 1 });
  return null;
};

export default RouteMusic;
