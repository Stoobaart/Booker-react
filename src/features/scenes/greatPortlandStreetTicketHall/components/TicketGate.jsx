import { useState } from "react";
import gateSprite from "../../../../assets/images/sprites/ticket-gate.png";
import gateOpenSfx from "../../../../assets/sfx/gate-open.wav";
import { playSound } from "../../../../shared/utils/gameAudio";
import "./TicketGate.scss";

// Animates open only if opened while Frank is in the hall
function TicketGate({ open, onOpened }) {
  const [openOnArrival] = useState(open);
  const state = !open ? "" : openOnArrival ? " ticket-gate--open" : " ticket-gate--opening";

  const handleAnimationStart = () => {
    playSound(new Audio(gateOpenSfx)).catch(() => {});
  };

  return (
    <div
      id="ticket-gate"
      className={`ticket-gate${state}`}
      style={{ backgroundImage: `url(${gateSprite})` }}
      aria-hidden="true"
      onAnimationStart={handleAnimationStart}
      onAnimationEnd={onOpened}
    />
  );
}

export default TicketGate;
