import { useEffect, useState } from 'react';

export const PAUSE_BEFORE_PHOTOS = 3000;

// At a spot: a pause, then one or two photos, each of the spot's next subject, then still until it moves on.
// Starts again whenever it's standing at a spot anew (arrived, or let go after a chat).
const usePhotoShoot = (spot, standing, shotMs) => {
  const [shot, setShot] = useState(-1);
  const subjects = spot?.subjects;

  useEffect(() => {
    if (!standing || !subjects?.length) return;
    const shots = Math.random() < 0.5 ? 1 : 2;
    const timeouts = [];
    for (let i = 0; i < shots; i += 1) {
      timeouts.push(setTimeout(() => setShot(i), PAUSE_BEFORE_PHOTOS + i * shotMs));
    }
    timeouts.push(setTimeout(() => setShot(-1), PAUSE_BEFORE_PHOTOS + shots * shotMs));
    return () => {
      timeouts.forEach(clearTimeout);
      setShot(-1);
    };
  }, [subjects, standing, shotMs]);

  const subject = standing && shot >= 0 ? subjects[shot % subjects.length] : null;
  return { shot, subject };
};

export default usePhotoShoot;
