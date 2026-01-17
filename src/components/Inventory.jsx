import { useSelector, useDispatch } from 'react-redux';
import { closeInventory } from '../store/inventorySlice';
import './Inventory.scss';

const Inventory = () => {
  const { items, isOpen } = useSelector((state) => state.inventory);
  const dispatch = useDispatch();

  if (!isOpen) return null;

  const handleClose = () => {
    dispatch(closeInventory());
  };

  return (
    <div className="inventory-overlay" onClick={handleClose}>
      <div className="inventory-container" onClick={(e) => e.stopPropagation()}>
        <div className="inventory-header">
          <h2>Inventory</h2>
          <button className="close-btn" onClick={handleClose}>X</button>
        </div>
        <div className="inventory-items">
          {items.length === 0 ? (
            <p className="empty-message">Your inventory is empty</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="inventory-item">
                {item.sprite && (
                  <img src={item.sprite} alt={item.name} className="item-sprite" />
                )}
                <div className="item-details">
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-quantity">x{item.quantity}</span>
                  </div>
                  {item.description && (
                    <p className="item-description">{item.description}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;
