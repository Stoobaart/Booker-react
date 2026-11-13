import useBlink from '../hooks/useBlink';
import usePortraitAction from '../hooks/usePortraitAction';
import './Portrait.scss';

const FRAME_W = 80;
const FRAME_H = 96;
const FRAMES = 15;
const SHUT_FRAME = 5;
// a pixel round each eye, the same open or shut, so the clip's soft edge never shows
const MARGIN = 1;

const percent = (part, whole) => `${(part / whole) * 100}%`;

const clipTo = ({ x, y, width, height }) => {
  const [left, top] = [x - MARGIN, y - MARGIN];
  const [right, bottom] = [x + width + MARGIN, y + height + MARGIN];
  return `inset(${percent(top, FRAME_H)} ${percent(FRAME_W - right, FRAME_W)} ${percent(FRAME_H - bottom, FRAME_H)} ${percent(left, FRAME_W)})`;
};

// Only the mouth changes between frames, so the shut frame's eyes fit over any of them
function Portrait({ src, eyes = [], action, talking = false, alt, className, id }) {
  const shut = useBlink();
  const acting = usePortraitAction(action, talking);

  return (
    <>
      <img id={id} className={className} src={src} alt={alt} />
      {acting && (
        <div className="portrait-action">
          <img
            src={action.src}
            alt=""
            style={{
              width: `${action.frames * 100}%`,
              animation: `portrait-action ${action.duration}ms steps(${action.frames}) both`,
            }}
          />
        </div>
      )}
      {shut &&
        !acting &&
        eyes.map((eye) => (
          <div key={`${eye.x},${eye.y}`} className="portrait-blink" style={{ clipPath: clipTo(eye) }}>
            <img src={src} alt="" style={{ transform: `translateX(-${percent(SHUT_FRAME, FRAMES)})` }} />
          </div>
        ))}
    </>
  );
}

export default Portrait;
