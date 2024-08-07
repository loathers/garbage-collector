import { Item } from "kolmafia";
import {
  $item,
  flat,
  get,
  maxBy,
  MayamCalendar,
  Range,
  sum,
  Tuple,
} from "libram";
import { garboValue } from "../garboValue";
import { copyTargetCount } from "../embezzler";
import { Potion } from "../potions";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function valueSymbol(symbol: MayamCalendar.MayamSymbol): number {
  return 0;
}

function valueResonance(combination: MayamCalendar.Combination): number {
  const result = MayamCalendar.getResonanceResult(...combination);
  if (!result) return 0;
  if (result instanceof Item) {
    if (result === $item`yamtility belt`) return 0; // yamtilityValue();
    return garboValue(result);
  }
  return new Potion($item.none, { effect: result, duration: 30 }).gross(
    copyTargetCount(),
  );
}

function valueCombination(combination: MayamCalendar.Combination): number {
  return sum(combination, valueSymbol) + valueResonance(combination);
}

function getAvailableResonances(
  forbiddenSymbols: MayamCalendar.MayamSymbol[],
): MayamCalendar.Combination[] {
  return (
    Object.keys(MayamCalendar.RESONANCES) as MayamCalendar.CombinationString[]
  )
    .map((combination) => MayamCalendar.toCombination([combination]))
    .filter(
      (combination) =>
        !combination.some((sym) => forbiddenSymbols.includes(sym)),
    );
}

function getBestAvailableSymbolFromRing<R extends Range<0, 4>>(
  ring: R,
  forbiddenSymbols: MayamCalendar.MayamSymbol[],
): (typeof MayamCalendar.RINGS)[R][number] {
  return maxBy(
    MayamCalendar.RINGS[ring].filter((sym) => !forbiddenSymbols.includes(sym)),
    valueSymbol,
  );
}

function getBestGreedyCombination(
  forbiddenSymbols: MayamCalendar.MayamSymbol[],
): MayamCalendar.Combination {
  return [
    getBestAvailableSymbolFromRing(0, forbiddenSymbols),
    getBestAvailableSymbolFromRing(1, forbiddenSymbols),
    getBestAvailableSymbolFromRing(2, forbiddenSymbols),
    getBestAvailableSymbolFromRing(3, forbiddenSymbols),
  ];
}

function expandCombinationGroup<N extends number>(
  group: Tuple<MayamCalendar.Combination, N>,
): [...Tuple<MayamCalendar.Combination, N>, MayamCalendar.Combination][] {
  const usedSymbols = get("_mayamSymbolsUsed").split(
    ",",
  ) as MayamCalendar.MayamSymbol[];
  const forbiddenSymbols = [...flat(group), ...usedSymbols];
  return [
    ...getAvailableResonances(forbiddenSymbols).map(
      (resonance) =>
        [...group, resonance] as [
          ...Tuple<MayamCalendar.Combination, N>,
          MayamCalendar.Combination,
        ],
    ),
    [...group, getBestGreedyCombination(forbiddenSymbols)],
  ];
}

export function getBestMayamCombinations(): MayamCalendar.Combination[] {
  const needed = MayamCalendar.remainingUses();
  if (!needed) return [];
  const combinationGroups =
    // `reduce` misbehaves a lot when `any` shows its face
    (new Array(MayamCalendar.remainingUses()).fill(null) as null[]).reduce(
      (acc) => {
        const result = [] as MayamCalendar.Combination[][];
        for (const combinationGroup of acc) {
          result.push(...expandCombinationGroup(combinationGroup));
        }
        return result;
      },
      [] as MayamCalendar.Combination[][],
    );

  return maxBy(combinationGroups, (group) => sum(group, valueCombination));
}
