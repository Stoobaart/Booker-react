import { useEffect } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { setStoryProgress } from '../../game/slices/gameSlice';
import { selectIsChatOpen } from '../slices/dialogueSlice';
import { nextNudge } from '../utils/nudges';

const NO_IDS = [];

// Frank says each nudge once, when nothing else is on screen (the board only if it's to be said over it)
const useFrankNudges = ({ showTalkOverlay, setLinesAndSpeak }) => {
  const dispatch = useDispatch();
  const store = useStore();
  const storyProgress = useSelector((state) => state.game.storyProgress);
  const discoveredNoteIds = useSelector((state) => state.investigation?.discoveredNoteIds ?? NO_IDS);
  const madeDeductionIds = useSelector((state) => state.deduction?.madeDeductionIds ?? NO_IDS);
  const heardTalkOptions = useSelector((state) => state.dialogue?.heardTalkOptions);
  const busy = useSelector((state) => selectIsChatOpen(state) || Boolean(state.investigation?.isNotebookOpen));
  const isBoardOpen = useSelector((state) => Boolean(state.deduction?.isBoardOpen));

  useEffect(() => {
    if (showTalkOverlay || busy) return;
    // Read fresh: a repeat run before the next render must see the flag just set
    const state = store.getState();
    const nudge = nextNudge({
      storyProgress: state.game.storyProgress,
      discoveredNoteIds: state.investigation?.discoveredNoteIds,
      madeDeductionIds: state.deduction?.madeDeductionIds,
      heardTalkOptions: state.dialogue?.heardTalkOptions,
    });
    if (!nudge || (isBoardOpen && !nudge.overBoard)) return;
    dispatch(setStoryProgress(nudge.flag));
    setLinesAndSpeak(nudge.lines);
  }, [showTalkOverlay, busy, isBoardOpen, storyProgress, discoveredNoteIds, madeDeductionIds, heardTalkOptions, store, dispatch, setLinesAndSpeak]);
};

export default useFrankNudges;
