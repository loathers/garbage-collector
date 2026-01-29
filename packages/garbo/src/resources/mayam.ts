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
import { effectValue } from "../potions";
import getExperienceFamiliars from "../familiar/experienceFamiliars";
import { felizValue } from "../lib";
import { GarboTask } from "../tasks/engine";
import { meatFamiliar } from "../familiar";
// Stats assigned a value of 1, to discern from the Truly Useless
// MP restore assigned a value of 2, because it's better than stats!
const MAYAM_RING_VALUES = {
  yam1: () => garboValue($item`yam`),
  sword: () => 1,
  vessel: () => 2,
  eye: () => effectValue($effect`Big Eyes`, 100),
  fur: () =>
    Math.max(
      0,
      ...getExperienceFamiliars("free").map(
        ({ expectedValue }) => expectedValue / 12,
      ),
    ) * 100,
  chair: () => (CinchoDeMayo.have() ? 3 * 5 * felizValue() : 0), // TODO Account for reaching a Yachtzee NC breakpoint
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
  return effectValue(result, 30);
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
        const leftmostIndex = Math.min(...group.map(resonanceIndex));
        return resonanceIndex(resonance) < leftmostIndex;
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
  return maxBy(
    new Array(MayamCalendar.remainingUses())
      .fill(null)
      .reduce<
        MayamCalendar.CombinationString[][]
      >((acc) => acc.flatMap((combinationGroup) => expandCombinationGroup(combinationGroup)), [[]]),
    (group) => sum(group, valueCombination),
  );
}

export function mayamCalendarSummon(): GarboTask {
  return {
    name: "Mayam Summons",
    completed: () => MayamCalendar.remainingUses() === 0,
    ready: () => MayamCalendar.have(),
    do: () => {
      const startingFamiliar = myFamiliar();
      for (const combination of getBestMayamCombinations()) {
        if (combination.includes("fur")) {
          const famList = getExperienceFamiliars("free");
          const bestFamiliar =
            famList.length > 0
              ? maxBy(famList, "expectedValue").familiar
              : meatFamiliar();
          useFamiliar(bestFamiliar);
        }
        MayamCalendar.submit(combination);
      }
      useFamiliar(startingFamiliar);
    },
    spendsTurn: false,
  };
}
