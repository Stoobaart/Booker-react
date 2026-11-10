import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { startNewGame } from "../../../game/slices/gameSlice";
import startPoints from "../../../game/data/startPoints";
import { loadGame, hasSaveGame } from "../../../../shared/utils/saveGame";
import { restoreSave, routeForScene } from "../../../../shared/utils/restoreSave";
import dickGif from "../../../../assets/images/sprites/dick.gif";
import rainGif from "../../../../assets/images/backgrounds/rain.gif";
import londonImage from "../../../../assets/images/backgrounds/london.png";
import footstepsAudio from "../../../../assets/music/footsteps.mp3";
import introAudio from "../../../../assets/music/intro.mp3";
import { playSound, pauseSound } from "../../../../shared/utils/gameAudio";
import "./SplashScreen.scss";

function SplashScreen() {
  const [gameEntered, setGameEntered] = useState(false);
  const [showLogo, setShowLogo] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const footstepsAudioRef = useRef(new Audio(footstepsAudio));
  const introAudioRef = useRef(new Audio(introAudio));
  const saveExists = hasSaveGame();

  const handleEnterGame = () => {
    playSound(footstepsAudioRef.current).catch(() => {});
    setGameEntered(true);
    showLogo &&
      setTimeout(() => {
        handleSkipLogo();
      }, 8000);
  };

  const handleSkipLogo = () => {
    pauseSound(footstepsAudioRef.current);
    introAudioRef.current.loop = true;
    playSound(introAudioRef.current).catch(() => {});
    setShowLogo(false);
  };

  const fadeOutIntro = () => {
    setFadeOut(true);
    const fadeAudio = setInterval(() => {
      const audio = introAudioRef.current;
      if (audio.volume > 0.05) {
        audio.volume -= 0.05;
      } else {
        audio.volume = 0;
        pauseSound(audio);
        clearInterval(fadeAudio);
      }
    }, 150);
  };

  const handleStartGame = () => {
    // A previous game can still be in the store if its save was deleted without a reload
    dispatch(startNewGame());
    fadeOutIntro();
    navigate("/great-portland-street");
  };

  const startFrom = (save) => {
    restoreSave(dispatch, save);
    fadeOutIntro();
    navigate(routeForScene(save.game.currentScene));
  };

  const handleContinueGame = () => {
    const save = loadGame();
    if (save) startFrom(save);
  };

  return (
    <>
      {!gameEntered && (
        <div className="public-service-announcement_container">
          <h1 className="text">
            This game contains graphic scenes, bad language and alcoholism.
            Continue?
          </h1>
          <button
            className="menu-btn"
            onClick={handleEnterGame}
          >
            CONTINUE
          </button>
        </div>
      )}
      {gameEntered && showLogo && (
        <>
          <div className="logo_container">
            <div className="dick_container">
              <img
                className="dick"
                src={dickGif}
                alt=""
              />
            </div>
            <div className="logo_title">STUBALLS GAMES</div>
          </div>
          <div
            className="logo_overlay"
            onClick={handleSkipLogo}
          ></div>
        </>
      )}
      {gameEntered && !showLogo && (
        <div className={`start-screen ${fadeOut && "fade-out"}`}>
          <div className="title-and-btns">
            <div className="title">Booker</div>
            <div className="btns-container">
              {saveExists ? (
                <button
                  className="menu-btn"
                  onClick={handleContinueGame}
                >
                  Continue
                </button>
              ) : (
                <button
                  className="menu-btn"
                  onClick={handleStartGame}
                >
                  New Game
                </button>
              )}
            </div>
            {import.meta.env.DEV && (
              <div
                className="dev-start-points"
                title="Development only. Replaces your saved game."
              >
                <div className="dev-start-points__heading">Start from…</div>
                {startPoints.map((point) => (
                  <button
                    key={point.id}
                    className="menu-btn dev-start-points__btn"
                    onClick={() => startFrom(point.save)}
                  >
                    {point.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <img
            className="rain"
            src={rainGif}
            alt=""
          />
          <img
            className="london"
            src={londonImage}
            alt=""
          />
        </div>
      )}
    </>
  );
}

export default SplashScreen;
