import { useState } from "react";
import gateSprite from "../../../../assets/images/sprites/ticket-gate.png";
import "./TicketGate.scss";

// The paddle doors of the middle ticket gate, the way out to the street. Opened while Frank is in
// the hall, they swing back into the cabinets; already open when he arrives, they are just drawn open.
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
