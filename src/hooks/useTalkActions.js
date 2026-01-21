import { useState, useRef, useCallback } from 'react';

const useTalkActions = () => {
  const [sceneSequenceTracker, setSceneSequenceTracker] = useState(0);
  const [showTalkOverlay, setShowTalkOverlay] = useState(false);
  const [speech, setSpeech] = useState('');
  const [portrait, setPortrait] = useState(null);
  const [mood, setMood] = useState(null);

  const typeWriterInterval = useRef(null);
  const lines = useRef([]);
  const letterCount = useRef(0);
  const numberOfLines = useRef(0);
  const lineNumber = useRef(0);

  const addALetter = useCallback((letters, currentLetterCount) => {
    setSpeech((prev) => prev + letters[currentLetterCount - 1]);
  }, []);

  const speak = useCallback(() => {
    setShowTalkOverlay(true);
    setPortrait(lines.current[lineNumber.current].character);
    setMood(lines.current[lineNumber.current].mood);
    numberOfLines.current = lines.current.length - 1;
    const charactersInLine = lines.current[lineNumber.current].line.length;

    const portraitSprite = document.getElementById('portrait-sprite');

    if (portraitSprite) {
      portraitSprite.style.animation = 'talk 2000ms steps(15) infinite';
    }

    const typeWriter = () => {
      if (letterCount.current < lines.current[lineNumber.current].line.length) {
        letterCount.current++;
        addALetter([...lines.current[lineNumber.current].line], letterCount.current);
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
  }, [addALetter]);

  const setLinesAndSpeak = useCallback((newLines) => {
    lines.current = newLines;
    speak();
  }, [speak]);

  const runNextStep = useCallback(() => {
    if (typeWriterInterval.current) {
      window.clearInterval(typeWriterInterval.current);
      typeWriterInterval.current = null;
      setSpeech(lines.current[lineNumber.current].line);
    } else if (lineNumber.current < numberOfLines.current) {
      lineNumber.current++;
      setPortrait(null);
      setMood(null);
      setSpeech('');
      speak();
    } else {
      if (typeWriterInterval.current) {
        window.clearInterval(typeWriterInterval.current);
      }
      setPortrait(null);
      setMood(null);
      setSpeech('');
      lines.current = [];
      letterCount.current = 0;
      numberOfLines.current = 0;
      lineNumber.current = 0;
      typeWriterInterval.current = null;
      setShowTalkOverlay(false);

      setSceneSequenceTracker((prev) => prev + 1);
    }
  }, [speak]);

  return {
    sceneSequenceTracker,
    showTalkOverlay,
    speech,
    portrait,
    mood,
    setLinesAndSpeak,
    runNextStep,
  };
};

export default useTalkActions;