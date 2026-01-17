import { useDispatch } from 'react-redux';
import { addItem } from '../store/inventorySlice';
import usePlayerActions from '../utils/usePlayerActions';
import './PickupItem.scss';

const PickupItem = ({ id, name, description, sprite, position, onPickup }) => {
  const dispatch = useDispatch();
  const { pickupItem } = usePlayerActions();

  const handleClick = () => {
    // Walk to item, play pickup animation, then add to inventory
    pickupItem(position.x, position.y, () => {
      // This callback runs after the pickup animation completes
      dispatch(addItem({ id, name, description, sprite }));
      if (onPickup) {
        onPickup(id);
      }
    });
  };

  return (
    <div
      className="pickup-item"
      style={{ top: position.y, left: position.x }}
      onClick={handleClick}
      title={`Click to pick up ${name}`}
    >
      <img src={sprite} alt={name} className="pickup-sprite" />
    </div>
  );
};

export default PickupItem;
