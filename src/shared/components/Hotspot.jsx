import { useState, useEffect } from 'react';
import { usePlayer } from '../../features/player/context/PlayerContext';
import { screenToGame } from '../../features/player/utils/playerMath';
import inspectSprite from '../../assets/images/objects/inspect.png';
import './PickupItem.scss';
import './Hotspot.scss';

// Without standAt, Frank stands at the bottom middle of the box. Its menu opens above the click.
const Hotspot = ({ id, name, position, size, standAt, face, onInspect }) => {
  const [menuAt, setMenuAt] = useState(null);
  const showMenu = menuAt !== null;
  const { walkTo } = usePlayer();

  const handleClick = (e) => {
    e.stopPropagation();
    if (showMenu) return setMenuAt(null);
    const [x, y] = screenToGame(e.clientX, e.clientY);
    setMenuAt({ x: x - parseFloat(position.x), y: y - parseFloat(position.y) });
  };

  const handleInspect = (e) => {
    e.stopPropagation();
    setMenuAt(null);
    const [x, y] = standAt
      ? [parseFloat(standAt.x), parseFloat(standAt.y)]
      : [parseFloat(position.x) + parseFloat(size.width) / 2, parseFloat(position.y) + parseFloat(size.height)];
    walkTo(x, y, () => onInspect?.(), { face });
  };

  useEffect(() => {
    if (!showMenu) return;
    const handleOutsideClick = () => setMenuAt(null);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [showMenu]);

  return (
    <div
      className="hotspot"
      data-hotspot={id}
      style={{ left: position.x, top: position.y, width: size.width, height: size.height }}
    >
      {showMenu && (
        <div
          className="interaction-menu hotspot__menu"
          style={{ left: menuAt.x, top: menuAt.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="interaction-btn" aria-label={`Inspect ${name}`} onClick={handleInspect}>
            <div className="inspect-icon" style={{ backgroundImage: `url(${inspectSprite})` }} />
          </button>
        </div>
      )}
      <div className="hotspot__area" role="button" aria-label={name} title={name} onClick={handleClick} />
    </div>
  );
};

export default Hotspot;
