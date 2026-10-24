import { useState, useEffect } from 'react';
import { usePlayer } from '../../features/player/context/PlayerContext';
import inspectSprite from '../../assets/images/objects/inspect.png';
import './PickupItem.scss';
import './Hotspot.scss';

// Something painted into the background that Frank can look at: an invisible box over the art
// (position and size in game px) that offers inspect only. standAt ({ x, y }) is where his feet go
// to look at it, on the floor in front of it; without it, the bottom middle of the box. face is the
// way he turns once he's there, so he looks at it.
const Hotspot = ({ id, name, position, size, standAt, face, onInspect }) => {
  const [showMenu, setShowMenu] = useState(false);
  const { walkTo } = usePlayer();

  const handleClick = (e) => {
    e.stopPropagation();
    setShowMenu((prev) => !prev);
  };

  const handleInspect = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    const [x, y] = standAt
      ? [parseFloat(standAt.x), parseFloat(standAt.y)]
      : [parseFloat(position.x) + parseFloat(size.width) / 2, parseFloat(position.y) + parseFloat(size.height)];
    walkTo(x, y, () => onInspect?.(), { face });
  };

  useEffect(() => {
    if (!showMenu) return;
    const handleOutsideClick = () => setShowMenu(false);
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
        <div className="interaction-menu" onClick={(e) => e.stopPropagation()}>
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
