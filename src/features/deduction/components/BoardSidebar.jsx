import { useState } from 'react';
import './BoardSidebar.scss';

const TABS = [
  { id: 'notes', name: 'Notes' },
  { id: 'evidence', name: 'Evidence' },
];

// What's found but not yet on the board; dragging an entry out pins it
const BoardSidebar = ({ sections, items, hasNotes, hasItems, onStartDrag }) => {
  const [tabId, setTabId] = useState('notes');

  const entry = (kind, content, label, extra) => (
    <li
      key={content.id}
      className={`board-sidebar__entry board-sidebar__entry--${kind}`}
      aria-label={label}
      onPointerDown={(e) => onStartDrag(e, kind, content.id)}
    >
      {extra}
      <span className="board-sidebar__entry-title">{label}</span>
    </li>
  );

  const notesPanel = () => {
    if (!hasNotes) return <p className="board-sidebar__empty">Nothing noted down yet</p>;
    if (sections.length === 0) return <p className="board-sidebar__empty">Every note is on the board</p>;
    return sections.map((section) => (
      <section key={section.id} className="board-sidebar__section">
        <h3>{section.name}</h3>
        <ul>{section.notes.map((note) => entry('note', note, note.title))}</ul>
      </section>
    ));
  };

  const evidencePanel = () => {
    if (!hasItems) return <p className="board-sidebar__empty">The evidence box is empty</p>;
    if (items.length === 0) return <p className="board-sidebar__empty">Everything is on the board</p>;
    return (
      <ul>
        {items.map((item) =>
          entry('item', item, item.name, <img className="board-sidebar__sprite" src={item.sprite} alt="" draggable={false} />))}
      </ul>
    );
  };

  return (
    <aside className="board-sidebar">
      <div className="board-sidebar__tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.id === tabId}
            className={`board-sidebar__tab${t.id === tabId ? ' board-sidebar__tab--active' : ''}`}
            onClick={() => setTabId(t.id)}
          >
            {t.name}
          </button>
        ))}
      </div>
      <div className="board-sidebar__panel" role="tabpanel" aria-label={TABS.find((t) => t.id === tabId).name}>
        {tabId === 'notes' ? notesPanel() : evidencePanel()}
      </div>
    </aside>
  );
};

export default BoardSidebar;
