import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { setCurrentScene } from "../../../game/slices/gameSlice";
import WalkArea from "../../../../shared/components/WalkArea";
import Frank from "../../../player/components/Frank";
import NavigationItem from "../../../../shared/components/NavigationItem";
import Occluder from "../../../../shared/components/Occluder";
import useMusic from "../../../../shared/hooks/useMusic";
import HallwayImage from "../../../../assets/images/backgrounds/victims-flat-hallway.png";
import rainAudio from "../../../../assets/music/rain-interior.wav";
import { arrivalFromLivingRoom, arrivalFromStreet, exits, obstacles, tableOccluder } from "../data/victimsFlatHallwayObjects";
import "./VictimsFlatHallway.scss";

// The victim's hallway: windowless, one weak bulb, three closed doors and a table of unopened post
function VictimsFlatHallway() {
  const dispatch = useDispatch();
  const location = useLocation();
  const fromLivingRoom = location.state?.from === "/victims-flat-living-room";

  // The rain outside, muffled
  useMusic(rainAudio, { volume: 0.4 });

  useEffect(() => {
    dispatch(setCurrentScene("victims-flat-hallway"));
  }, [dispatch]);

  return (
    <div
      id="game-container"
      className="game-container"
    >
      <section className="victims-flat-hallway background">
        <img
          src={HallwayImage}
          alt="A dark hallway"
        />
      </section>

      <section className="foreground">
        <WalkArea scene="victims-flat-hallway" obstacles={obstacles} />
        {/* He starts right by the camera and the hall runs a long way back, so he shrinks a lot
            walking down it */}
        <Frank
          scale={1.8}
          backScale={0.44}
          startPosition={fromLivingRoom ? arrivalFromLivingRoom : arrivalFromStreet}
          direction={fromLivingRoom ? "down" : "up"}
        />
        <Occluder {...tableOccluder} />
        {exits.map((exit) => (
          <NavigationItem key={exit.id} {...exit} />
        ))}
      </section>
    </div>
  );
}

export default VictimsFlatHallway;
