import { useNavigate, useLocation } from "react-router-dom";
import { usePlayer } from "../../features/player/context/PlayerContext";
import { screenToGame } from "../../features/player/utils/playerMath";

function NavigationItem({ id, name, position, size, to }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { walkTo } = usePlayer();

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const [centerX, centerY] = screenToGame(rect.left + rect.width / 2, rect.bottom);

    walkTo(centerX, centerY, () => {
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
      }}
      onClick={handleClick}
    ></div>
  );
}

export default NavigationItem;
