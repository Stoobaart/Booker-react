import "./GameModal.scss";

const GameModal = ({ onClose, children }) => {
  return (
    <div className="game-modal-overlay" onClick={onClose}>
      <div className="game-modal" onClick={(e) => e.stopPropagation()}>
        <button className="game-modal__close" onClick={onClose}>✕</button>
        {children}
      </div>
    </div>
  );
};

export default GameModal;
