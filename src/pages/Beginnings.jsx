import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setCurrentScene } from "../store/gameSlice";
import "./Beginnings.scss";
import HallwayImage from "../assets/images/backgrounds/hallway.png";

function Beginnings() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setCurrentScene('beginnings'));
  }, [dispatch]);

  return (
    <section className="background">
      <img
        className="hallway scene"
        src={HallwayImage}
        alt=""
      />
    </section>
  );
}

export default Beginnings;
