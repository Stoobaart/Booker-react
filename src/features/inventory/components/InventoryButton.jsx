import { useDispatch } from 'react-redux';
import { toggleInventory } from '../slices/inventorySlice';
import evidenceBoxIcon from '../../../assets/images/ui/evidence-box-icon.png';
import '../../../shared/components/HudButton.scss';
import './InventoryButton.scss';

// Frank's evidence box, top right
const InventoryButton = () => {
  const dispatch = useDispatch();

  const handleToggle = () => {
    dispatch(toggleInventory());
  };

  return (
    <button className="inventory-button hud-button" aria-label="Inventory" title="Inventory" onClick={handleToggle}>
      <img className="hud-button__icon" src={evidenceBoxIcon} alt="" />
    </button>
  );
};

export default InventoryButton;
