import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import useTypewriter from '../hooks/useTypewriter';
import { markTalkOptionHeard, selectHeardTalkOptions } from '../../features/dialogue/slices/dialogueSlice';
import { discoverNote, selectHasDiscoveredNote } from '../../features/investigation/slices/investigationSlice';
import { setStoryProgress } from '../../features/game/slices/gameSlice';
import { conversationLines, isTalkOptionAvailable } from '../../features/dialogue/utils/talkOptions';
import portraitFrankRegular from '../../assets/images/portraits/portrait-frank-regular.png';
import './NPCDialogueModal.scss';

const NO_OPTIONS = [];
const NO_IDS = [];

// With a script ([{ speaker, text }]) it plays just those lines, then closes
const NPCDialogueModal = ({ npc, script, onClose }) => {
  const dispatch = useDispatch();
  const heard = useSelector((state) => selectHeardTalkOptions(state, npc.id)) ?? NO_IDS;
  const knowsName = useSelector((state) => !npc.nameNoteId || selectHasDiscoveredNote(state, npc.nameNoteId));
  // The option being talked through, and which of its lines is showing
  const [talk, setTalk] = useState(() => (script ? { option: { lines: script, ends: true }, step: 0 } : null));
  const lines = talk ? conversationLines(talk.option) : NO_OPTIONS;
  const current = talk ? lines[talk.step] : null;
  const { displayedText, isTyping, complete } = useTypewriter(current?.text ?? '', { speed: 35 });
  const storyProgress = useSelector((state) => state.game.storyProgress);
  const madeDeductionIds = useSelector((state) => state.deduction?.madeDeductionIds);
  const options = (npc.talkOptions ?? NO_OPTIONS).filter((option) =>
    isTalkOptionAvailable(option, { storyProgress, madeDeductionIds, heardOptionIds: heard })
  );

  const advance = () => {
    if (isTyping) {
      complete();
    } else if (talk.step < lines.length - 1) {
      setTalk({ ...talk, step: talk.step + 1 });
    } else {
      const { option } = talk;
      if (option.noteId) dispatch(discoverNote(option.noteId));
      if (option.setsStoryFlag) dispatch(setStoryProgress(option.setsStoryFlag));
      if (option.ends) {
        onClose();
      } else {
        dispatch(markTalkOptionHeard({ npcId: npc.id, optionId: option.id }));
        setTalk(null);
      }
    }
  };

  const speaking = (speaker) => current?.speaker === speaker;
  const spriteClass = (speaker) =>
    `npc-dialogue-portraits__sprite${speaking(speaker) && isTyping ? ' npc-dialogue-portraits__sprite--talking' : ''}`;

  // The untyped rest is laid out but hidden, so the line never moves as it types
  const speech = current && (
    <>
      {displayedText}
      <span className="npc-dialogue-portraits__untyped">{current.text.slice(displayedText.length)}</span>
    </>
  );

  const gameContainer = document.getElementById('game-container');

  const portraits = gameContainer && createPortal(
    <div className="npc-dialogue-portraits">
      <div className="npc-dialogue-portraits__frank">
        <img className={spriteClass('frank')} src={portraitFrankRegular} alt="Frank" />
      </div>
      {speaking('frank') && (
        <p className="npc-dialogue-portraits__speech npc-dialogue-portraits__speech--frank">{speech}</p>
      )}
      {npc.portrait && (
        <div className="npc-dialogue-portraits__npc">
          <img className={spriteClass('npc')} src={npc.portrait} alt={npc.name} />
        </div>
      )}
      {speaking('npc') && (
        <p
          className="npc-dialogue-portraits__speech npc-dialogue-portraits__speech--npc"
          style={npc.speechColor && { color: npc.speechColor }}
        >
          {speech}
        </p>
      )}
    </div>,
    gameContainer
  );

  return (
    <>
      {portraits}
      <div className="npc-dialogue-overlay" onClick={talk ? advance : onClose}>
        {!talk && (
          <div className="npc-dialogue" onClick={(e) => e.stopPropagation()}>
            <div className="npc-dialogue__header">
              <span className="npc-dialogue__name">{knowsName ? npc.name : npc.unknownName}</span>
              <button className="npc-dialogue__close" onClick={onClose}>
                ✕
              </button>
            </div>

            <div className="npc-dialogue__options">
              {options.map((option) => (
                <button
                  key={option.id}
                  className={`npc-dialogue__option${heard.includes(option.id) ? ' npc-dialogue__option--heard' : ''}`}
                  onClick={() => setTalk({ option, step: 0 })}
                >
                  {option.line}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NPCDialogueModal;
