import './BoardNode.scss';

const TITLES = { note: 'title', item: 'name', deduction: 'text' };

// A note on an index card, an item in a polaroid or a deduction on a post-it, pinned to the board
const BoardNode = ({ kind, content, className = '', style, onPointerDown, onRemove, nodeRef }) => {
  const title = content[TITLES[kind]];

  return (
    <div
      ref={nodeRef}
      className={`board-node board-node--${kind} ${className}`}
      style={style}
      onPointerDown={onPointerDown}
      data-node-id={`${kind}:${content.id}`}
    >
      {kind === 'item' && <img className="board-node__sprite" src={content.sprite} alt="" draggable={false} />}
      <span className="board-node__title">{title}</span>
      {onRemove && (
        <button
          className="board-node__remove"
          aria-label={`Take ${title} off the board`}
          // So pressing it doesn't start dragging the card
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onRemove}
        >
          X
        </button>
      )}
    </div>
  );
};

export default BoardNode;
