import useBlink from '../hooks/useBlink';
import usePortraitAction from '../hooks/usePortraitAction';
import './Portrait.scss';

// Talking strips are 15 frames of 80x96; frame 5 has the eyes shut
const FRAME_W = 80;
const FRAME_H = 96;
const FRAMES = 15;
const SHUT_FRAME = 5;
// Each eye's box takes in a pixel round it, the same open or shut, so the clip's soft edge never shows
const MARGIN = 1;

const percent = (part, whole) => `${(part / whole) * 100}%`;

const clipTo = ({ x, y, width, height }) => {
  const [left, top] = [x - MARGIN, y - MARGIN];
  const [right, bottom] = [x + width + MARGIN, y + height + MARGIN];
  return `inset(${percent(top, FRAME_H)} ${percent(FRAME_W - right, FRAME_W)} ${percent(FRAME_H - bottom, FRAME_H)} ${percent(left, FRAME_W)})`;
};

// A talking portrait that blinks every few seconds, talking or not: over each eye (`eyes`, boxes in a frame's
// pixels) it shows the strip's shut frame, laid out like the strip so their pixels line up. Only the mouth moves
// from frame to frame, so the shut eyes fit whichever frame is showing.
// Given an `action` (`{ src, frames, duration, every }`: a strip of whole frames that starts and ends on the
// portrait's first), it plays it over the portrait now and then while they aren't talking.
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
