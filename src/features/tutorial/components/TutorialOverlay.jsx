import { useEffect, useState } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { useLocation } from 'react-router-dom';
import useTypewriter from '../../../shared/hooks/useTypewriter';
import { GAME_HEIGHT, GAME_WIDTH, screenRectToGame } from '../../player/utils/playerMath';
import { TIP_HEIGHT, TIP_WIDTH, tipPlacement } from '../utils/tipPlacement';
import tutorialSteps from '../data/tutorialSteps';
import { completeTutorialStep, skipTutorial } from '../slices/tutorialSlice';
import { currentStepIndex, pickTarget } from '../utils/tutorial';
import './TutorialOverlay.scss';

// While any of these is on screen the tutorial waits, out of the way: Frank or an NPC speaking, the paper, the arrival train
const BUSY = '.talk-overlay, .game-modal, .npc-dialogue-portraits__speech, .underground-train:not(.underground-train--gone)';
// While Frank walks somewhere he was sent, nothing can be clicked
const WALKING = '#player-sprite.walk';
const HOLE_PADDING = 8;

const selectorsOf = (selector) => (Array.isArray(selector) ? selector : [selector]);

const elementsFor = (selector) => selectorsOf(selector).map((s) => document.querySelector(s));

const isShown = (selector) =>
  elementsFor(selector).every((el) => {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });

// Every element's box together, in canvas px
const boxAround = (selector, padding = 0) => {
  const rects = elementsFor(selector).map((el) => screenRectToGame(el.getBoundingClientRect()));
  const left = Math.min(...rects.map((r) => r.left)) - padding;
  const top = Math.min(...rects.map((r) => r.top)) - padding;
  const right = Math.max(...rects.map((r) => r.left + r.width)) + padding;
  const bottom = Math.max(...rects.map((r) => r.top + r.height)) + padding;
  return { left: Math.round(left), top: Math.round(top), width: Math.round(right - left), height: Math.round(bottom - top) };
};

// What to draw this frame: nothing, a veil alone (Frank walking), or a tip with an optional hole and ring
const viewFor = (step, state) => {
  if (document.querySelector(BUSY)) return null;
  if (document.querySelector(WALKING)) return { stepId: step.id, mode: 'wait' };
  const target = pickTarget(step, state, isShown);
  if (!target) {
    // An info tip whose thing has gone (an old toast) is still worth saying
    return step.kind === 'info' ? { stepId: step.id, mode: 'tip', text: step.targets[0].text } : null;
  }
  return {
    stepId: step.id,
    mode: 'tip',
    text: target.text,
    hole: target.selector ? boxAround(target.selector, HOLE_PADDING) : null,
    ring: target.ring && isShown(target.ring) ? boxAround(target.ring, 4) : null,
  };
};

const sameView = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Swallows a press so nothing under the veil gets it (menus listen on document to close)
const swallow = (e) => e.stopPropagation();

// The four sides round the hole; the hole itself lets clicks through to the thing in it
const Veil = ({ hole, blockHole }) => {
  if (!hole) return <div className="tutorial-overlay__veil" style={{ inset: 0 }} onClick={swallow} onPointerDown={swallow} />;
  const right = hole.left + hole.width;
  const bottom = hole.top + hole.height;
  const sides = [
    { left: 0, top: 0, width: GAME_WIDTH, height: Math.max(hole.top, 0) },
    { left: 0, top: bottom, width: GAME_WIDTH, height: Math.max(GAME_HEIGHT - bottom, 0) },
    { left: 0, top: hole.top, width: Math.max(hole.left, 0), height: hole.height },
    { left: right, top: hole.top, width: Math.max(GAME_WIDTH - right, 0), height: hole.height },
  ];
  return (
    <>
      {sides.map((style, i) => (
        <div key={i} className="tutorial-overlay__veil" style={style} onClick={swallow} onPointerDown={swallow} />
      ))}
      {blockHole && <div className="tutorial-overlay__catcher" style={hole} onClick={swallow} onPointerDown={swallow} />}
      <div className="tutorial-overlay__hole" style={hole} />
    </>
  );
};

