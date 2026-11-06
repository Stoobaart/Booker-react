// In tab order; rooms in the order their notes are grouped.
// A tab shows once its investigation is opened (from the start if `openAtStart`) or has a note.
// The notebook opens on the tab whose `scenes` has the one Frank is in, else on General.
export const investigations = [
  {
    id: "great-portland-street",
    name: "Great Portland St",
    openAtStart: true,
    scenes: ["great-portland-street", "great-portland-street-ticket-hall"],
    rooms: [
      { id: "platform", name: "Platform" },
      { id: "ticket-hall", name: "Ticket hall" },
    ],
  },
  {
    id: "victims-flat",
    name: "The victim's flat",
    scenes: ["victims-flat-hallway", "victims-flat-living-room", "victims-flat-kitchen", "victims-flat-bedroom"],
    rooms: [
      { id: "hallway", name: "Hallway" },
      { id: "living-room", name: "Living room" },
      { id: "kitchen", name: "Kitchen" },
      { id: "bedroom", name: "Bedroom" },
    ],
  },
];

export const GENERAL_TAB = { id: "general", name: "General" };
