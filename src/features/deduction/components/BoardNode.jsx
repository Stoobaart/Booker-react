import './BoardNode.scss';

// A note on an index card or an item in a polaroid, pinned to the board
const BoardNode = ({ kind, content, className = '', style, onPointerDown, onRemove, nodeRef }) => {
  const title = kind === 'note' ? content.title : content.name;

  return (
    <div
      ref={nodeRef}
      className={`board-node board-node--${kind} ${className}`}
      style={style}
      onPointerDown={onPointerDown}
      title={kind === 'note' ? content.text : content.description}
      data-node-id={`${kind}:${content.id}`}
    >
      {kind === 'item' && <img className="board-node__sprite" src={content.sprite} alt="" draggable={false} />}
      <span className="board-node__title">{title}</span>
      {onRemove && (
        <button
          className="board-node__remove"
          aria-label={`Take ${title} off the board`}
          title="Take off the board"
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