const Tip = ({ text, number, total, hole, isInfo, onNext, onSkip }) => {
  const { displayedText, isTyping, complete } = useTypewriter(text, { speed: 30 });
  const [confirmingSkip, setConfirmingSkip] = useState(false);
  const { left, top, arrow } = tipPlacement(hole);

  const handleNext = (e) => {
    e.stopPropagation();
    if (isTyping) complete();
    else onNext();
  };

  return (
    <div
      className="tutorial-tip"
      role="dialog"
      aria-label="Tutorial"
      style={{ left, top, width: TIP_WIDTH, height: TIP_HEIGHT }}
      onClick={(e) => {
        swallow(e);
        if (isTyping) complete();
      }}
      onPointerDown={swallow}
    >
      {arrow && (
        <div
          className={`tutorial-tip__arrow tutorial-tip__arrow--${arrow.side}`}
          style={arrow.side === 'top' || arrow.side === 'bottom' ? { left: arrow.offset } : { top: arrow.offset }}
        />
      )}
      <span className="tutorial-tip__label">Tutorial {number}/{total}</span>
      <p className="tutorial-tip__text">
        {displayedText}
        <span className="tutorial-tip__untyped">{text.slice(displayedText.length)}</span>
      </p>
      <div className="tutorial-tip__actions">
        {confirmingSkip ? (
          <span className="tutorial-tip__confirm">
            Skip the tutorial?
            <button className="tutorial-tip__link" onClick={onSkip}>Yes</button>
            <button className="tutorial-tip__link" onClick={() => setConfirmingSkip(false)}>No</button>
          </span>
        ) : (
          <button className="tutorial-tip__link" onClick={() => setConfirmingSkip(true)}>Skip tutorial</button>
        )}
        {isInfo && <button className="tutorial-tip__next" onClick={handleNext}>Next ▸</button>}
      </div>
    </div>
  );
};

const TutorialOverlay = () => {
  const dispatch = useDispatch();
  const store = useStore();
  const { pathname } = useLocation();
  const index = useSelector((state) => currentStepIndex(state));
  const scene = useSelector((state) => state.game.currentScene);
  const step = tutorialSteps[index] ?? null;
  const active = Boolean(step) && pathname !== '/' && scene === step.scene;
  const [view, setView] = useState(null);

  // Records how far the player has got, and completes a step once what it waits for has happened
  useEffect(() => {
    const check = () => {
      const state = store.getState();
      const at = currentStepIndex(state);
      if (at < 0) return;
      const doneIndex = tutorialSteps.findIndex((s) => s.id === state.tutorial?.doneStepId);
      if (at - 1 > doneIndex) dispatch(completeTutorialStep(tutorialSteps[at - 1].id));
      const current = tutorialSteps[at];
      if (current.scene === state.game.currentScene && current.doneWhen?.(state)) {
        dispatch(completeTutorialStep(current.id));
      }
    };
    check();
    return store.subscribe(check);
  }, [store, dispatch]);

  // Things move (the board slides in, Frank walks), so the hole is measured every frame
  useEffect(() => {
    if (!active) return undefined;
    let frame;
    const measure = () => {
      const next = viewFor(step, store.getState());
      setView((current) => (sameView(current, next) ? current : next));
      frame = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(frame);
  }, [active, step, store]);

  if (!active || view?.stepId !== step.id) return null;

  return (
    <div className="tutorial-overlay" data-step={step.id}>
      <Veil hole={view.hole} blockHole={step.kind === 'info'} />
      {view.ring && <div className="tutorial-overlay__ring" style={view.ring} />}
      {view.mode === 'tip' && (
        <Tip
          text={view.text}
          number={index + 1}
          total={tutorialSteps.length}
          hole={view.hole}
          isInfo={step.kind === 'info'}
          onNext={() => dispatch(completeTutorialStep(step.id))}
          onSkip={() => dispatch(skipTutorial())}
        />
      )}
    </div>
  );
};

export default TutorialOverlay;
