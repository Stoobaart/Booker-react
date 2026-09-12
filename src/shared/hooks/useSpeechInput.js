// DEV NOTE: This uses the Web Speech API which routes audio through Google's servers
// and requires an internet connection. It is included here for development convenience only.
// Before shipping, replace with a local/offline solution (e.g. Whisper running in Electron)
// to avoid the external dependency and ensure it works packaged without internet access.
import { useState, useRef, useCallback } from 'react';

const useSpeechInput = (onResult) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const supported = typeof window !== 'undefined' && 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

  const start = useCallback(() => {
    if (!supported || isListening) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-GB';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      onResult(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [supported, isListening, onResult]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, supported, start, stop };
};

export default useSpeechInput;
