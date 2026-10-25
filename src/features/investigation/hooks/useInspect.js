import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { discoverNote } from '../slices/investigationSlice';

// Takes anything with { lines, noteId }
const useInspect = (setLinesAndSpeak) => {
  const dispatch = useDispatch();

  return useCallback(({ lines, noteId } = {}) => {
    if (lines?.length) setLinesAndSpeak(lines);
    if (noteId) dispatch(discoverNote(noteId));
  }, [dispatch, setLinesAndSpeak]);
};

export default useInspect;
