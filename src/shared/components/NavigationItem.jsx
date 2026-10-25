import { useNavigate, useLocation } from "react-router-dom";
import { usePlayer } from "../../features/player/context/PlayerContext";
import { screenToGame } from "../../features/player/utils/playerMath";

// onBlocked runs instead of changing scene. zIndex 2 puts it over the walk area.
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
