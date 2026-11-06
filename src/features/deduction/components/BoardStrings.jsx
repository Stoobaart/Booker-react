import { useEffect, useRef } from 'react';
import { createRope, nudgeRope, ropeMiddle, ropePath, slackLength, stepRope } from '../utils/rope';
import './BoardStrings.scss';

// Hanging from the nail, in em: offset from it and length
const HANGING = [
  { dx: -0.25, length: 5 },
  { dx: 0, length: 6.25 },
  { dx: 0.25, length: 5.5 },
];
const NAIL = { x: 2.5, y: 2.25 };
const HELD_LENGTH = 4;

const PinHead = ({ pinRef }) => (
  <g ref={pinRef} className="board-strings__pin">
    <rect x="-0.4688em" y="-0.4688em" width="0.9375em" height="0.9375em" />
    <rect className="board-strings__pin-shine" x="-0.375em" y="-0.375em" width="0.1875em" height="0.1875em" />
  </g>
);

// The strings on the board, drawn every frame from a rope simulation so they sag and swing.
// held: null when not holding a string, else { from } with from null until it's tied to a node.
// branches: strings that can't be cut, each from a node's pin to the middle of a connection ({ id, nodeId, parentId }).
const BoardStrings = ({ connections, branches = [], held, pointerRef, selectedId, onSelect, onCut, onSpoolPress, labelFor }) => {
  const svgRef = useRef(null);
  const cutRef = useRef(null);
  const ropes = useRef(new Map());
  const elements = useRef(new Map());

  const register = (id, part) => (el) => {
    const parts = elements.current.get(id) ?? {};
    parts[part] = el;
    elements.current.set(id, parts);
  };

  const hangingCount = held ? HANGING.length - 1 : HANGING.length;
  const heldId = held && `held:${held.from}`;

  useEffect(() => {
    const svg = svgRef.current;
    const board = svg?.parentElement;
    if (!board || !window.requestAnimationFrame) return undefined;
    const em = parseFloat(getComputedStyle(board).fontSize) || 16;

    // The middle of a node's pin, in board px
    const pinOf = (nodeId) => {
      const el = board.querySelector(`.board-node[data-node-id="${nodeId}"]`);
      return el && { x: el.offsetLeft, y: el.offsetTop - el.offsetHeight / 2 + 0.0625 * em };
    };

    const specs = () => {
      const list = connections.map((c) => {
        const a = pinOf(c.from);
        const b = pinOf(c.to);
        return a && b && { id: c.id, from: c.from, a, b, length: slackLength(a, b) };
      });
      // After the connections, so their ropes have moved this frame
      branches.forEach((branch) => {
        const a = pinOf(branch.nodeId);
        if (a) list.push({ id: branch.id, a, parentId: branch.parentId });
      });
      HANGING.slice(0, hangingCount).forEach((h, i) => {
        const a = { x: (NAIL.x + h.dx) * em, y: NAIL.y * em };
        list.push({ id: `hang:${i}`, a, b: null, length: h.length * em });
      });
      if (held) {
        const pointer = pointerRef.current;
        const from = held.from && pinOf(held.from);
        if (from) list.push({ id: heldId, a: from, b: pointer, length: slackLength(from, pointer) });
        else if (!held.from) list.push({ id: heldId, a: pointer, b: null, length: HELD_LENGTH * em });
      }
      return list.filter(Boolean);
    };

    let frame;
    const tick = () => {
      const active = specs();

      active.forEach(({ id, from, a, b: end, length: fixedLength, parentId }) => {
        const parent = parentId && ropes.current.get(parentId);
        if (parentId && !parent) return;
        const b = parent ? ropeMiddle(parent) : end;
        const length = parent ? slackLength(a, b) : fixedLength;
        // A string just tied carries on from the one that was held
        const handed = from && ropes.current.get(`held:${from}`);
        if (!ropes.current.has(id)) ropes.current.set(id, handed ?? createRope(a, b ?? { x: a.x, y: a.y + length }));
        const points = stepRope(ropes.current.get(id), a, b, length);
        const parts = elements.current.get(id);
        if (!parts) return;
        const d = ropePath(points);
        ['line', 'shadow', 'hit'].forEach((part) => parts[part]?.setAttribute('d', d));
        parts.pinA?.setAttribute('transform', `translate(${Math.round(a.x)} ${Math.round(a.y)})`);
        if (b) parts.pinB?.setAttribute('transform', `translate(${Math.round(b.x)} ${Math.round(b.y)})`);
        if (id === selectedId && cutRef.current) {
          const middle = ropeMiddle(points);
          cutRef.current.style.left = `${middle.x}px`;
          cutRef.current.style.top = `${middle.y}px`;
        }
      });
      const ids = new Set(active.map((s) => s.id));
      [...ropes.current.keys()].forEach((id) => ids.has(id) || ropes.current.delete(id));
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [connections, branches, held, heldId, hangingCount, pointerRef, selectedId]);

  const handleSpool = (e) => {
    e.stopPropagation();
    ropes.current.forEach((points, id) => id.startsWith('hang:') && nudgeRope(points, 3));
    onSpoolPress(e);
  };

  const rope = (id, { hit = false, className = '' } = {}) => (
    <g key={id} className={`board-strings__rope ${className}`} data-connection-id={hit ? id : undefined}>
      <path ref={register(id, 'shadow')} className="board-strings__shadow" />
      <path ref={register(id, 'line')} className="board-strings__line" />
      {hit && (
        <path
          ref={register(id, 'hit')}
          className="board-strings__hit"
          onPointerDown={(e) => {
            e.stopPropagation();
            onSelect(id);
          }}
        />
      )}
    </g>
  );

  const selected = connections.find((c) => c.id === selectedId);

  return (
    <>
      <button
        className="board-strings__spool"
        aria-label="Red string"
        aria-pressed={Boolean(held)}
        onPointerDown={handleSpool}
      />
      <svg ref={svgRef} className={`board-strings${held ? ' board-strings--holding' : ''}`} aria-hidden="true">
        {HANGING.slice(0, hangingCount).map((_, i) => rope(`hang:${i}`, { className: 'board-strings__rope--hanging' }))}
        {connections.map((c) => (
          <g key={c.id}>
            {rope(c.id, { hit: true, className: c.id === selectedId ? 'board-strings__rope--selected' : '' })}
            <PinHead pinRef={register(c.id, 'pinA')} />
            <PinHead pinRef={register(c.id, 'pinB')} />
          </g>
        ))}
        {branches.map((branch) => (
          <g key={branch.id}>
            {rope(branch.id, { className: 'board-strings__rope--fixed' })}
            <PinHead pinRef={register(branch.id, 'pinA')} />
            <g ref={register(branch.id, 'pinB')} className="board-strings__knot">
              <rect x="-0.25em" y="-0.25em" width="0.5em" height="0.5em" />
            </g>
          </g>
        ))}
        {held && (
          <g key={heldId}>
            {rope(heldId)}
            {held.from && <PinHead pinRef={register(heldId, 'pinA')} />}
          </g>
        )}
        <svg className="board-strings__nail" x={`${NAIL.x}em`} y={`${NAIL.y}em`} overflow="visible">
          <PinHead />
        </svg>
      </svg>
      {selected && (
        <button
          ref={cutRef}
          className="board-strings__cut"
          aria-label={`Cut the string between ${labelFor(selected.from)} and ${labelFor(selected.to)}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onCut(selected.id)}
        >
          X
        </button>
      )}
    </>
  );
};

export default BoardStrings;
