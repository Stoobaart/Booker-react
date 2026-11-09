import "./CameraFlash.scss";

// A cone of light from the lens to what's being photographed, `delay` ms after it mounts; remount it (new key) for each photo
function CameraFlash({ from, to, delay = 0 }) {
  const [x1, y1, x2, y2] = [from.x, from.y, to.x, to.y].map(parseFloat);
  const length = Math.hypot(x2 - x1, y2 - y1);
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;

  return (
    <div
      className="camera-flash"
      data-testid="camera-flash"
      style={{
        left: `${x1}px`,
        top: `${y1}px`,
        width: `${length * 1.25}px`,
        "--spread": `${length * 0.5}px`,
        "--pool": `${Math.max(length * 0.6, 260)}px`,
        transform: `rotate(${angle}deg)`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="camera-flash__beam" />
      <div className="camera-flash__pool" />
      <div className="camera-flash__bulb" />
    </div>
  );
}

export default CameraFlash;
