import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { dismissNewNote, openNotebook, selectNewNote } from '../slices/investigationSlice';
import './NoteToast.scss';

// How long "Note added" stays up
export const NOTE_TOAST_MS = 4000;

// Announces a note the first time Frank finds it; clicking it opens the notebook
const NoteToast = () => {
  const dispatch = useDispatch();
  const note = useSelector(selectNewNote);

  useEffect(() => {
    if (!note) return undefined;
    const timer = setTimeout(() => dispatch(dismissNewNote()), NOTE_TOAST_MS);
    return () => clearTimeout(timer);
  }, [dispatch, note]);

  if (!note) return null;

  const handleClick = (e) => {
    e.stopPropagation();
    dispatch(dismissNewNote());
    dispatch(openNotebook());
  };

  return (
    <div role="status">
      <button className="note-toast" onClick={handleClick}>
        <span className="note-toast__label">Note added</span>
        <span className="note-toast__title">{note.title}</span>
      </button>
    </div>
  );
};

export default NoteToast;
