import { Item, numericModifier, toSlot } from "kolmafia";
import { $item, $slot, get, getFoldGroup, have } from "libram";
import { globalOptions } from "../../config";
import { estimatedTurns } from "../../turns";
import { BonusEquipMode, VOA } from "../lib";

const cheeses = getFoldGroup($item`stinky cheese diaper`);
const bestAdventuresFromPants = Math.max(
  0,
  ...Item.all()
    .filter(
      (item) =>
        toSlot(item) === $slot`pants` && have(item) && numericModifier(item, "Adventures") > 0
    )
    .map((pants) => numericModifier(pants, "Adventures"))
);
const haveCheese = cheeses.some((item) => have(item));

export default function (mode: BonusEquipMode): [Item, number][] {
  if (
    !haveCheese ||
    globalOptions.ascend ||
    get("_stinkyCheeseCount") >= 100 ||
    estimatedTurns() < 100 - get("_stinkyCheeseCount") ||
    mode === BonusEquipMode.EMBEZZLER
  ) {
    return [];
  }

  return cheeses
    .filter((item) => toSlot(item) !== $slot`weapon`)
    .map((cheese) => [cheese, (VOA * (10 - bestAdventuresFromPants)) / 100]);
}
