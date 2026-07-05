import { useEffect, useState } from 'react';

export const useTimer = (active = true) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!active) return undefined;
    const id = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [active]);

  return {
    seconds,
    reset: () => setSeconds(0)
  };
};
