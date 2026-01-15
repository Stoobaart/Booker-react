import "./TestArea.scss";
import TestAreaImage from "../assets/images/backgrounds/test-area.png";
import rainGif from "../assets/images/backgrounds/rain.gif";
import clockObject from "../assets/images/objects/clock.gif";
import { useEffect, useRef } from "react";
import testAreaPianoAudio from "../assets/music/test-area-piano.wav";
import rainAudio from "../assets/music/rain-interior.wav";

function TestArea() {
  const rainAudioRef = useRef(new Audio(rainAudio));
  const testAreaPianoAudioRef = useRef(new Audio(testAreaPianoAudio));

  useEffect(() => {
    const rainAudio = rainAudioRef.current;
    rainAudio.loop = true;
    const testAreaPianoAudio = testAreaPianoAudioRef.current;
    testAreaPianoAudio.loop = true;

    rainAudio.play();
    testAreaPianoAudio.play();

    return () => {
      rainAudio.pause();
      testAreaPianoAudio.pause();
    };
  }, []);

  return (
    <div
      id="game-container"
      class="game-container"
    >
      <section className="test-area background">
        <img
          className="rain"
          src={rainGif}
          alt=""
        />
        <img
          className="scene"
          src={TestAreaImage}
          alt=""
        />
        <img
          className="clock"
          src={clockObject}
          alt=""
        />
      </section>

      <section className="foreground">
        {/* <WalkArea @scene="test-area" /> */}
        {/* <div id="player-container">
          <img src="/assets/character-sprites/frank-sprite-sheet-2.png" id="player-sprite" className="standing">
        </div> */}

        {/* {{#each this.model.objects as |object|}}
          <Object @object={{object}} />
        {{/each}} */}
      </section>
    </div>
  );
}

export default TestArea;
