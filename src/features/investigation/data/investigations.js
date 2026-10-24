// The places Frank investigates, in the notebook's tab order. Each gets a tab, with its notes
// grouped by room in this order; notes that belong to no investigation go in a General tab last.
export const investigations = [
  {
    id: "victims-flat",
    name: "The victim's flat",
    rooms: [
      { id: "hallway", name: "Hallway" },
      { id: "living-room", name: "Living room" },
      { id: "kitchen", name: "Kitchen" },
      { id: "bedroom", name: "Bedroom" },
    ],
  },
];

export const GENERAL_TAB = { id: "general", name: "General" };
