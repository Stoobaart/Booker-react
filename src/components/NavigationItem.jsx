import { useNavigate } from "react-router-dom";

function NavigationItem({ id, name, description, position, size, to }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(to);
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
      onClick={() => handleClick()}
    ></div>
  );
}

export default NavigationItem;
