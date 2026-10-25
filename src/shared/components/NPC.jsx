import { useState, useEffect, useRef } from 'react';
import { usePlayer } from '../../features/player/context/PlayerContext';
import NPCDialogueModal from './NPCDialogueModal';
import useIdleAnimation from '../hooks/useIdleAnimation';
import { isSpriteHit } from '../utils/spriteHitTest';
import { getFacingDirection } from '../../features/player/utils/playerMath';
import usePlayerBehind from '../../features/player/hooks/usePlayerBehind';
import inspectSprite from '../../assets/images/objects/inspect.png';
import talkSprite from '../../assets/images/objects/talk.png';
import './NPC.scss';

const NPC = ({ npc, onInspect }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDialogue, setShowDialogue] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const spriteRef = useRef(null);
  const { walkTo } = usePlayer();
  const { spriteSheet } = npc;
  const animation = useIdleAnimation(spriteSheet);
  // position.y is the NPC's feet
  const feetY = parseFloat(npc.position.y) * (npc.position.y.endsWith('rem') ? 16 : 1);
  const playerBehind = usePlayerBehind(feetY);

  const interactive = npc.interactive !== false;
  const isOnSprite = (e) => interactive && isSpriteHit(spriteRef.current, e.clientX, e.clientY);

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
    setShowMenu((prev) => !prev);
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (!isOnSprite(e)) passThrough(e);
  };

  const approach = (then) => {
    const { x, y } = npc.talkPosition ?? npc.position;
    const face = npc.talkPosition ? getFacingDirection(x, npc.position.x) : undefined;
    walkTo(x, y, then, { face });
  };

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
        className={`npc${isHovered ? ' npc--hovered' : ''}${playerBehind ? ' npc--over-player' : ''}${interactive ? '' : ' npc--scenery'}`}
        style={{ top: npc.position.y, left: npc.position.x }}
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
        ) : (
          <img ref={spriteRef} src={npc.sprite} alt={npc.name} className="npc__sprite" />
        )}
      </div>

      {showDialogue && (
        <NPCDialogueModal npc={npc} onClose={() => setShowDialogue(false)} />
      )}
    </>
  );
};

export default NPC;
