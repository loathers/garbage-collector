import { Item } from "kolmafia";
import { $item, $items, get } from "libram";
import { garboAverageValue } from "../../session";
import { BonusEquipMode, ignoreLimitedDrops, meatValue, toBonus } from "../lib";

function valueMayflower(mode: BonusEquipMode): number {
  const dropValue = ignoreLimitedDrops(mode)
    ? garboAverageValue(
        ...$items`tin magnolia, upsy daisy, lesser grodulated violet, half-orchid, begpwnia`
      ) * Math.max(0.01, 0.5 - get("_mayflowerDrops") * 0.11)
    : 0;
  const sporadicMeatValue = (meatValue(mode) * 40 * 0.125) / 100;
  return dropValue + sporadicMeatValue;
}
const mayflower = { item: $item`Mayflower bouquet`, value: valueMayflower, circumstantial: true };
export default (mode: BonusEquipMode, valueCircumstantialBonus: boolean): [Item, number] | null =>
  toBonus(mayflower, mode, valueCircumstantialBonus);
