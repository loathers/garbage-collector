import { Item, myFamiliar, myLevel, useFamiliar } from "kolmafia";
import {
  $effect,
  $item,
  CinchoDeMayo,
  clamp,
  get,
  maxBy,
  MayamCalendar,
  Range,
  sum,
  Tuple,
} from "libram";
import { garboValue } from "../garboValue";
import { copyTargetCount } from "../target";
import { Potion } from "../potions";
import getExperienceFamiliars from "../familiar/experienceFamiliars";
import { felizValue } from "../lib";
import { GarboTask } from "../tasks/engine";
// Stats assigned a value of 1, to discern from the Truly Useless
// MP restore assigned a value of 2, because it's better than stats!
const MAYAM_RING_VALUES = {
  yam1: () => garboValue($item`yam`),
  sword: () => 1,
  vessel: () => 2,
  eye: () =>
    new Potion($item.none, { effect: $effect`Big Eyes`, duration: 100 }).gross(
      copyTargetCount(),
    ),
  fur: () =>
    Math.max(
      0,
      ...getExperienceFamiliars("free").map(
        ({ expectedValue }) => expectedValue / 12,
      ),
    ) * 100,
  chair: () => (CinchoDeMayo.have() ? 3 * 5 * felizValue() : 0),
  yam2: () => garboValue($item`yam`),
  lightning: () => 1,
  bottle: () => 0,
  wood: () => 0,
  wall: () => 0,
  cheese: () => garboValue($item`goat cheese`),
  eyepatch: () => 1,
  meat: () => clamp(myLevel() * 100, 100, 1500),
  yam3: () => garboValue($item`yam`),
  yam4: () => garboValue($item`yam`),
  explosion: () => 0,
  clock: () => 5 * get("valueOfAdventure"),
};

function valueSymbol(symbol: MayamCalendar.Glyph): number {
  return MAYAM_RING_VALUES[symbol]();
}

function valueResonance(combination: MayamCalendar.CombinationString): number {
  const result = MayamCalendar.getResonanceResult(combination);
  if (!result) return 0;
  if (result instanceof Item) {
    if (result === $item`yamtility belt`) return 0; // yamtilityValue();
    return garboValue(result);
  }
  return new Potion($item.none, { effect: result, duration: 30 }).gross(
    copyTargetCount(),
  );
}

function valueCombination(
  combination: MayamCalendar.CombinationString,
): number {
  return (
    sum(MayamCalendar.toCombination([combination]), valueSymbol) +
    valueResonance(combination)
  );
}

function getAvailableResonances(
  forbiddenSymbols: MayamCalendar.Glyph[],
): MayamCalendar.CombinationString[] {
  return MayamCalendar.RESONANCE_KEYS.filter(
    (combination) =>
      !MayamCalendar.toCombination([combination]).some((sym) =>
        forbiddenSymbols.includes(sym),
      ),
  );
}

function getBestAvailableSymbolFromRing<R extends Range<0, 4>>(
  ring: R,
  forbiddenSymbols: MayamCalendar.Glyph[],
): (typeof MayamCalendar.RINGS)[R][number] {
  return maxBy(
    MayamCalendar.RINGS[ring].filter((sym) => !forbiddenSymbols.includes(sym)),
    valueSymbol,
  );
}

function getBestGreedyCombination(
  forbiddenSymbols: MayamCalendar.Glyph[],
): MayamCalendar.CombinationString {
  return MayamCalendar.toCombinationString([
    getBestAvailableSymbolFromRing(0, forbiddenSymbols),
    getBestAvailableSymbolFromRing(1, forbiddenSymbols),
    getBestAvailableSymbolFromRing(2, forbiddenSymbols),
    getBestAvailableSymbolFromRing(3, forbiddenSymbols),
  ]);
}

const resonanceIndex = (resonance: string) =>
  (MayamCalendar.RESONANCE_KEYS as string[]).indexOf(resonance);

function expandCombinationGroup<N extends number>(
  group: Tuple<MayamCalendar.CombinationString, N>,
): [
  ...Tuple<MayamCalendar.CombinationString, N>,
  MayamCalendar.CombinationString,
][] {
  const forbiddenSymbols = [
    ...group.flatMap((combinationString) =>
      MayamCalendar.toCombination([combinationString]),
    ),
    ...MayamCalendar.symbolsUsed(),
  ];
  return [
    ...getAvailableResonances(forbiddenSymbols)
      .filter((resonance) => {
        const rightmostIndex = Math.max(...group.map(resonanceIndex));
        return resonanceIndex(resonance) > rightmostIndex;
      })
      .map(
        (resonance) =>
          [...group, resonance] as [
            ...Tuple<MayamCalendar.CombinationString, N>,
            MayamCalendar.CombinationString,
          ],
      ),
    [...group, getBestGreedyCombination(forbiddenSymbols)],
  ];
}

function getBestMayamCombinations(): MayamCalendar.CombinationString[] {
  const combinationGroups =
    // `reduce` misbehaves a lot when `any` shows its face
    new Array(MayamCalendar.remainingUses())
      .fill(null)
      .reduce<
        MayamCalendar.CombinationString[][]
      >((acc) => acc.flatMap((combinationGroup) => expandCombinationGroup(combinationGroup)), [[]]);
  return maxBy(combinationGroups, (group) => sum(group, valueCombination));
}

export const mayamCalendarSummon: GarboTask = {
  name: "Mayam Summons",
  completed: () => MayamCalendar.remainingUses() === 0,
  ready: () => MayamCalendar.have(),
  do: () => {
    const startingFamiliar = myFamiliar();
    for (const combination of getBestMayamCombinations()) {
      if (combination.includes("fur")) {
        const bestFamiliar = maxBy(
          getExperienceFamiliars("free"),
          "expectedValue",
        ).familiar;
        useFamiliar(bestFamiliar);
      }
      MayamCalendar.submit(combination);
    }
    useFamiliar(startingFamiliar);
  },
  spendsTurn: false,
};
