import { sackedColleague } from "../../scenes/greatPortlandStreetUnderground/data/greatPortlandStreetUndergroundObjects";
import { missingTablets, prescription, victim } from "../../scenes/victimsFlatLivingRoom/data/victim";

// A deduction is Frank's hand-written post-it, put on a board by the string between two nodes (`from` and `to`, either way round),
// which can be another deduction's post-it.
// Cutting that string takes it off again, but Frank still remembers making it (selectHasMadeDeduction).
const deductions = [
  {
    id: "derek-knew-sacked-worker",
    boardId: "great-portland-street",
    text: `Did Derek know the sacked Tube worker, ${sackedColleague.firstName}?`,
    from: "note:newspaper-sacked-tube-worker",
    to: "note:derek-station-worker",
  },
  {
    id: "derek-fears-ending-up-like-clive",
    boardId: "great-portland-street",
    // Built on the first post-it, so Frank has read Derek's name tag by now
    text: `Derek fears ending up like ${sackedColleague.firstName}, but respected him`,
    from: "deduction:derek-knew-sacked-worker",
    to: "note:derek-fears-blame",
  },
  {
    id: "tablets-unaccounted-for",
    boardId: "victims-flat",
    // Says how many are gone, not who took them, when, or why
    text: `${prescription.quantity} dispensed, ${prescription.remaining} left: ${missingTablets} tablets unaccounted for`,
    from: "note:flat-living-room-prescription",
    to: "note:flat-living-room-tablets",
  },
  {
    id: "victim-linked-to-theft",
    boardId: "victims-flat",
    text: `He worked at ${victim.employer} as a night guard.`,
    from: "note:flat-living-room-browser-history",
    to: "note:flat-living-room-security-pass",
  },
];

export const deductionsById = Object.fromEntries(deductions.map((deduction) => [deduction.id, deduction]));

export default deductions;
