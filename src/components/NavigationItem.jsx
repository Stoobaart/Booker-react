import { useNavigate } from "react-router-dom";
import { usePlayer } from "../context/PlayerContext";

function NavigationItem({ id, name, description, position, size, to }) {
  const navigate = useNavigate();
  const { walkTo } = usePlayer();

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.bottom;

    walkTo(centerX, centerY, () => {
      navigate(to);
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
