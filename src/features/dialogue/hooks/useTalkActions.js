import { useReducer, useRef, useCallback } from 'react';

const initialState = {
  sceneSequenceTracker: 0,
  showTalkOverlay: false,
  speech: '',
  // The portrait talks only while a line types out
  isTyping: false,
  portrait: null,
  mood: null,
};

export const MS_PER_LETTER = 70;

const reducer = (state, action) => {
  switch (action.type) {
    case 'START_SPEECH':
      return {
        ...state,
        showTalkOverlay: true,
        speech: '',
        isTyping: true,
        portrait: action.portrait,
        mood: action.mood,
      };
    case 'ADD_LETTER':
      return { ...state, speech: state.speech + action.letter };
    case 'COMPLETE_SPEECH':
      return { ...state, speech: action.fullLine, isTyping: false };
    case 'DONE_TYPING':
      return { ...state, isTyping: false };
    case 'NEXT_LINE':
      return { ...state, speech: '', isTyping: false, portrait: null, mood: null };
    case 'CLOSE':
      return {
        ...state,
        showTalkOverlay: false,
        speech: '',
        isTyping: false,
        portrait: null,
        mood: null,
        sceneSequenceTracker: state.sceneSequenceTracker + 1,
      };
    default:
      return state;
  }
};

const useTalkActions = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const typeWriterInterval = useRef(null);
  const typeWriterTimeout = useRef(null);
  const lines = useRef([]);
  const letterCount = useRef(0);
  const numberOfLines = useRef(0);
  const lineNumber = useRef(0);

  const speak = useCallback(() => {
    const currentLine = lines.current[lineNumber.current];
    dispatch({
      type: 'START_SPEECH',
      portrait: currentLine.character,
      mood: currentLine.mood,
    });
    numberOfLines.current = lines.current.length - 1;
    const charactersInLine = currentLine.line.length;

    const typeWriter = () => {
      if (letterCount.current < lines.current[lineNumber.current].line.length) {
        letterCount.current++;
        const letters = [...lines.current[lineNumber.current].line];
        dispatch({ type: 'ADD_LETTER', letter: letters[letterCount.current - 1] });
      }
    };

    typeWriterInterval.current = window.setInterval(typeWriter, MS_PER_LETTER);
    const timeToType = charactersInLine * MS_PER_LETTER + 200;

    typeWriterTimeout.current = setTimeout(() => {
      dispatch({ type: 'DONE_TYPING' });
      if (typeWriterInterval.current) {
        window.clearInterval(typeWriterInterval.current);
        typeWriterInterval.current = null;
      }
      letterCount.current = 0;
      typeWriterTimeout.current = null;
    }, timeToType);
  }, []);

  const setLinesAndSpeak = useCallback((newLines) => {
    lines.current = newLines;
    speak();
  }, [speak]);

  const runNextStep = useCallback(() => {
    if (typeWriterInterval.current) {
      window.clearInterval(typeWriterInterval.current);
      typeWriterInterval.current = null;
      if (typeWriterTimeout.current) {
        clearTimeout(typeWriterTimeout.current);
        typeWriterTimeout.current = null;
      }
      dispatch({ type: 'COMPLETE_SPEECH', fullLine: lines.current[lineNumber.current].line });
      letterCount.current = 0;
    } else if (lineNumber.current < numberOfLines.current) {
      lineNumber.current++;
      dispatch({ type: 'NEXT_LINE' });
      speak();
    } else {
      if (typeWriterInterval.current) {
        window.clearInterval(typeWriterInterval.current);
      }
      lines.current = [];
      letterCount.current = 0;
      numberOfLines.current = 0;
      lineNumber.current = 0;
      typeWriterInterval.current = null;
      dispatch({ type: 'CLOSE' });
    }
  }, [speak]);

  return {
    sceneSequenceTracker: state.sceneSequenceTracker,
    showTalkOverlay: state.showTalkOverlay,
    speech: state.speech,
    isTyping: state.isTyping,
    portrait: state.portrait,
    mood: state.mood,
    setLinesAndSpeak,
    runNextStep,
  };
};

export default useTalkActions;
