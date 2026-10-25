import banana from "../../../assets/images/objects/banana.png";
import beer from "../../../assets/images/objects/beer.png";
import toyCar from "../../../assets/images/objects/toy-car.png";
import cassette from "../../../assets/images/objects/cassette.png";
import key from "../../../assets/images/objects/key.png";
import lighter from "../../../assets/images/objects/lighter.png";

// Nothing gives these out yet; names and descriptions are placeholders
const items = [
  {
    id: "banana",
    name: "Banana",
    description: "A banana, just starting to go brown.",
    sprite: banana,
  },
  {
    id: "beer",
    name: "Can of beer",
    description: "A warm can of lager. Not the time, Frank.",
    sprite: beer,
  },
  {
    id: "toy-car",
    name: "Toy car",
    description: "A little red die-cast car, the paint chipped off its bonnet.",
    sprite: toyCar,
  },
  {
    id: "cassette",
    name: "Cassette tape",
    description: "A C90 with no case. The label just says 'MIX', in biro.",
    sprite: cassette,
  },
  {
    id: "key",
    name: "Door key",
    description: "A brass Yale key on its own, no fob. Somebody's front door.",
    sprite: key,
  },
  {
    id: "lighter",
    name: "Lighter",
    description: "A blue disposable lighter, nearly out of gas.",
    sprite: lighter,
  },
];

export const inventoryItems = Object.fromEntries(items.map((item) => [item.id, item]));
