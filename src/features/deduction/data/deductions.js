import { sackedColleague } from "../../scenes/greatPortlandStreetUnderground/data/greatPortlandStreetUndergroundObjects";

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
];

export const deductionsById = Object.fromEntries(deductions.map((deduction) => [deduction.id, deduction]));

export default deductions;
