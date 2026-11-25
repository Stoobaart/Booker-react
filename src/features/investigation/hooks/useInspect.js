import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { discoverNote } from '../slices/investigationSlice';

// Takes anything with { lines, noteId } or several notes, { lines, noteIds }
const useInspect = (setLinesAndSpeak) => {
  const dispatch = useDispatch();

  return useCallback(({ lines, noteId, noteIds = [] } = {}) => {
    if (lines?.length) setLinesAndSpeak(lines);
    [noteId, ...noteIds].filter(Boolean).forEach((id) => dispatch(discoverNote(id)));
  }, [dispatch, setLinesAndSpeak]);
};

export default useInspect;
