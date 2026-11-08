import { itemDropsArray } from "kolmafia";
import { clamp, get, maxBy, sum } from "libram";
import { garboValue } from "../garboValue";
import { expectedDropValue } from "../lib";

export function swordItemDropObjective(farmingItemDropValue: number): {
  valuePerItemDrop: number;
  maximumItemDrop?: number;
} {
  const copiedMonster = get("swordOfSWordsMonster");
  if (!copiedMonster) return { valuePerItemDrop: farmingItemDropValue };
  const positiveRateDrops = itemDropsArray(copiedMonster).filter(
    ({ rate }) => rate > 0,
  );
  if (!positiveRateDrops.length) return { valuePerItemDrop: 0 };
  const { rate: mostValuableItemRate } = maxBy(positiveRateDrops, ({ drop }) =>
    garboValue(drop),
  );
  return {
    valuePerItemDrop: expectedDropValue(copiedMonster),
    maximumItemDrop: Math.ceil(100 * (100 / mostValuableItemRate - 1)),
  };
}

export function swordDropValue(itemDrop: number): number {
  const copiedMonster = get("swordOfSWordsMonster");
  if (!copiedMonster) return 0;
  return sum(
    itemDropsArray(copiedMonster),
    ({ rate, drop }) =>
      (clamp((rate * (100 + itemDrop)) / 100, 0, 100) * garboValue(drop)) / 100,
  );
}
