import { useEffect, useRef } from "react";
import { GAME_WIDTH, getCameraX } from "../../features/player/utils/playerMath";
import { createSplash, splashesToSpawn, splashPixels } from "../utils/rainSplashes";
import "./RainSplashes.scss";

// Rain landing on the ground, on its own layer: over the background but under Frank and anything
// else in the foreground. `top` and `bottom` are where the scene's ground starts and ends (game
// px), so each scene lines it up with its own pavement. `width` is the scene's width; in a
// side-scrolling scene only the stretch under the camera gets splashes.
const RainSplashes = ({ top, bottom = 980, width = GAME_WIDTH, rate = 200 }) => {
  const canvasRef = useRef(null);
  const height = bottom - top;

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return undefined;
    let splashes = [];
    let frame;
    let last = performance.now();

    const draw = (now) => {
      const dt = Math.min(now - last, 100);
      last = now;
      const left = Math.max(0, Math.min(getCameraX(), width - GAME_WIDTH));
      const span = Math.min(GAME_WIDTH, width);
      for (let i = splashesToSpawn(rate, dt, span / GAME_WIDTH); i > 0; i--) {
        splashes.push(createSplash({ left, width: span, height }, now));
      }

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgb(200, 215, 235)";
      splashes = splashes.filter((splash) => {
        const pixels = splashPixels(splash, now);
        if (!pixels) return false;
        ctx.globalAlpha = pixels.alpha;
        pixels.blocks.forEach(([x, y]) => ctx.fillRect(x, y - pixels.size, pixels.size, pixels.size));
        return true;
      });
      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [width, height, rate]);

  return (
    <canvas
      ref={canvasRef}
      className="rain-splashes"
      width={width}
      height={height}
      style={{ top: `${top}px`, width: `${width}px`, height: `${height}px` }}
    />
  );
};

export default RainSplashes;
