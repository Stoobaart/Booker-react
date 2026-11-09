import { useEffect, useState } from 'react';
import { calculateWalkTime, getFacingDirection, planPath } from '../../features/player/utils/playerMath';

const point = (spot) => [parseFloat(spot.x), parseFloat(spot.y)];
const toPosition = ([x, y]) => ({ x: `${x}px`, y: `${y}px` });

// patrol: { interval, spots: [{ x, y, face }], obstacles? }. Waits `interval` ms at each spot, then walks to the next,
// round the obstacles. While held it stays put (finishing any walk it's on) and starts its wait again once let go.
const usePatrol = (patrol, held) => {
  const [walk, setWalk] = useState({ spot: 0, path: null, leg: 0 });

  const spots = patrol?.spots ?? [];
  const { spot, path, leg } = walk;
  const legFrom = path && (leg === 0 ? point(spots[(spot - 1 + spots.length) % spots.length]) : path[leg - 1]);
  const legTo = path?.[leg];
  const legMs = path ? calculateWalkTime(legTo[0] - legFrom[0], legTo[1] - legFrom[1]) : 0;

  useEffect(() => {
    if (!patrol) return;
    if (path) {
      const timeout = setTimeout(
        () => setWalk((w) => (w.leg + 1 < w.path.length ? { ...w, leg: w.leg + 1 } : { spot: w.spot, path: null, leg: 0 })),
        legMs,
      );
      return () => clearTimeout(timeout);
    }
    if (held) return;
    const timeout = setTimeout(() => {
      setWalk((w) => {
        const next = (w.spot + 1) % patrol.spots.length;
        return { spot: next, path: planPath(point(patrol.spots[w.spot]), point(patrol.spots[next]), patrol.obstacles), leg: 0 };
      });
    }, patrol.interval);
    return () => clearTimeout(timeout);
  }, [patrol, path, leg, legMs, held]);

  if (!patrol) return null;
  return {
    spot: spots[spot],
    position: path ? toPosition(legTo) : { x: spots[spot].x, y: spots[spot].y },
    facing: path ? getFacingDirection(legFrom[0], legTo[0]) : spots[spot].face,
    walking: Boolean(path),
    legMs,
  };
};

export default usePatrol;
