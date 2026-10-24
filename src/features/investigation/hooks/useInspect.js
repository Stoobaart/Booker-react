import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { discoverNote } from '../slices/investigationSlice';

// What a scene does once Frank has walked up to something and looked at it: he says its lines
// (with the scene's setLinesAndSpeak from useTalkActions), and its note goes in his notebook.
// Takes anything with { lines, noteId }: a hotspot, an object, or an NPC's
// { lines: inspectLines, noteId: inspectNoteId }. Noting it again does nothing.
const useInspect = (setLinesAndSpeak) => {
  const dispatch = useDispatch();

  return useCallback(({ lines, noteId } = {}) => {
    if (lines?.length) setLinesAndSpeak(lines);
    if (noteId) dispatch(discoverNote(noteId));
  }, [dispatch, setLinesAndSpeak]);
};

export default useInspect;
