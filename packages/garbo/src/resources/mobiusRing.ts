/* eslint-disable libram/verify-constants */
import { Effect, Item } from "kolmafia";
import { $effect, $item, maxBy } from "libram";
import { garboValue } from "../garboValue";

export type MobiusChoice = {
  name: string;
  outcome: Item | Effect | number | null;
};

type MobiusPair = {
  choice1: string;
  choice2: string;
};

const MOBIUS_PAIRS: MobiusPair[] = [
  {
    choice1: "Borrow a cup of sugar from yourself",
    choice2: "Return the sugar you borrowed",
  },
  { choice1: "Draw a goatee on yourself", choice2: "Succumb to evil" },
  {
    choice1: "Stop your Arch-Nemesis as a baby",
    choice2: "Go back and make the Naughty Sorceress naughty again",
  },
  { choice1: "Defend Yourself", choice2: "Assassinate Yourself" },
  {
    choice1: "Take the long odds on the trifecta",
    choice2: "Fix the race and also fix the race.",
  },
  {
    choice1: "Plant some seeds in the distant past",
    choice2: "Chop down some trees",
  },
  {
    choice1: "Give your past self some investment tips",
    choice2: "Steal from your future self",
  },
  {
    choice1: "Steal a cupcake from young Susie",
    choice2: "Bake Susie a cupcake",
  },
  {
    choice1: "Play Schroedinger's Prank on yourself",
    choice2: "Check your pocket",
  },
  { choice1: "Shoot yourself in the foot", choice2: "Get shot in the foot" },
  {
    choice1: "Meet your parents when they were young",
    choice2: "Fix your parents' relationship",
  },
  {
    choice1: "Go back and take a 20-year-long nap",
    choice2: "Go back and set an alarm",
  },
  {
    choice1: "Lift yourself up by your bootstraps",
    choice2: "Let yourself get lifted up by your bootstraps",
  },
  {
    choice1: "Go back and write a best-seller.",
    choice2: "Replace your novel with AI drivel",
  },
  { choice1: "Peek in on your future.", choice2: "Make yourself forget" },
  {
    choice1: "Steal a club from the past.",
    choice2: "Prevent the deadly seal invasion",
  },
  {
    choice1: "Mind your own business",
    choice2: "Sit and write in your journal",
  },
  {
    choice1: "Plant some trees and harvest them in the future",
    choice2: "Teach hippies to make jams and jellies",
  },
  {
    choice1: "Go for a nature walk",
    choice2: "Go back in time and kill a butterfly",
  },
  { choice1: "Hey, free gun!", choice2: "Sell the gun" },
  {
    choice1: "Make friends with a famous poet.",
    choice2: "Make enemies with a famous poet.",
  },
  { choice1: "Cheeze it, it's the pigs!", choice2: "Aiding and abetterment" },
  {
    choice1: "Borrow meat from your future.",
    choice2: "Repay yourself in the past",
  },
];

