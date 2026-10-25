// DEV ONLY: the Web Speech API sends audio to Google and needs a connection.
// Replace with an offline option (e.g. Whisper) before shipping.
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
