// In tab order; rooms in the order their notes are grouped.
// A tab shows once its investigation is opened (from the start if `openAtStart`) or has a note.
export const investigations = [
  {
    id: "great-portland-street",
    name: "Great Portland St",
    openAtStart: true,
    rooms: [
      { id: "platform", name: "Platform" },
      { id: "ticket-hall", name: "Ticket hall" },
    ],
  },
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
