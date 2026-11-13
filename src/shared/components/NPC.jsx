import { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { usePlayer } from '../../features/player/context/PlayerContext';
import NPCDialogueModal from './NPCDialogueModal';
import useIdleAnimation from '../hooks/useIdleAnimation';
import usePatrol from '../hooks/usePatrol';
import usePhotoShoot from '../hooks/usePhotoShoot';
import CameraFlash from './CameraFlash';
import { isSpriteHit } from '../utils/spriteHitTest';
import { getFacingDirection } from '../../features/player/utils/playerMath';
import usePlayerBehind from '../../features/player/hooks/usePlayerBehind';
import { reportTutorialAction } from '../../features/tutorial/slices/tutorialSlice';
import inspectSprite from '../../assets/images/objects/inspect.png';
import talkSprite from '../../assets/images/objects/talk.png';
import './NPC.scss';

// lens: where the camera is, from the feet of a sprite drawn facing right
const lensPosition = (feet, lens, facing) => ({
  x: parseFloat(feet.x) + (facing === 'left' ? -lens.x : lens.x),
  y: parseFloat(feet.y) + lens.y,
});

const NPC = ({ npc, onInspect }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDialogue, setShowDialogue] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  // Frank is on his way over to talk: stay put for him
  const [approaching, setApproaching] = useState(false);
  const spriteRef = useRef(null);
  const dispatch = useDispatch();
  const { walkTo, setMovingObstacle } = usePlayer();
  const { spriteSheet } = npc;
  const held = showMenu || approaching || showDialogue;
  const patrol = usePatrol(npc.patrol, held);
  const position = patrol?.position ?? npc.position;
  const idleAnimation = useIdleAnimation(spriteSheet);
  const standing = Boolean(patrol) && !patrol.walking && !held;
  const photo = usePhotoShoot(patrol?.spot, standing, spriteSheet?.photograph?.duration);
  const animation = patrol?.walking ? spriteSheet.walk : photo.subject ? spriteSheet.photograph : idleAnimation;
  // position.y is the NPC's feet
  const feetY = parseFloat(position.y) * (position.y.endsWith('rem') ? 16 : 1);
  const playerBehind = usePlayerBehind(feetY);

  const interactive = npc.interactive !== false;
  // facing left, its frame is flipped, so the sheet is too
  const mirrored = patrol?.facing === 'left';
  const isOnSprite = (e) => interactive && isSpriteHit(spriteRef.current, e.clientX, e.clientY, mirrored);

  // Clicks on the sprite's transparent pixels go to whatever is underneath
  const passThrough = (e) => {
    const below = document
      .elementsFromPoint(e.clientX, e.clientY)
      .find((el) => !e.currentTarget.contains(el));
    below?.dispatchEvent(
      new MouseEvent(e.type, { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY }),
    );
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (!isOnSprite(e)) {
      setShowMenu(false);
      passThrough(e);
      return;
    }
    if (!showMenu) dispatch(reportTutorialAction(`menu:${npc.id}`));
    setShowMenu(!showMenu);
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (!isOnSprite(e)) passThrough(e);
  };

  const approach = (then) => {
    const talkPosition = patrol?.spot.talkPosition ?? npc.talkPosition;
    const { x, y } = talkPosition ?? position;
    const face = talkPosition ? getFacingDirection(x, position.x) : undefined;
    setApproaching(true);
    walkTo(x, y, () => {
      setApproaching(false);
      then?.();
    }, { face });
  };

  // Frank walks round a patrolling NPC wherever it is (or is heading)
  const footprint = npc.patrol?.footprint;
  useEffect(() => {
    if (!footprint) return;
    const [x, y] = [parseFloat(position.x), parseFloat(position.y)];
    setMovingObstacle(npc.id, {
      left: x - footprint.width / 2,
      right: x + footprint.width / 2,
      top: y - footprint.depth,
      bottom: y + footprint.depth / 4,
    });
    return () => setMovingObstacle(npc.id, null);
  }, [footprint, npc.id, position.x, position.y, setMovingObstacle]);

  // Another click sends Frank elsewhere, and his walk here never finishes
  useEffect(() => {
    if (!approaching) return;
    const giveUp = () => setApproaching(false);
    document.addEventListener('click', giveUp);
    return () => document.removeEventListener('click', giveUp);
  }, [approaching]);

  const handleInspect = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    approach(onInspect);
  };

  const handleTalk = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    approach(() => setShowDialogue(true));
  };

  useEffect(() => {
    if (!showMenu) return;
    const handleOutsideClick = () => setShowMenu(false);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [showMenu]);

  return (
    <>
      <div
        className={`npc${isHovered ? ' npc--hovered' : ''}${playerBehind ? ' npc--over-player' : ''}${interactive ? '' : ' npc--scenery'}${patrol?.facing === 'left' ? ' npc--facing-left' : ''}`}
        style={{
          top: position.y,
          left: position.x,
          transition: patrol?.walking ? `top ${patrol.legMs}ms linear, left ${patrol.legMs}ms linear` : 'none',
        }}
        data-id={npc.id}
        {...(interactive && {
          onClick: handleClick,
          onDoubleClick: handleDoubleClick,
          onMouseMove: (e) => setIsHovered(isOnSprite(e)),
          onMouseLeave: () => setIsHovered(false),
        })}
      >
        {showMenu && (
          <div className="interaction-menu" onClick={(e) => e.stopPropagation()}>
            {onInspect && (
              <button className="interaction-btn" onClick={handleInspect}>
                <div className="inspect-icon" style={{ backgroundImage: `url(${inspectSprite})` }} />
              </button>
            )}
            <button className="interaction-btn" onClick={handleTalk}>
              <div
                className="talk-icon"
                style={{ backgroundImage: `url(${talkSprite})` }}
              />
            </button>
          </div>
        )}
        {spriteSheet ? (
          <div className="npc__shadow">
            <div
              className="npc__sprite-frame"
              style={{ width: spriteSheet.width, height: spriteSheet.height }}
            >
              {/* Keyed so the CSS animation restarts from frame 0 on each change */}
              <img
                key={animation.name}
                ref={spriteRef}
                src={npc.sprite}
                alt={npc.name}
                className="npc__sprite npc__sprite--sheet"
                data-animation={animation.name}
                style={{
                  '--columns': spriteSheet.columns,
                  '--rows': spriteSheet.rows,
                  '--row': animation.row,
                  '--frames': animation.frames,
                  '--duration': `${animation.duration}ms`,
                }}
              />
            </div>
          </div>
        ) : (
          <img ref={spriteRef} src={npc.sprite} alt={npc.name} className="npc__sprite" />
        )}
      </div>

      {photo.subject && (
        <CameraFlash
          key={photo.shot}
          from={lensPosition(position, spriteSheet.lens, patrol.facing)}
          to={photo.subject}
          delay={spriteSheet.photograph.flashAt}
        />
      )}

      {showDialogue && (
        <NPCDialogueModal npc={npc} onClose={() => setShowDialogue(false)} />
      )}
    </>
  );
};

export default NPC;
