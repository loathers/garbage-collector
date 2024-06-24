import { availableChoiceOptions, runChoice } from "kolmafia";

type DartPriority = {
  [key: string]: number;
};

export function main() {
  const dartPriority: DartPriority = {
    "Throw a second dart quickly": 60,
    "Deal 25-50% more damage": 800,
    "You are less impressed by bullseyes": 10,
    "25% Better bullseye targeting": 20,
    "Extra stats from stats targets": 40,
    "Butt awareness": 30,
    "Add Hot Damage": 1000,
    "Add Cold Damage": 1000,
    "Add Sleaze Damage": 1000,
    "Add Spooky Damage": 1000,
    "Add Stench Damage": 1000,
    "Expand your dart capacity by 1": 50,
    "Bullseyes do not impress you much": 9,
    "25% More Accurate bullseye targeting": 19,
    "Deal 25-50% extra damage": 10000,
    "Increase Dart Deleveling from deleveling targets": 100,
    "Deal 25-50% greater damage": 10000,
    "25% better chance to hit bullseyes": 18,
  };

  function getLowestPriorityOption(): number {
    const options = availableChoiceOptions();
    let lowestPriority = Infinity;
    let bestOptionKey: number = 1;

    for (const key in options) {
      if (Object.prototype.hasOwnProperty.call(options, key)) {
        const optionKey = Number(key);
        const option = options[optionKey];
        const priority = dartPriority[option];

        if (priority !== undefined && priority < lowestPriority) {
          lowestPriority = priority;
          bestOptionKey = optionKey;
        }
      }
    }

    return bestOptionKey;
  }

  runChoice(getLowestPriorityOption());
}
