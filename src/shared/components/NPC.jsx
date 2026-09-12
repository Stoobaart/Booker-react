import { useState, useEffect } from 'react';
import { usePlayer } from '../../features/player/context/PlayerContext';
import NPCDialogueModal from './NPCDialogueModal';
import inspectSprite from '../../assets/images/objects/inspect.png';
import './NPC.scss';

const NPC = ({ npc }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDialogue, setShowDialogue] = useState(false);
  const { walkTo } = usePlayer();

  const handleClick = (e) => {
    e.stopPropagation();
    setShowMenu((prev) => !prev);
  };

  const handleTalk = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    walkTo(npc.position.x, npc.position.y, () => {
      setShowDialogue(true);
    });
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
        className="npc"
        style={{ top: npc.position.y, left: npc.position.x }}
        onClick={handleClick}
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
        <img src={npc.sprite} alt={npc.name} className="npc__sprite" />
      </div>

      {showDialogue && (
        <NPCDialogueModal npc={npc} onClose={() => setShowDialogue(false)} />
      )}
    </>
  );
};

export default NPC;
