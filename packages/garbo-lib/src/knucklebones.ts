import { closetAmount, Item, itemAmount, storageAmount } from "kolmafia";
import { $item } from "libram";

import { dailySpecials } from "./knuckleboneRewards";

/**
 * Value the next knucklebone after reserving enough for two of each better
 * daily special. Prices are evaluated lazily and cached; current bone balance
 * is read on each call.
 * This models one rotation of the special pool, without forecasting future drops.
 *
 * @param value Value function for a tradeable reward.
 * @returns A knucklebone valuation function, with an optional arg for available bones.
 */
export function makeKnuckleboneValue(
  value: (item: Item) => number,
): (bones?: number) => number {
  let rewards: { cost: number; meatPerBone: number }[] | undefined;

  return (
    bones = itemAmount($item`knucklebone`) +
      closetAmount($item`knucklebone`) +
      storageAmount($item`knucklebone`),
  ) => {
    rewards ??= Object.values(dailySpecials)
      .flatMap(({ min, max, items }) => {
        const cost = (min + max) / 2;

        return Item.get(items)
          .filter((item) => item.tradeable)
          .map((item) => ({ cost, meatPerBone: value(item) / cost }));
      })
      .filter(({ meatPerBone }) => meatPerBone > 0)
      .sort((a, b) => b.meatPerBone - a.meatPerBone);

    for (const { cost, meatPerBone } of rewards) {
      if (bones < 2 * cost) return meatPerBone;
      bones -= 2 * cost;
    }
    return 0;
  };
}
