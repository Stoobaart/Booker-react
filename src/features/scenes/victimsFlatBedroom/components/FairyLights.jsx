import "./FairyLights.scss";

// Each bulb's timing comes from its index, so they never fall into step and stay the same each visit
function FairyLights({ bulbs }) {
  return (
    <div className="fairy-lights" aria-hidden="true">
      {bulbs.map((bulb, i) => (
        <span
          key={i}
          className="fairy-lights__bulb"
          style={{
            left: bulb.x,
            top: bulb.y,
            "--colour": bulb.colour,
            "--duration": `${1.4 + ((i * 37) % 13) / 8}s`,
            "--delay": `${-((i * 53) % 29) / 10}s`,
          }}
        />
      ))}
    </div>
  );
}

export default FairyLights;
