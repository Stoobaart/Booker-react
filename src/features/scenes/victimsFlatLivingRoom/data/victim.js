// Who the victim was, and what's written on things in his flat. Notes and deductions build their text from these.
export const victim = {
  firstName: "Martin",
  surname: "Doyle",
  son: "Sam",
  employer: "Halden Group",
  jobTitle: "Night Security Guard",
  staffNumber: "HG-04471",
};

export const fullName = `${victim.firstName} ${victim.surname}`;

// Across the landing; she had a key to his flat
export const neighbour = { title: "Mrs", firstName: "Maureen", surname: "Kelly" };

export const neighbourName = `${neighbour.title} ${neighbour.firstName} ${neighbour.surname}`;

// Her sleeping pills, not his: she gave him some when he couldn't sleep. What's left is in the bottle and loose on the table
const inBottle = 4;
const loose = 3;

export const prescription = {
  owner: neighbourName,
  medicine: "Somnoral 50mg",
  pharmacy: "Pearce's Chemist, Marylebone",
  dispensed: "Monday 1 February 2010",
  quantity: 60,
  inBottle,
  loose,
  remaining: inBottle + loose,
};

export const missingTablets = prescription.quantity - prescription.remaining;

// The theft at his work, in the news he kept reading
export const theft = { amount: "£4.2 million", headline: "£4.2m stolen from Halden Group vault" };

export const LAPTOP_PASSWORD = victim.son;
