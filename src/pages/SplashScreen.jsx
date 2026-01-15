import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import dickGif from "../assets/images/sprites/dick.gif";
import rainGif from "../assets/images/backgrounds/rain.gif";
import londonImage from "../assets/images/backgrounds/london.png";
import footstepsAudio from "../assets/music/footsteps.wav";
import introAudio from "../assets/music/intro.wav";

function SplashScreen() {
  const [gameEntered, setGameEntered] = useState(false);
  const [showLogo, setShowLogo] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  const navigate = useNavigate();
  const footstepsAudioRef = useRef(new Audio(footstepsAudio));
  const introAudioRef = useRef(new Audio(introAudio));

  const handleEnterGame = () => {
    footstepsAudioRef.current.play();
    setGameEntered(true);
    showLogo &&
      setTimeout(() => {
        handleSkipLogo();
      }, 8000);
  };

  const handleSkipLogo = () => {
    footstepsAudioRef.current.pause();
    introAudioRef.current.loop = true;
    introAudioRef.current.play();
    setShowLogo(false);
  };

  const handleStartGame = () => {
    setFadeOut(true);

    // Fade out intro audio over 3 seconds
    const fadeAudio = setInterval(() => {
      const audio = introAudioRef.current;
      if (audio.volume > 0.05) {
        audio.volume -= 0.05;
      } else {
        audio.volume = 0;
        audio.pause();
        clearInterval(fadeAudio);
      }
    }, 150);

    navigate("/test-area");

    // setTimeout(() => {
    //   navigate("/beginnings");
    // }, 3000);
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
              <button
                className="menu-btn"
                onClick={handleStartGame}
              >
                New Game
              </button>
            </div>
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
