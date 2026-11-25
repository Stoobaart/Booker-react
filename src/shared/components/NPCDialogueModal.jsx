import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import useTypewriter from '../hooks/useTypewriter';
import {
  adjustStanding,
  chatClosed,
  chatOpened,
  markTalkOptionHeard,
  selectHeardTalkOptions,
  selectStanding,
} from '../../features/dialogue/slices/dialogueSlice';
import { discoverNote, selectHasDiscoveredNote } from '../../features/investigation/slices/investigationSlice';
import { setStoryProgress } from '../../features/game/slices/gameSlice';
import {
  NO_STANDING,
  applyEffect,
  chooseOutcome,
  conversationLines,
  isTalkOptionAvailable,
} from '../../features/dialogue/utils/talkOptions';
import { frankEyes, frankPortraits } from '../data/frankPortrait';
import Portrait from './Portrait';
import './NPCDialogueModal.scss';

const NO_OPTIONS = [];
const NO_IDS = [];

// One part of an option (its `root`) being talked through: Frank choosing how to put it (its approaches),
// or its lines playing, the outcome its standing meets if it has outcomes
const beatTalk = (root, beat, standing) => {
  if (beat.approaches) return { root, beat, choosing: true };
  const played = beat.outcomes ? chooseOutcome(beat.outcomes, standing) : beat;
  return { root, beat: played, lines: conversationLines(played, standing), step: 0 };
};

// With a script ([{ speaker, text }]) it plays just those lines, then closes
const NPCDialogueModal = ({ npc, script, onClose }) => {
  const dispatch = useDispatch();
  const heard = useSelector((state) => selectHeardTalkOptions(state, npc.id)) ?? NO_IDS;
  const standing = useSelector((state) => selectStanding(state, npc.id)) ?? NO_STANDING;
  const knowsName = useSelector((state) => !npc.nameNoteId || selectHasDiscoveredNote(state, npc.nameNoteId));
  const storyProgress = useSelector((state) => state.game.storyProgress);
  const madeDeductionIds = useSelector((state) => state.deduction?.madeDeductionIds);
  const discoveredNoteIds = useSelector((state) => state.investigation?.discoveredNoteIds);
  const carriedItems = useSelector((state) => state.inventory?.items);
  const carriedItemIds = carriedItems?.map((item) => item.id);
  const available = (npc.talkOptions ?? NO_OPTIONS).filter((option) =>
    isTalkOptionAvailable(option, { storyProgress, madeDeductionIds, heardOptionIds: heard, discoveredNoteIds, carriedItemIds })
  );
  const options = available.filter((option) => !option.auto);

  // An auto option not yet heard plays as the chat opens
  const [talk, setTalk] = useState(() => {
    if (script) {
      const root = { lines: script, ends: true };
      return beatTalk(root, root, standing);
    }
    const auto = available.find((option) => option.auto && !heard.includes(option.id));
    return auto ? beatTalk(auto, auto, standing) : null;
  });
  const lines = talk?.lines ?? NO_OPTIONS;
  const current = talk?.lines ? lines[talk.step] : null;
  const { displayedText, isTyping, complete } = useTypewriter(current?.text ?? '', { speed: 35 });

  useEffect(() => {
    dispatch(chatOpened());
    return () => dispatch(chatClosed());
  }, [dispatch]);

  // Its effect counts the first time only, so asking again can't win her round
  const chooseApproach = (approach) => {
    const { root, beat } = talk;
    let now = standing;
    if (approach.effect && !heard.includes(root.id)) {
      dispatch(adjustStanding({ npcId: npc.id, ...approach.effect }));
      now = applyEffect(standing, approach.effect);
    }
    dispatch(markTalkOptionHeard({ npcId: npc.id, optionId: root.id }));
    setTalk(beatTalk(root, { ...approach, then: beat.then }, now));
  };

  const advance = () => {
    if (isTyping) {
      complete();
    } else if (talk.step < lines.length - 1) {
      setTalk({ ...talk, step: talk.step + 1 });
    } else {
      const { root, beat } = talk;
      if (beat.noteId) dispatch(discoverNote(beat.noteId));
      [].concat(beat.setsStoryFlag ?? []).forEach((flag) => dispatch(setStoryProgress(flag)));
      if (beat.then) {
        setTalk(beatTalk(root, beat.then, standing));
      } else if (beat.ends || root.ends) {
        onClose();
      } else {
        dispatch(markTalkOptionHeard({ npcId: npc.id, optionId: root.id }));
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
        <Portrait className={spriteClass('frank')} src={frankPortraits.regular} eyes={frankEyes.regular} alt="Frank" />
      </div>
      {speaking('frank') && (
        <p className="npc-dialogue-portraits__speech npc-dialogue-portraits__speech--frank">{speech}</p>
      )}
      {npc.portrait && (
        <div className="npc-dialogue-portraits__npc">
          <Portrait
            className={spriteClass('npc')}
            src={npc.portrait}
            eyes={npc.portraitEyes}
            action={npc.portraitAction}
            talking={speaking('npc') && isTyping}
            alt={npc.name}
          />
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
      <div className="npc-dialogue-overlay" onClick={talk && !talk.choosing ? advance : onClose}>
        {(!talk || talk.choosing) && (
          <div className="npc-dialogue" onClick={(e) => e.stopPropagation()}>
            <div className="npc-dialogue__header">
              <span className="npc-dialogue__name">{knowsName ? npc.name : npc.unknownName}</span>
              <button className="npc-dialogue__close" onClick={onClose}>
                ✕
              </button>
            </div>

            <div className="npc-dialogue__options">
              {talk?.choosing
                ? talk.beat.approaches.map((approach) => (
                    <button
                      key={approach.id}
                      data-option-id={`${talk.root.id}:${approach.id}`}
                      className="npc-dialogue__option"
                      onClick={() => chooseApproach(approach)}
                    >
                      {approach.line}
                    </button>
                  ))
                : options.map((option) => (
                    <button
                      key={option.id}
                      data-option-id={option.id}
                      className={`npc-dialogue__option${heard.includes(option.id) ? ' npc-dialogue__option--heard' : ''}`}
                      onClick={() => setTalk(beatTalk(option, option, standing))}
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
