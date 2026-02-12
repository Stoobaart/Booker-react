import { useReducer, useRef, useCallback } from 'react';

const initialState = {
  sceneSequenceTracker: 0,
  showTalkOverlay: false,
  speech: '',
  portrait: null,
  mood: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'START_SPEECH':
      return {
        ...state,
        showTalkOverlay: true,
        speech: '',
        portrait: action.portrait,
        mood: action.mood,
      };
    case 'ADD_LETTER':
      return { ...state, speech: state.speech + action.letter };
    case 'COMPLETE_SPEECH':
      return { ...state, speech: action.fullLine };
    case 'NEXT_LINE':
      return { ...state, speech: '', portrait: null, mood: null };
    case 'CLOSE':
      return {
        ...state,
        showTalkOverlay: false,
        speech: '',
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

    const portraitSprite = document.getElementById('portrait-sprite');

    if (portraitSprite) {
      portraitSprite.style.animation = 'talk 2000ms steps(15) infinite';
    }

    const typeWriter = () => {
      if (letterCount.current < lines.current[lineNumber.current].line.length) {
        letterCount.current++;
        const letters = [...lines.current[lineNumber.current].line];
        dispatch({ type: 'ADD_LETTER', letter: letters[letterCount.current - 1] });
      }
    };

    const timePerLetter = 100;
    typeWriterInterval.current = window.setInterval(typeWriter, timePerLetter);
    const timeToType = charactersInLine * timePerLetter + 200;

    setTimeout(() => {
      const portraitSprite = document.getElementById('portrait-sprite');
      if (portraitSprite) {
        portraitSprite.style.animation = 'none';
      }
      if (typeWriterInterval.current) {
        window.clearInterval(typeWriterInterval.current);
        typeWriterInterval.current = null;
      }
      letterCount.current = 0;
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
      dispatch({ type: 'COMPLETE_SPEECH', fullLine: lines.current[lineNumber.current].line });
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
    portrait: state.portrait,
    mood: state.mood,
    setLinesAndSpeak,
    runNextStep,
  };
};

export default useTalkActions;