const mobiusChoices: MobiusChoice[] = [
  { name: "I'm not messing with the timeline!", outcome: null },
  { name: "Borrow a cup of sugar from yourself", outcome: $item`cup of sugar` },
  { name: "Return the sugar you borrowed", outcome: $effect`Sugar Debt` },
  { name: "Draw a goatee on yourself", outcome: $effect`Merry Prankster` },
  { name: "Succumb to evil", outcome: $effect`Evil` },
  {
    name: "Make friends with a famous poet",
    outcome: $effect`Just the Best Anapests`,
  },
  { name: "Make enemies with a famous poet", outcome: $item`fancy old wine` },
  {
    name: "Go back and take a 20-year-long nap",
    outcome: $effect`Older than You Look`,
  },
  { name: "Go back and set an alarm", outcome: $item`clock` },
  { name: "Go for a nature walk", outcome: $effect`Stricken by Lightning` },
  {
    name: "Go back in time and kill a butterfly",
    outcome: $effect`Hint of Bacon`,
  },
  { name: "Cheeze it, it's the pigs!", outcome: $effect`Very Old` },
  { name: "Aiding and abetterment", outcome: $effect`Scot Free` },
  { name: "Plant some trees and harvest them in the future", outcome: null },
  {
    name: "Teach hippies to make jams and jellies",
    outcome: $item`mixed berry jelly`,
  },
  {
    name: "Plant some seeds in the distant past",
    outcome: $effect`Raised on Fresh Air`,
  },
  { name: "Chop down some trees", outcome: $item`morningwood plank` },
  {
    name: "Play Schroedinger's Prank on yourself",
    outcome: $effect`Schroedinger's Anticipation`,
  },
  { name: "Check your pocket", outcome: $effect`Neither Alive nor Dead` },
  { name: "Steal a club from the past", outcome: null },
  { name: "Prevent the deadly seal invasion", outcome: 500 },
  { name: "Borrow meat from your future", outcome: 1000 },
  { name: "Repay yourself in the past", outcome: $effect`Gaining Interest` },
  { name: "Mind your own business", outcome: null },
  { name: "Sit and write in your journal", outcome: $effect`Paranoia` },
  {
    name: "Take the long odds on the trifecta",
    outcome: $effect`Marked by the Don`,
  },
  {
    name: "Fix the race and also fix the race",
    outcome: $effect`Favored by the Don`,
  },
  { name: "Go back and write a best-seller.", outcome: $effect`Famous` },
  { name: "Replace your novel with AI drivel", outcome: $effect`Care Free` },
  { name: "Lift yourself up by your bootstraps", outcome: null },
  {
    name: "Let yourself get lifted up by your bootstraps",
    outcome: $effect`Lifted by your Bootstraps`,
  },
  { name: "Shoot yourself in the foot", outcome: null },
  { name: "Get shot in the foot", outcome: $effect`Trailing Blood` },
  {
    name: "Give your past self investment tips",
    outcome: $item`Stock Certificate`,
  },
  { name: "Steal from your future self", outcome: null },
  { name: "Peek in on your future", outcome: $effect`Forearmed` },
  { name: "Make yourself forget", outcome: $effect`Beaten Up` },
  { name: "Defend yourself", outcome: $effect`Paranoia` },
  { name: "Assassinate yourself", outcome: null },
  {
    name: "Stop your arch-nemesis as a baby",
    outcome: $item`Life Goals Pamphlet`,
  },
  {
    name: "Go back and make the Naughty Sorceress naughty again",
    outcome: $item`bully badge`,
  },
  { name: "Steal a cupcake from young Susie", outcome: $item`Susie's cupcake` },
  { name: "Bake Susie a cupcake", outcome: $effect`Good Feelings` },
  { name: "Hey, free gun!", outcome: $item`the gun` },
  { name: "Sell the gun", outcome: 2546 },
  {
    name: "Meet your parents when they were young",
    outcome: $effect`Your Own Parents`,
  },
  { name: "Fix your parents' relationship", outcome: $effect`Met Cute` },
];

function valueMobiusChoice(choice: MobiusChoice): number {
  let baseValue = 0;
  if (typeof choice.outcome === "number") baseValue = choice.outcome;
  else if (choice.outcome instanceof Item) {
    baseValue = garboValue(choice.outcome);
  }

  for (const pair of MOBIUS_PAIRS) {
    if (choice.name === pair.choice1) {
      const second = mobiusChoices.find((c) => c.name === pair.choice2);
      if (second) baseValue += valueMobiusChoice(second) / 2;
    }
  }
  return baseValue;
}

export function mobiusChoice(options: { [key: number]: string }): number {
  const best = maxBy(Object.entries(options), ([, name]) => {
    const choice = mobiusChoices.find((c) => c.name === name);
    if (!choice) return -1;
    return valueMobiusChoice(choice);
  });
  return best ? parseInt(best[0]) : -1;
}

export const encounterMap = [
      4,   // 0
      7,   // 1
      14,  // 2
      14,  // 3
      25,  // 4
      25,  // 5
      41,  // 6
      41,  // 7
      41,  // 8
      41,  // 9
      41,  // 10
      51,  // 11
      51,  // 12
      51,  // 13
      51,  // 14
      51,  // 15
      51,  // 16
      51,  // 17
      51   // 18
    ];
