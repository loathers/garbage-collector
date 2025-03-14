import { Item } from "kolmafia";
import { arrayEquals, get, Leprecondo, maxBy, sum, Tuple } from "libram";
import { garboAverageValue, garboValue } from "../garboValue";
import { effectValue } from "../potions";
import { GarboTask } from "../tasks/engine";

function resultValue(result: Leprecondo.Result): number {
  if (result instanceof Item) return garboValue(result);
  if (Array.isArray(result)) return garboAverageValue(...result);
  return effectValue(result.effect, result.duration);
}

type ValuedFurniture = {
  furniture: Leprecondo.FurniturePiece;
  values: Partial<Record<Leprecondo.Need, number>>;
};

/*
 * @returns Whether `a` is strictly better than `b`
 */
function strictlyBetterThan(a: ValuedFurniture, b: ValuedFurniture): boolean {
  return Leprecondo.NEEDS.every((need) => {
    const result = b.values[need];
    if (result === undefined) return true;
    const other = a.values[need];
    if (other === undefined) return false;
    if (other <= result) return false;
    return true;
  });
}

function getCoveredNeeds({ furniture }: ValuedFurniture): Leprecondo.Need[] {
  return Object.keys(Leprecondo.getStats(furniture)) as Leprecondo.Need[];
}

function viableFurniture(): {
  furniture: Leprecondo.FurniturePiece;
  values: Partial<Record<Leprecondo.Need, number>>;
}[] {
  const discovered = Leprecondo.discoveredFurniture();
  return [
    { furniture: "empty", values: {} },
    ...discovered
      .map((furniture) => ({
        furniture,
        values: Object.fromEntries(
          Object.entries(Leprecondo.getStats(furniture)).map(
            ([need, result]): [Leprecondo.Need, number] => [
              need as Leprecondo.Need,
              resultValue(result),
            ],
          ),
        ),
      }))
      .filter(
        (f, index, valuedDiscoveries) =>
          !valuedDiscoveries
            .slice(index)
            .some((futureFurniture) => strictlyBetterThan(futureFurniture, f)),
      ),
  ];
}

type Combination = Tuple<ValuedFurniture, 4>;

function valueCombination(combo: Combination): number {
  const total = combo.reduce<ValuedFurniture["values"]>(
    (acc, { values }) => ({ ...values, ...acc }),
    {},
  );
  return sum(Leprecondo.NEEDS, (need) => total[need] ?? 0);
}

function buildCombination<L extends number>(
  combinations: Tuple<ValuedFurniture, L>[],
  furniture: ValuedFurniture[],
): [...Tuple<ValuedFurniture, L>, ValuedFurniture][] {
  return combinations.flatMap((combination) => {
    const coveredNeeds = new Set(combination.flatMap(getCoveredNeeds));
    const plausibleFurniture = furniture.filter((f) =>
      getCoveredNeeds(f).some((need) => !coveredNeeds.has(need)),
    ); // Only furniture that cover at least one presently-uncovered need need apply
    return (
      plausibleFurniture.length
        ? plausibleFurniture
        : ([{ furniture: "empty", values: {} }] as const)
    ).map((furniture): [...Tuple<ValuedFurniture, L>, ValuedFurniture] => [
      ...combination,
      furniture,
    ]);
  });
}

function getViableCombinations(): Tuple<ValuedFurniture, 4>[] {
  const furniture = viableFurniture();
  return Array(4)
    .fill(null)
    .reduce<ValuedFurniture[][]>(
      (acc) => buildCombination(acc, furniture),
      [[]],
    ) as Combination[];
}

type FurnitureCombination = Tuple<Leprecondo.FurniturePiece, 4>;
function findBestCombination(): FurnitureCombination {
  return maxBy(getViableCombinations(), valueCombination).map(
    ({ furniture }) => furniture,
  ) as FurnitureCombination;
}

let bestCombination: FurnitureCombination;
let unlocked: string;
function getBestLeprecondoCombination(): FurnitureCombination {
  if (unlocked !== get("leprecondoDiscovered")) {
    unlocked = get("leprecondoDiscovered");
    bestCombination = findBestCombination();
  }
  return bestCombination;
}

export function leprecondoTask(): GarboTask {
  return {
    name: "Configure Leprecondo",
    ready: () => Leprecondo.have() && Leprecondo.rearrangesRemaining() > 0,
    completed: () =>
      arrayEquals(
        Leprecondo.installedFurniture(),
        getBestLeprecondoCombination(),
      ),
    do: () => Leprecondo.setFurniture(...getBestLeprecondoCombination()),
    spendsTurn: false,
  };
}
