import { availableChoiceOptions, runChoice } from "kolmafia";
import { maxBy } from "libram";

type DartPerk = {
  Perk: string;
  Rank: number;
};

const dartPriority: DartPerk[] = [
  { Perk: "Throw a second dart quickly", Rank: 8 },
  { Perk: "Deal 25-50% more damage", Rank: 16 },
  { Perk: "You are less impressed by bullseyes", Rank: 2 },
  { Perk: "25% Better bullseye targeting", Rank: 5 },
  { Perk: "Extra stats from stats targets", Rank: 6 },
  { Perk: "Butt awareness", Rank: 9 },
  { Perk: "Add Hot Damage", Rank: 11 },
  { Perk: "Add Cold Damage", Rank: 12 },
  { Perk: "Add Sleaze Damage", Rank: 13 },
  { Perk: "Add Spooky Damage", Rank: 14 },
  { Perk: "Add Stench Damage", Rank: 15 },
  { Perk: "Expand your dart capacity by 1", Rank: 7 },
  { Perk: "Bullseyes do not impress you much", Rank: 1 },
  { Perk: "25% More Accurate bullseye targeting", Rank: 4 },
  { Perk: "Deal 25-50% extra damage", Rank: 17 },
  { Perk: "Increase Dart Deleveling from deleveling targets", Rank: 10 },
  { Perk: "Deal 25-50% greater damage", Rank: 18 },
  { Perk: "25% better chance to hit bullseyes", Rank: 3 },
];

function highestPriorityOption(choices: { [key: number]: string }) {
  const perkRanks = dartPriority.reduce(
    (acc, perk) => {
      acc[perk.Perk] = perk.Rank;
      return acc;
    },
    {} as { [key: string]: number },
  );

  // Create an array of [choice number, rank] pairs
  const validChoices = Object.entries(choices)
    .filter(([choiceText]) => choiceText in perkRanks)
    .map(([choiceNumber, choiceText]) => ({
      choiceNumber: parseInt(choiceNumber),
      rank: perkRanks[choiceText],
    }));

  // Use maxBy to find the choice with the lowest rank (highest priority)
  const bestChoice = maxBy(validChoices, (choice) => -choice.rank);

  return bestChoice.choiceNumber;
}

export function main() {
  const options = availableChoiceOptions();

  runChoice(highestPriorityOption(options));
}
