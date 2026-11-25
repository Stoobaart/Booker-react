import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import GameModal from "../../../../shared/components/GameModal";
import { setStoryProgress } from "../../../game/slices/gameSlice";
import { discoverNote } from "../../../investigation/slices/investigationSlice";
import { BROWSER_NAME, CLOCK, OS_NAME, browserHistory } from "../data/laptop";
import { LAPTOP_PASSWORD, victim } from "../data/victim";
import "./Laptop.scss";

export const HISTORY_NOTE_ID = "flat-living-room-browser-history";
// Frank can't guess at his password until the neighbour has let slip the son's name
export const PASSWORD_CLUE_FLAG = "samNameRevealed";

const isPassword = (guess) => guess.trim().toLowerCase() === LAPTOP_PASSWORD.toLowerCase();

const GateIcon = () => (
  <span className="laptop__gate-icon" aria-hidden="true">
    <span />
    <span />
    <span />
  </span>
);

const LockScreen = ({ canGuess, onUnlock }) => {
  const [guess, setGuess] = useState("");
  const [wrong, setWrong] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canGuess || !guess) return;
    if (isPassword(guess)) return onUnlock();
    setWrong(true);
    setGuess("");
  };

  return (
    <div className="laptop__lock">
      <div className="laptop__lock-brand">
        <GateIcon />
        {OS_NAME}
      </div>
      <div className="laptop__user-tile" aria-hidden="true" />
      <div className="laptop__user-name">{victim.firstName}</div>
      <form className="laptop__login" onSubmit={handleSubmit}>
        <input
          className="laptop__password"
          type="password"
          aria-label="Password"
          placeholder="Password"
          value={guess}
          disabled={!canGuess}
          autoFocus={canGuess}
          onChange={(e) => {
            setGuess(e.target.value);
            setWrong(false);
          }}
        />
        <button className="laptop__login-button" type="submit" aria-label="Log in" disabled={!canGuess}>
          ▶
        </button>
      </form>
      {wrong && <div className="laptop__lock-error">The password is incorrect.</div>}
      {!canGuess && (
        <p className="laptop__frank-says">
          It wants a password. I don't know the first thing about him yet. No point guessing blind.
        </p>
      )}
    </div>
  );
};

const History = ({ onClose }) => (
  <div className="laptop__history">
    <div className="laptop__history-header">
      History
      <button className="laptop__history-close" aria-label="Close history" onClick={onClose}>
        ✕
      </button>
    </div>
    <ol className="laptop__history-days">
      {browserHistory.map(({ day, visits }) => (
        <li key={day}>
          <h3 className="laptop__history-day">{day}</h3>
          <ol className="laptop__history-visits">
            {visits.map((visit) => (
              <li key={`${visit.time}-${visit.site}`} className="laptop__visit">
                <span className="laptop__visit-time">{visit.time}</span>
                <span className="laptop__visit-title">{visit.title}</span>
                <span className="laptop__visit-site">{visit.site}</span>
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ol>
  </div>
);

const Browser = ({ onClose }) => {
  const dispatch = useDispatch();
  const [showHistory, setShowHistory] = useState(false);

  const openHistory = () => {
    setShowHistory(true);
    dispatch(discoverNote(HISTORY_NOTE_ID));
  };

  return (
    <div className="laptop__window" role="dialog" aria-label={BROWSER_NAME}>
      <div className="laptop__title-bar">
        <span>{BROWSER_NAME}</span>
        <button className="laptop__window-close" aria-label={`Close ${BROWSER_NAME}`} onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="laptop__toolbar">
        <button className="laptop__nav" disabled aria-label="Back">◀</button>
        <button className="laptop__nav" disabled aria-label="Forward">▶</button>
        <div className="laptop__address">wayfarer://start</div>
        <button className="laptop__history-button" onClick={openHistory}>
          History
        </button>
      </div>
      <div className="laptop__page">
        {showHistory ? (
          <History onClose={() => setShowHistory(false)} />
        ) : (
          <div className="laptop__start-page">
            <div className="laptop__start-logo">{BROWSER_NAME}</div>
            <div className="laptop__search" aria-hidden="true">
              Search the web
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Desktop = () => {
  const [browserOpen, setBrowserOpen] = useState(false);

  return (
    <div className="laptop__desktop">
      <button className="laptop__icon" onClick={() => setBrowserOpen(true)}>
        <span className="laptop__browser-icon" aria-hidden="true" />
        {BROWSER_NAME}
      </button>
      {browserOpen && <Browser onClose={() => setBrowserOpen(false)} />}
      <div className="laptop__taskbar">
        <span className="laptop__start">
          <GateIcon />
          {OS_NAME}
        </span>
        {browserOpen && <span className="laptop__task">{BROWSER_NAME}</span>}
        <span className="laptop__clock">{CLOCK}</span>
      </div>
    </div>
  );
};

// The victim's laptop: locked until Frank guesses the password, then a desktop with a browser and its history
const Laptop = ({ onClose }) => {
  const dispatch = useDispatch();
  const unlocked = useSelector((state) => Boolean(state.game.storyProgress?.laptopUnlocked));
  const canGuess = useSelector((state) => Boolean(state.game.storyProgress?.[PASSWORD_CLUE_FLAG]));

  return (
    <GameModal className="laptop" onClose={onClose}>
      <div className="laptop__screen">
        {unlocked ? (
          <Desktop />
        ) : (
          <LockScreen canGuess={canGuess} onUnlock={() => dispatch(setStoryProgress("laptopUnlocked"))} />
        )}
      </div>
      <div className="laptop__base" aria-hidden="true" />
    </GameModal>
  );
};

export default Laptop;
