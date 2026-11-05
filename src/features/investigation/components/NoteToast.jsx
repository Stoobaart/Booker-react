import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  dismissNewInvestigation,
  dismissNewNote,
  openNotebook,
  selectNewInvestigation,
  selectNewNote,
} from '../slices/investigationSlice';
import './NoteToast.scss';

export const NOTE_TOAST_MS = 4000;

// A new note first; a newly opened investigation's turn comes after
const toastFor = (note, investigation) => {
  if (note) return { key: `note:${note.id}`, label: 'Note added', title: note.title, dismiss: dismissNewNote };
  if (investigation) {
    return {
      key: `investigation:${investigation.id}`,
      label: 'New case notes',
      title: investigation.name,
      dismiss: dismissNewInvestigation,
      tabId: investigation.id,
    };
  }
  return null;
};

const NoteToast = () => {
  const dispatch = useDispatch();
  const note = useSelector(selectNewNote);
  const investigation = useSelector(selectNewInvestigation);
  const toast = toastFor(note, investigation);
  const key = toast?.key;
  const dismiss = toast?.dismiss;

  useEffect(() => {
    if (!dismiss) return undefined;
    const timer = setTimeout(() => dispatch(dismiss()), NOTE_TOAST_MS);
    return () => clearTimeout(timer);
  }, [dispatch, key, dismiss]);

  if (!toast) return null;

  const handleClick = (e) => {
    e.stopPropagation();
    dispatch(toast.dismiss());
    dispatch(openNotebook(toast.tabId));
  };

  return (
    <div role="status">
      <button key={toast.key} className="note-toast" onClick={handleClick}>
        <span className="note-toast__label">{toast.label}</span>
        <span className="note-toast__title">{toast.title}</span>
      </button>
    </div>
  );
};

export default NoteToast;
