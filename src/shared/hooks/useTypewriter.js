import { useState, useEffect, useRef, useCallback } from 'react';

const useTypewriter = (text, { speed = 100, skipAnimation = false } = {}) => {
  const [displayedText, setDisplayedText] = useState(skipAnimation ? text : '');
  const intervalRef = useRef(null);
  const letterCountRef = useRef(skipAnimation ? text.length : 0);

  const clearInterval_ = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const complete = useCallback(() => {
    clearInterval_();
    letterCountRef.current = 0;
    setDisplayedText(text);
  }, [text]);

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      return;
    }

    if (skipAnimation) {
      setDisplayedText(text);
      return;
    }

    letterCountRef.current = 0;
    setDisplayedText('');
    clearInterval_();

    intervalRef.current = setInterval(() => {
      letterCountRef.current++;
      setDisplayedText(text.slice(0, letterCountRef.current));
      if (letterCountRef.current >= text.length) {
        clearInterval_();
      }
    }, speed);

    return clearInterval_;
  }, [text, speed]);

  const isTyping = Boolean(intervalRef.current);

  return { displayedText, isTyping, complete };
};

export default useTypewriter;
