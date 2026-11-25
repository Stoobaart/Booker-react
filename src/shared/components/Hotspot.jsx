import { useState, useEffect } from 'react';
import { usePlayer } from '../../features/player/context/PlayerContext';
import { screenToGame } from '../../features/player/utils/playerMath';
import inspectSprite from '../../assets/images/objects/inspect.png';
import pickupSprite from '../../assets/images/objects/pickup.png';
import './PickupItem.scss';
import './Hotspot.scss';

// Without standAt, Frank stands at the bottom middle of the box. Its menu opens above the click.
// With onPickup it can be picked up too.
const Hotspot = ({ id, name, position, size, standAt, face, onInspect, onPickup }) => {
  const [menuAt, setMenuAt] = useState(null);
  const showMenu = menuAt !== null;
  const { walkTo, pickupItem } = usePlayer();

  const handleClick = (e) => {
    e.stopPropagation();
    if (showMenu) return setMenuAt(null);
    const [x, y] = screenToGame(e.clientX, e.clientY);
    setMenuAt({ x: x - parseFloat(position.x), y: y - parseFloat(position.y) });
  };

  const standSpot = () =>
    standAt
      ? [parseFloat(standAt.x), parseFloat(standAt.y)]
      : [parseFloat(position.x) + parseFloat(size.width) / 2, parseFloat(position.y) + parseFloat(size.height)];

  const handleInspect = (e) => {
    e.stopPropagation();
    setMenuAt(null);
    const [x, y] = standSpot();
    walkTo(x, y, () => onInspect?.(), { face });
  };

  const handlePickup = (e) => {
    e.stopPropagation();
    setMenuAt(null);
    const [x, y] = standSpot();
    pickupItem(position.x, position.y, () => onPickup(), { x: `${x}px`, y: `${y}px` });
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
          {onPickup && (
            <button className="interaction-btn" aria-label={`Pick up ${name}`} onClick={handlePickup}>
              <div className="collect-icon" style={{ backgroundImage: `url(${pickupSprite})` }} />
            </button>
          )}
        </div>
      )}
      <div className="hotspot__area" role="button" aria-label={name} onClick={handleClick} />
    </div>
  );
};

export default Hotspot;
