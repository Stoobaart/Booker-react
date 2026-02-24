import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setCurrentScene } from "../store/gameSlice";
import WalkArea from "../components/WalkArea";
import Frank from "../components/Frank";
import NavigationItem from "../components/NavigationItem";
import GreatPortlandStreetExteriorImage from "../assets/images/backgrounds/great-portland-street-exterior.png";

function GreatPortlandStreetExterior() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setCurrentScene("great-portland-street-exterior"));
  }, [dispatch]);

  const navItems = [
    {
      id: "to-underground",
      name: "Great Portland Street Underground",
      description: "Enter the underground station",
      position: { x: "45rem", y: "25rem" },
      size: { width: "7rem", height: "11rem" },
      to: "/great-portland-street",
    },
  ];

  return (
    <div
      id="game-container"
      className="game-container"
    >
      <section className="great-portland-street-exterior background">
        <img
          src={GreatPortlandStreetExteriorImage}
          alt="Great Portland Street Exterior"
        />
      </section>

      <section className="foreground">
        <WalkArea scene="great-portland-street-exterior" />
        <Frank
          scale={0.65}
          startPosition={{ x: "34%", y: "12rem" }}
        />
        {navItems.map((nav) => (
          <NavigationItem
            key={nav.id}
            id={nav.id}
            name={nav.name}
            description={nav.description}
            position={nav.position}
            size={nav.size}
            to={nav.to}
          />
        ))}
      </section>
    </div>
  );
}

export default GreatPortlandStreetExterior;
