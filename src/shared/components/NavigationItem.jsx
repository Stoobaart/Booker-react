import { useNavigate, useLocation } from "react-router-dom";
import { usePlayer } from "../../features/player/context/PlayerContext";
import { screenToGame } from "../../features/player/utils/playerMath";

// Frank walks to the exit, then the scene changes. walkTo ({ x, y }, game px) is where his feet go:
// best where he appears when he comes back in that way, so leaving heads for the door; without it,
// the bottom middle of the exit. With onBlocked, that runs instead of changing scene. With zIndex 2
// it sits over the walk area, so an exit can take in a stretch of floor too.
function NavigationItem({ id, name, position, size, to, onBlocked, zIndex, walkTo: standAt }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { walkTo } = usePlayer();

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const [x, y] = standAt
      ? [parseFloat(standAt.x), parseFloat(standAt.y)]
      : screenToGame(rect.left + rect.width / 2, rect.bottom);

    walkTo(x, y, () => {
      if (onBlocked) {
        onBlocked();
        return;
      }
      navigate(to, { state: { from: location.pathname } });
    });
  };

  return (
    <div
      className="navigation-item"
      key={id}
      id={id}
      name={name}
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        cursor: "pointer",
        zIndex,
      }}
      onClick={handleClick}
    ></div>
  );
}

export default NavigationItem;
