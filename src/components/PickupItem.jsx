import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addItem } from '../store/inventorySlice';
import { usePlayer } from '../context/PlayerContext';
import inspectSprite from '../assets/images/objects/inspect.png';
import pickupSprite from '../assets/images/objects/pickup.png';
import './PickupItem.scss';

const PickupItem = ({ id, name, description, sprite, position, collectable, onInspect, onPickup }) => {
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
    walkTo(position.x, position.y, () => {
      if (onInspect) onInspect();
    });
  };

  const handleCollect = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    pickupItem(position.x, position.y, () => {
      dispatch(addItem({ id, name, description, sprite }));
      if (onPickup) onPickup();
    });
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
      <img src={sprite} alt={name} className="pickup-sprite" />
    </div>
  );
};

export default PickupItem;
