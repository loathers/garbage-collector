import { availableChoiceOptions, runChoice } from "kolmafia";
import { maxBy } from "libram";

const DART_PERKS: string[] = [
  "Bullseyes do not impress you much",
  "You are less impressed by bullseyes",
  "25% better chance to hit bullseyes",
  "25% More Accurate bullseye targeting",
  "25% Better bullseye targeting",
  "Extra stats from stats targets",
  "Expand your dart capacity by 1",
  "Throw a second dart quickly",
  "Butt awareness",
  "Increase Dart Deleveling from deleveling targets",
  "Add Hot Damage",
  "Add Cold Damage",
  "Add Sleaze Damage",
  "Add Spooky Damage",
  "Add Stench Damage",
  "Deal 25-50% more damage",
  "Deal 25-50% extra damage",
  "Deal 25-50% greater damage",
];

function highestPriorityOption() {
  const options = availableChoiceOptions();

  // Use maxBy to find the choice with the lowest rank (highest priority)
  const bestChoice = maxBy(
    Object.entries(options),
    ([, text]) =>
      DART_PERKS.includes(text) ? DART_PERKS.indexOf(text) : Infinity,
    true,
  )[0];
  const choiceNum = options[bestChoice];

  return choiceNum;
}

export function main() {
  runChoice(highestPriorityOption());
}
