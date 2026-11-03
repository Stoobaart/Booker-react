import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  closeBoard,
  connectNodes,
  disconnectNodes,
  moveNode,
  placeNode,
  removeNode,
  selectBoardConnections,
  selectBoardNodes,
  nodeIdFor,
  connectionIdFor,
} from '../slices/deductionSlice';
import { selectNotebookTabs } from '../../investigation/slices/investigationSlice';
import { investigationNotes } from '../../investigation/data/investigationNotes';
import { inventoryItems } from '../../inventory/data/items';
import { boards, CURRENT_BOARD_ID } from '../data/boards';
import { deductionsById } from '../data/deductions';
import { clampToBoard, innerBox, isInside, toFraction, toLocal } from '../utils/boardMath';
import BoardSidebar from './BoardSidebar';
import BoardNode from './BoardNode';
import BoardStrings from './BoardStrings';
import './DeductionBoard.scss';

const DeductionBoard = () => {
  const isOpen = useSelector((state) => state.deduction.isBoardOpen);
  if (!isOpen) return null;
  return <OpenBoard />;
};

const OpenBoard = () => {
  const dispatch = useDispatch();
  const board = boards.find((b) => b.id === CURRENT_BOARD_ID);
  const nodes = useSelector((state) => selectBoardNodes(state, board.id));
  const connections = useSelector((state) => selectBoardConnections(state, board.id));
  const tabs = useSelector(selectNotebookTabs);
  const carried = useSelector((state) => state.inventory.items);
  // Sprites from the definitions, since a saved sprite URL can go stale between builds
  const inventory = carried.map((item) => inventoryItems[item.id] ?? item);
  const overlayRef = useRef(null);
  const boardRef = useRef(null);
  const ghostRef = useRef(null);
  const pressedOverlay = useRef(false);
  // { from: 'sidebar' | 'board', kind, refId, ghost?, pos?, offset?, size? }
  const [drag, setDrag] = useState(null);
  // A string picked up: { from } with from null until it's tied to a node
  const [held, setHeld] = useState(null);
  const [selectedString, setSelectedString] = useState(null);
  // Read each frame by the strings, in board px
  const pointerRef = useRef({ x: 0, y: 0 });

  const placed = new Set(nodes.map((node) => node.id));
  const notSeen = (kind) => (thing) => !placed.has(nodeIdFor(kind, thing.id));
  const allNotes = tabs.flatMap((tab) => tab.groups.flatMap((group) => group.notes));
  const sections = tabs
    .map((tab) => ({ id: tab.id, name: tab.name, notes: tab.groups.flatMap((g) => g.notes).filter(notSeen('note')) }))
    .filter((section) => section.notes.length);
  const items = inventory.filter(notSeen('item'));

  const contentFor = (kind, refId) => {
    if (kind === 'note') return investigationNotes[refId];
    if (kind === 'deduction') return deductionsById[refId];
    return inventoryItems[refId] ?? carried.find((item) => item.id === refId);
  };

  // Each post-it's string, tied to the middle of the string that made it
  // Memoised, since the strings restart their animation when it changes
  const branches = useMemo(() => nodes
    .filter((node) => node.kind === 'deduction' && deductionsById[node.refId])
    .map((node) => {
      const { from, to } = deductionsById[node.refId];
      return { id: `branch:${node.refId}`, nodeId: node.id, parentId: connectionIdFor(from, to) };
    }), [nodes]);

  const boardBox = () => {
    const el = boardRef.current;
    return { rect: innerBox(el.getBoundingClientRect(), el), size: { width: el.clientWidth, height: el.clientHeight } };
  };

  const trackPointer = (clientX, clientY) => {
    const el = boardRef.current;
    pointerRef.current = toLocal(clientX, clientY, innerBox(el.getBoundingClientRect(), el), el.clientWidth);
  };

  const labelFor = (nodeId) => {
    const node = nodes.find((n) => n.id === nodeId);
    const content = node && contentFor(node.kind, node.refId);
    return content?.title ?? content?.name ?? content?.text ?? nodeId;
  };

  const handleSpoolPress = (e) => {
    setSelectedString(null);
    if (held) {
      setHeld(null);
      return;
    }
    trackPointer(e.clientX, e.clientY);
    setHeld({ from: null });
  };

  // Ties the held string to a node; the second node connects them. The same node again lets go.
  const tieString = (e, node) => {
    e.preventDefault();
    e.stopPropagation();
    if (!held.from) {
      setHeld({ from: node.id });
      return;
    }
    if (node.id !== held.from) dispatch(connectNodes({ boardId: board.id, from: held.from, to: node.id }));
    setHeld(null);
  };

  useEffect(() => {
    if (!held && !selectedString) return undefined;
    const handleMove = (e) => trackPointer(e.clientX, e.clientY);
    const handleKey = (e) => {
      if (e.key !== 'Escape') return;
      setHeld(null);
      setSelectedString(null);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('keydown', handleKey);
    };
  }, [held, selectedString]);

  const ghostAt = (clientX, clientY) => {
    const el = overlayRef.current;
    return toLocal(clientX, clientY, el.getBoundingClientRect(), el.offsetWidth);
  };

  const nodePosition = (current, clientX, clientY) => {
    const { rect, size } = boardBox();
    const pointer = toFraction(clientX, clientY, rect);
    const pos = { x: pointer.x + current.offset.x, y: pointer.y + current.offset.y };
    return clampToBoard(pos, current.size, size);
  };

  const startSidebarDrag = (e, kind, refId) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setDrag({ from: 'sidebar', kind, refId, ghost: ghostAt(e.clientX, e.clientY) });
  };

  const startNodeDrag = (e, node) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const pointer = toFraction(e.clientX, e.clientY, boardBox().rect);
    setDrag({
      from: 'board',
      nodeId: node.id,
      offset: { x: node.x - pointer.x, y: node.y - pointer.y },
      size: { width: e.currentTarget.offsetWidth, height: e.currentTarget.offsetHeight },
      pos: { x: node.x, y: node.y },
    });
  };

  useEffect(() => {
    if (!drag) return undefined;

    const handleMove = (e) => {
      setDrag((current) => current && (current.from === 'sidebar'
        ? { ...current, ghost: ghostAt(e.clientX, e.clientY) }
        : { ...current, pos: nodePosition(current, e.clientX, e.clientY) }));
    };

    const handleUp = (e) => {
      if (drag.from === 'board') {
        const { x, y } = nodePosition(drag, e.clientX, e.clientY);
        dispatch(moveNode({ boardId: board.id, nodeId: drag.nodeId, x, y }));
      } else if (isInside(toFraction(e.clientX, e.clientY, boardBox().rect))) {
        const ghost = ghostRef.current;
        const size = { width: ghost?.offsetWidth ?? 0, height: ghost?.offsetHeight ?? 0 };
        const { x, y } = nodePosition({ offset: { x: 0, y: 0 }, size }, e.clientX, e.clientY);
        dispatch(placeNode({ boardId: board.id, kind: drag.kind, refId: drag.refId, x, y }));
      }
      setDrag(null);
    };

    const handleCancel = () => setDrag(null);

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleCancel);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleCancel);
    };
  });

  const handleClose = () => dispatch(closeBoard());

  // Pressing anywhere else lets go of a held string or deselects one; only a press that does neither can close the board
  const handleOverlayPointerDown = (e) => {
    const busy = held || selectedString;
    setHeld(null);
    setSelectedString(null);
    pressedOverlay.current = !busy && e.target === e.currentTarget;
  };

  // A drag let go outside the dialog also ends in a click on the overlay
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && pressedOverlay.current) handleClose();
    pressedOverlay.current = false;
  };

  const ghostContent = drag?.from === 'sidebar' ? contentFor(drag.kind, drag.refId) : null;

  return (
    <div
      ref={overlayRef}
      className={`deduction-overlay${drag ? ' deduction-overlay--dragging' : ''}${held ? ' deduction-overlay--holding' : ''}`}
      onPointerDown={handleOverlayPointerDown}
      onClick={handleOverlayClick}
    >
      <div className="deduction-board" role="dialog" aria-label="Deductions" onClick={(e) => e.stopPropagation()}>
        <button className="deduction-board__close" onClick={handleClose}>X</button>
        <BoardSidebar
          sections={sections}
          items={items}
          hasNotes={allNotes.length > 0}
          hasItems={inventory.length > 0}
          onStartDrag={startSidebarDrag}
        />
        <div ref={boardRef} className="deduction-board__cork" aria-label={`${board.name} board`}>
          <span className="deduction-board__label">{board.name}</span>
          {nodes.map((node) => {
            const content = contentFor(node.kind, node.refId);
            if (!content) return null;
            const dragging = drag?.nodeId === node.id;
            const { x, y } = dragging ? drag.pos : node;
            return (
              <BoardNode
                key={node.id}
                kind={node.kind}
                content={content}
                className={dragging ? 'board-node--dragging' : ''}
                style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
                onPointerDown={(e) => (held ? tieString(e, node) : startNodeDrag(e, node))}
                onRemove={held || node.kind === 'deduction'
                  ? undefined
                  : () => dispatch(removeNode({ boardId: board.id, nodeId: node.id }))}
              />
            );
          })}
          <BoardStrings
            connections={connections}
            branches={branches}
            held={held}
            pointerRef={pointerRef}
            selectedId={selectedString}
            onSelect={setSelectedString}
            onCut={(id) => {
              dispatch(disconnectNodes({ boardId: board.id, connectionId: id }));
              setSelectedString(null);
            }}
            onSpoolPress={handleSpoolPress}
            labelFor={labelFor}
          />
        </div>
      </div>
      {ghostContent && (
        <BoardNode
          nodeRef={ghostRef}
          kind={drag.kind}
          content={ghostContent}
          className="board-node--ghost"
          style={{ left: drag.ghost.x, top: drag.ghost.y }}
        />
      )}
    </div>
  );
};

export default DeductionBoard;
