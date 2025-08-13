import { availableChoiceOptions, Effect, Item } from "kolmafia";
import { $effect, $item, getSaleValue, maxBy, ValueOf } from "libram";

const MOBIUS_PAIRS = {
  "Borrow a cup of sugar from yourself": "Return the sugar you borrowed",
  "Draw a goatee on yourself": "Succumb to evil",
  "Stop your Arch-Nemesis as a baby":
    "Go back and make the Naughty Sorceress naughty again",
  "Defend Yourself": "Assassinate Yourself",
  "Take the long odds on the trifecta": "Fix the race and also fix the race.",
  "Plant some seeds in the distant past": "Chop down some trees",
  "Give your past self some investment tips": "Steal from your future self",
  "Steal a cupcake from young Susie": "Bake Susie a cupcake",
  "Play Schroedinger's Prank on yourself": "Check your pocket",
  "Shoot yourself in the foot": "Get shot in the foot",
  "Meet your parents when they were young": "Fix your parents' relationship",
  "Go back and take a 20-year-long nap": "Go back and set an alarm",
  "Lift yourself up by your bootstraps":
    "Let yourself get lifted up by your bootstraps",
  "Go back and write a best-seller.": "Replace your novel with AI drivel",
  "Peek in on your future.": "Make yourself forget",
  "Steal a club from the past.": "Prevent the deadly seal invasion",
  "Mind your own business": "Sit and write in your journal",
  "Plant some trees and harvest them in the future":
    "Teach hippies to make jams and jellies",
  "Go for a nature walk": "Go back in time and kill a butterfly",
  "Hey, free gun!": "Sell the gun",
  "Make friends with a famous poet.": "Make enemies with a famous poet.",
  "Cheeze it, it's the pigs!": "Aiding and abetterment",
  "Borrow meat from your future.": "Repay yourself in the past",
  "I'm not messing with the timeline!": "I'm not messing with the timeline!",
} as const;

type MobiusOption = keyof typeof MOBIUS_PAIRS | ValueOf<typeof MOBIUS_PAIRS>;
type MobiusResult = Item | Effect | number | null;
function valueMobiusResult(result: MobiusResult): number {
  if (result === null) return 0;
  if (typeof result === "number") return result;
  if (result instanceof Item) return getSaleValue(result);
  return 0; // Effects currently unvalued
}
const MOBIUS_VALUES: Record<MobiusOption, MobiusResult> = {
  "I'm not messing with the timeline!": null,
  "Borrow a cup of sugar from yourself": $item`cup of sugar`,
  "Return the sugar you borrowed": $effect`Sugar Debt`,
  "Draw a goatee on yourself": $effect`Merry Prankster`,
  "Succumb to evil": $effect`Evil`,
  "Make friends with a famous poet.": $effect`Just the Best Anapests`,
  "Make enemies with a famous poet.": $item`fancy old wine`,
  "Go back and take a 20-year-long nap": $effect`Older than You Look`,
  "Go back and set an alarm": $item`clock`,
  "Go for a nature walk": $effect`Stricken by Lightning`,
  "Go back in time and kill a butterfly": $effect`Hint of Bacon`,
  "Cheeze it, it's the pigs!": $effect`Very Old`,
  "Aiding and abetterment": $effect`Scot Free`,
  "Plant some trees and harvest them in the future": null,
  "Teach hippies to make jams and jellies": $item`mixed berry jelly`,
  "Plant some seeds in the distant past": $effect`Raised on Fresh Air`,
  "Chop down some trees": $item`morningwood plank`,
  "Play Schroedinger's Prank on yourself": $effect`Schroedinger's Anticipation`,
  "Check your pocket": $effect`Neither Alive nor Dead`,
  "Steal a club from the past.": null,
  "Prevent the deadly seal invasion": 500,
  "Borrow meat from your future.": 1000,
  "Repay yourself in the past": $effect`Gaining Interest`,
  "Mind your own business": null,
  "Sit and write in your journal": $effect`Paranoia`,
  "Take the long odds on the trifecta": $effect`Marked by the Don`,
  "Fix the race and also fix the race.": $effect`Favored by the Don`,
  "Go back and write a best-seller.": $effect`Famous`,
  "Replace your novel with AI drivel": $effect`Care Free`,
  "Lift yourself up by your bootstraps": null,
  "Let yourself get lifted up by your bootstraps": $effect`Lifted by your Bootstraps`,
  "Shoot yourself in the foot": null,
  "Get shot in the foot": $effect`Trailing Blood`,
  "Give your past self some investment tips": $item`Stock Certificate`,
  "Steal from your future self": null,
  "Peek in on your future.": $effect`Forearmed`,
  "Make yourself forget": $effect`Beaten Up`,
  "Defend Yourself": $effect`Paranoia`,
  "Assassinate Yourself": null,
  "Stop your Arch-Nemesis as a baby": $item`Life Goals Pamphlet`,
  "Go back and make the Naughty Sorceress naughty again": $item`bully badge`,
  "Steal a cupcake from young Susie": $item`Susie's cupcake`,
  "Bake Susie a cupcake": $effect`Good Feelings`,
  "Hey, free gun!": $item`the gun`,
  "Sell the gun": 2546,
  "Meet your parents when they were young": $effect`Your Own Parents`,
  "Fix your parents' relationship": $effect`Met Cute`,
};

function valueMobiusChoice(choice: MobiusOption): number {
  const baseValue = valueMobiusResult(MOBIUS_VALUES[choice]);
  const resolution = MOBIUS_PAIRS[choice as keyof typeof MOBIUS_PAIRS];
  const resolutionValue = resolution
    ? valueMobiusResult(MOBIUS_VALUES[choice]) / 2
    : 0;
  return baseValue + resolutionValue;
}

export function getBestMobiusOption(): number {
  return Number(
    maxBy(
      Object.entries(availableChoiceOptions()) as [string, MobiusOption][],
      ([, name]) => valueMobiusChoice(name),
    )[0],
  );
}
