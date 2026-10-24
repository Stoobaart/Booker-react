import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { closeInventory } from '../slices/inventorySlice';
import boxImage from '../../../assets/images/ui/evidence-box.png';
import lidImage from '../../../assets/images/ui/evidence-box-lid.png';
import lidOpenImage from '../../../assets/images/ui/evidence-box-lid-open.png';
import arrowImage from '../../../assets/images/ui/evidence-box-arrow.png';
import './Inventory.scss';

// How long the evidence box takes to open (slide in from the right, then the lid pops off and
// the items rise out of it), and to close again (the same, backwards)
export const INVENTORY_ANIMATION_MS = 1500;

// The box shows a row of items at a time; its arrows sink the row back into the box (taking
// ROW_SWAP_MS) and then raise the next one (the same again)
export const ITEMS_PER_ROW = 4;
export const ROW_SWAP_MS = 250;

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// The inventory: Frank's evidence box. It stays up while it closes, and if it's asked to open
// again meanwhile, it opens once it has gone.
const Inventory = () => {
  const isOpen = useSelector((state) => state.inventory.isOpen);
  const [wasOpen, setWasOpen] = useState(isOpen);
  const [closing, setClosing] = useState(false);

  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (!isOpen) setClosing(true);
  }

  useEffect(() => {
    if (!closing) return undefined;
    const timer = setTimeout(() => setClosing(false), prefersReducedMotion() ? 0 : INVENTORY_ANIMATION_MS);
    return () => clearTimeout(timer);
  }, [closing]);

  if (closing) return <EvidenceBox closing />;
  if (isOpen) return <EvidenceBox />;
  return null;
};

const EvidenceBox = ({ closing = false }) => {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.inventory.items);
  const [row, setRow] = useState(0);
  // A row being swapped for another: { to, phase: 'sinking' | 'rising' }
  const [swap, setSwap] = useState(null);
  const rowCount = Math.max(1, Math.ceil(items.length / ITEMS_PER_ROW));
  const shownRow = Math.min(row, rowCount - 1);
  const rowItems = items.slice(shownRow * ITEMS_PER_ROW, (shownRow + 1) * ITEMS_PER_ROW);
  const [selectedId, setSelectedId] = useState(() => items[0]?.id);
  const selected = items.find((item) => item.id === selectedId) ?? rowItems[0];

  // Once the row has sunk, the next one (with its first item picked out) rises in its place
  useEffect(() => {
    if (!swap) return undefined;
    const timer = setTimeout(() => {
      if (swap.phase === 'sinking') {
        setRow(swap.to);
        setSelectedId(items[swap.to * ITEMS_PER_ROW]?.id);
        setSwap({ ...swap, phase: 'rising' });
      } else {
        setSwap(null);
      }
    }, prefersReducedMotion() ? 0 : ROW_SWAP_MS);
    return () => clearTimeout(timer);
  }, [swap, items]);

  const turnTo = (to) => {
    if (!swap) setSwap({ to, phase: 'sinking' });
  };

  const handleClose = () => {
    if (!closing) dispatch(closeInventory());
  };

  return (
    <div
      className={`inventory-overlay${closing ? ' inventory-overlay--closing' : ''}`}
      style={{ '--inventory-ms': `${INVENTORY_ANIMATION_MS}ms`, '--row-swap-ms': `${ROW_SWAP_MS}ms` }}
      onClick={handleClose}
    >
      <div className="evidence-box" role="dialog" aria-label="Inventory" onClick={(e) => e.stopPropagation()}>
        <div className="evidence-box__stage">
          <img className="evidence-box__lid-open" src={lidOpenImage} alt="" />
          <img className="evidence-box__box" src={boxImage} alt="" />
          {/* Clipped at the box's front edge, so the items rise out of it */}
          <div className="evidence-box__contents">
            <div className="evidence-box__rise">
              <div className={`evidence-box__items${swap ? ` evidence-box__items--${swap.phase}` : ''}`}>
                {rowItems.map((item) => (
                  <button
                    key={item.id}
                    className={`inventory-item${item.id === selected?.id ? ' inventory-item--selected' : ''}`}
                    aria-label={item.name}
                    aria-pressed={item.id === selected?.id}
                    onClick={() => setSelectedId(item.id)}
                  >
                    {item.sprite ? (
                      <img className="inventory-item__sprite" src={item.sprite} alt="" />
                    ) : (
                      <span className="inventory-item__name">{item.name}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Both stay put while the box is open, hidden at the ends, so they don't replay its fade-in */}
          {rowCount > 1 && (
            <>
              <button
                className="evidence-box__arrow evidence-box__arrow--back"
                aria-label="Previous items"
                hidden={shownRow === 0}
                onClick={() => turnTo(shownRow - 1)}
              >
                <img src={arrowImage} alt="" />
              </button>
              <button
                className="evidence-box__arrow evidence-box__arrow--next"
                aria-label="Next items"
                hidden={shownRow === rowCount - 1}
                onClick={() => turnTo(shownRow + 1)}
              >
                <img src={arrowImage} alt="" />
              </button>
            </>
          )}
          <img className="evidence-box__lid" src={lidImage} alt="" />
        </div>
        <div className="evidence-box__side">
          <button className="evidence-box__close" onClick={handleClose}>X</button>
          <div className="evidence-box__tag">
            {selected ? (
              <>
                <p className="evidence-box__tag-name">
                  {selected.name} <span className="evidence-box__tag-quantity">x{selected.quantity}</span>
                </p>
                {selected.description && <p>{selected.description}</p>}
              </>
            ) : (
              <p className="evidence-box__tag-empty">Your inventory is empty</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
