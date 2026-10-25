import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeNotebook, selectNotebookTabs } from '../slices/investigationSlice';
import './Notebook.scss';

const Notebook = () => {
  const isOpen = useSelector((state) => state.investigation.isNotebookOpen);
  if (!isOpen) return null;
  return <OpenNotebook />;
};

// Remounted on each open, so it starts on the first tab with notes
const OpenNotebook = () => {
  const dispatch = useDispatch();
  const tabs = useSelector(selectNotebookTabs);
  const [tabId, setTabId] = useState(() => (tabs.find((t) => t.groups.length) ?? tabs[0]).id);
  const tab = tabs.find((t) => t.id === tabId) ?? tabs[0];

  const handleClose = () => dispatch(closeNotebook());

  return (
    <div className="notebook-overlay" onClick={handleClose}>
      <div className="notebook" role="dialog" aria-label="Notebook" onClick={(e) => e.stopPropagation()}>
        <div className="notebook__tabs" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={t.id === tab.id}
              className={`notebook__tab${t.id === tab.id ? ' notebook__tab--active' : ''}`}
              onClick={() => setTabId(t.id)}
            >
              {t.name}
            </button>
          ))}
        </div>
        <div className="notebook__sheet">
          <button className="notebook__close" onClick={handleClose}>X</button>
          <div className="notebook__page" role="tabpanel" aria-label={tab.name}>
            {tab.groups.length === 0 ? (
              <p className="notebook__empty">Nothing noted down yet</p>
            ) : (
              tab.groups.map((group) => (
                <section key={group.room?.id ?? 'none'} className="notebook__room">
                  {group.room && <h3>{group.room.name}</h3>}
                  <ul>
                    {group.notes.map((note) => (
                      <li key={note.id} className="notebook__note">
                        <span className="notebook__note-title">{note.title}</span>
                        <p>{note.text}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notebook;
