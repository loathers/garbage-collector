import { availableChoiceOptions, runChoice } from "kolmafia";

export function main(choice) {
  const options = availableChoiceOptions();
  let priority;
  let top, pick;

  // Everfull dart handling
  switch (choice) {
    default:
      return;

    case 1525:
      priority = {
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
      top = Number.MAX_SAFE_INTEGER;
      pick = 1;

      options.forEach((option, index) => {
        if (priority[option] < top) {
          top = priority[option];
          pick = index;
        }
      });
      runChoice(pick);
      break;
  }
}
