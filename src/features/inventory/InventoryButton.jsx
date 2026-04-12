import { useDispatch } from 'react-redux';
import { toggleInventory } from './inventorySlice';
import './InventoryButton.scss';

const InventoryButton = () => {
  const dispatch = useDispatch();

  const handleToggle = () => {
    dispatch(toggleInventory());
  };

  return (
    <button className="inventory-button" onClick={handleToggle}>
      Inventory
    </button>
  );
};

export default InventoryButton;
