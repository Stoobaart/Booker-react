import { useEffect, useState } from 'react';

export const BLINK_MS = 150;
export const MIN_OPEN_MS = 2500;
export const MAX_OPEN_MS = 6000;

const openFor = () => MIN_OPEN_MS + Math.random() * (MAX_OPEN_MS - MIN_OPEN_MS);

const useBlink = () => {
  const [shut, setShut] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setShut(!shut), shut ? BLINK_MS : openFor());
    return () => clearTimeout(timeout);
  }, [shut]);

  return shut;
};

export default useBlink;
