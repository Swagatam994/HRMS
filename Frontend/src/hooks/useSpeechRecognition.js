import { useEffect, useMemo, useRef, useState } from 'react';

export const useSpeechRecognition = () => {
  const recognitionRef = useRef(null);
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const nextTranscript = Array.from(event.results)
        .map((result) => result[0]?.transcript || '')
        .join(' ')
        .trim();
      setTranscript(nextTranscript);
    };
    recognition.onerror = (event) => {
      setError(event.error || 'Speech recognition error');
      setListening(false);
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    return () => recognition.stop();
  }, []);

  return useMemo(
    () => ({
      transcript,
      setTranscript,
      listening,
      supported,
      error,
      start: () => {
        if (!recognitionRef.current) return;
        setError('');
        try {
          recognitionRef.current.start();
          setListening(true);
        } catch (startError) {
          setListening(false);
          throw startError;
        }
      },
      stop: () => {
        if (!recognitionRef.current) return;
        recognitionRef.current.stop();
        setListening(false);
      },
      reset: () => setTranscript('')
    }),
    [transcript, listening, supported, error]
  );
};
