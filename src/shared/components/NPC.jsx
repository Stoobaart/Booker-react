import { useState, useEffect, useRef } from 'react';
import { usePlayer } from '../../features/player/context/PlayerContext';
import NPCDialogueModal from './NPCDialogueModal';
import useIdleAnimation from '../hooks/useIdleAnimation';
import { isSpriteHit } from '../utils/spriteHitTest';
import { getFacingDirection } from '../../features/player/utils/playerMath';
import inspectSprite from '../../assets/images/objects/inspect.png';
import './NPC.scss';

const NPC = ({ npc }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDialogue, setShowDialogue] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const spriteRef = useRef(null);
  const { walkTo } = usePlayer();
  const { spriteSheet } = npc;
  const animation = useIdleAnimation(spriteSheet);

  const isOnSprite = (e) => isSpriteHit(spriteRef.current, e.clientX, e.clientY);

  // Hands a click on the transparent part of the sprite to whatever is underneath (usually the walk area)
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

  const handleTalk = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    const { x, y } = npc.talkPosition ?? npc.position;
    // Standing beside the NPC, Frank turns to face them
    const face = npc.talkPosition ? getFacingDirection(x, npc.position.x) : undefined;
    walkTo(x, y, () => setShowDialogue(true), { face });
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
        className={`npc${isHovered ? ' npc--hovered' : ''}`}
        style={{ top: npc.position.y, left: npc.position.x }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseMove={(e) => setIsHovered(isOnSprite(e))}
        onMouseLeave={() => setIsHovered(false)}
      >
        {showMenu && (
          <div className="interaction-menu" onClick={(e) => e.stopPropagation()}>
            <button className="interaction-btn" onClick={handleTalk}>
              <div
                className="inspect-icon"
                style={{ backgroundImage: `url(${inspectSprite})` }}
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
