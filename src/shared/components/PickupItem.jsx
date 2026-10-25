import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addItem } from '../../features/inventory/slices/inventorySlice';
import { usePlayer } from '../../features/player/context/PlayerContext';
import { itemStandSpot } from '../../features/player/utils/playerMath';
import inspectSprite from '../../assets/images/objects/inspect.png';
import pickupSprite from '../../assets/images/objects/pickup.png';
import './PickupItem.scss';

// standAt: where Frank stands for an item that isn't on the floor
const PickupItem = ({ id, name, description, sprite, spriteWidth, position, standAt, face, collectable, onInspect, onPickup }) => {
  const [showMenu, setShowMenu] = useState(false);
  const dispatch = useDispatch();
  const { walkTo, pickupItem } = usePlayer();

  const handleItemClick = (e) => {
    e.stopPropagation();
    setShowMenu((prev) => !prev);
  };

  const handleInspect = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    const [x, y] = standAt ? [parseFloat(standAt.x), parseFloat(standAt.y)] : itemStandSpot(position.x, position.y);
    walkTo(x, y, () => {
      if (onInspect) onInspect();
    }, { face });
  };

  const handleCollect = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    pickupItem(position.x, position.y, () => {
      dispatch(addItem({ id, name, description, sprite }));
      if (onPickup) onPickup();
    }, standAt);
  };

  useEffect(() => {
    if (!showMenu) return;
    const handleOutsideClick = () => setShowMenu(false);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [showMenu]);

  return (
    <div
      className="pickup-item"
      style={{ top: position.y, left: position.x }}
      onClick={handleItemClick}
    >
      {showMenu && (
        <div className="interaction-menu" onClick={(e) => e.stopPropagation()}>
          <button className="interaction-btn" onClick={handleInspect}>
            <div className="inspect-icon" style={{ backgroundImage: `url(${inspectSprite})` }} />
          </button>
          {collectable && (
            <button className="interaction-btn" onClick={handleCollect}>
              <div className="collect-icon" style={{ backgroundImage: `url(${pickupSprite})` }} />
            </button>
          )}
        </div>
      )}
      <img src={sprite} alt={name} className="pickup-sprite" style={spriteWidth ? { width: spriteWidth } : undefined} />
    </div>
  );
};

export default PickupItem;
