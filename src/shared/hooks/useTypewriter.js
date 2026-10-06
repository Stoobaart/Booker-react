import { useState, useEffect, useCallback } from 'react';

const useTypewriter = (text, { speed = 100, skipAnimation = false } = {}) => {
  // Letter count is tied to the text it was counted for, so a new text starts from 0
  const [progress, setProgress] = useState({ text, count: 0 });

  const count = progress.text === text ? progress.count : 0;
  const isTyping = !skipAnimation && count < text.length;
  const displayedText = isTyping ? text.slice(0, count) : text;

  useEffect(() => {
    if (!isTyping) return;

    const interval = setInterval(() => {
      setProgress((prev) => ({
        text,
        count: prev.text === text ? prev.count + 1 : 1,
      }));
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, isTyping]);

  const complete = useCallback(() => {
    setProgress({ text, count: text.length });
  }, [text]);

  return { displayedText, isTyping, complete };
};

export default useTypewriter;
