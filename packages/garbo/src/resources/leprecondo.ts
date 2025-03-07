import { Item } from "kolmafia";
import { $item, Leprecondo, maxBy, sum, Tuple } from "libram";
import { garboAverageValue, garboValue } from "../garboValue";
import { copyTargetCount } from "../target";
import { Potion } from "../potions";

function resultValue(result: Leprecondo.Result): number {
  if (result instanceof Item) return garboValue(result);
  if (Array.isArray(result)) return garboAverageValue(...result);
  return new Potion($item.none, result).gross(copyTargetCount());
}

/*
 * @returns Whether `a` is strictly better than `b`
 */
function strictlyBetterThan(
  a: Leprecondo.FurnitureStat,
  b: Leprecondo.FurnitureStat,
): boolean {
  return (Object.entries(b) as [Leprecondo.Need, Leprecondo.Result][]).every(
    ([need, result]) => {
      const other = a[need];
      if (!other) return false;
      if (resultValue(other) <= resultValue(result)) return false;
      return true;
    },
  );
}

function getStat(
  furniture: Leprecondo.FurniturePiece,
): Leprecondo.FurnitureStat {
  return Leprecondo.Furniture[furniture];
}

function getCoveredNeeds(
  furniture: Leprecondo.FurniturePiece,
): Leprecondo.Need[] {
  return Object.keys(getStat(furniture)) as Leprecondo.Need[];
}

function viableFurniture(): Leprecondo.FurniturePiece[] {
  const discovered = Leprecondo.discoveredFurniture();
  return [
    "empty",
    ...discovered.filter(
      (f, index) =>
        !discovered
          .slice(index)
          .some((futureFurniture) =>
            strictlyBetterThan(getStat(futureFurniture), getStat(f)),
          ),
    ),
  ];
}

type Combination = Tuple<Leprecondo.FurniturePiece, 4>;

function valueCombination(combo: Combination): number {
  const total = Leprecondo.furnitureBonuses(combo);
  return sum(Leprecondo.NEEDS, (need) =>
    resultValue(total[need] ?? $item.none),
  );
}

function buildCombination(
  combinations: Leprecondo.FurniturePiece[][],
  furniture: Leprecondo.FurniturePiece[],
): Leprecondo.FurniturePiece[][] {
  return combinations.flatMap((combination) => {
    const coveredNeeds = new Set(combination.flatMap(getCoveredNeeds));
    const plausibleFurniture = furniture.filter((f) =>
      getCoveredNeeds(f).some((need) => !coveredNeeds.has(need)),
    ); // Only furniture that cover at least one presently-uncovered need need apply
    return (
      plausibleFurniture.length ? plausibleFurniture : (["empty"] as const)
    ).map((furniture) => [...combination, furniture]);
  });
}

function getViableCombinations(): Combination[] {
  const furniture = viableFurniture();
  return Array(4)
    .fill(null)
    .reduce<Leprecondo.FurniturePiece[][]>(
      (acc) => buildCombination(acc, furniture),
      [],
    ) as Combination[];
}

function getBestCombination(): Combination {
  return maxBy(getViableCombinations(), valueCombination);
}
