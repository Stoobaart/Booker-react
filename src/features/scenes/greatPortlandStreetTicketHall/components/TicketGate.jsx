import { useState } from "react";
import gateSprite from "../../../../assets/images/sprites/ticket-gate.png";
import "./TicketGate.scss";

// Animates open only if opened while Frank is in the hall
function TicketGate({ open }) {
  const [openOnArrival] = useState(open);
  const state = !open ? "" : openOnArrival ? " ticket-gate--open" : " ticket-gate--opening";

  return (
    <div
      id="ticket-gate"
      className={`ticket-gate${state}`}
      style={{ backgroundImage: `url(${gateSprite})` }}
      aria-hidden="true"
    />
  );
}

export default TicketGate;
