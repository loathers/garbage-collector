import { Outfit } from "grimoire-kolmafia";
import { Item, numericModifier, toSlot } from "kolmafia";
import { $item, $slot, get, getFoldGroup, have } from "libram";
import { globalOptions } from "../config";
import { estimatedGarboTurns } from "../turns";
import { BonusEquipMode } from "./lib";

let bestPantsAdventures: number;
const getBestPantsAdventures = () =>
  (bestPantsAdventures ??= Math.max(
    0,
    ...Item.all()
      .filter(
        (item) =>
          toSlot(item) === $slot`pants` &&
          have(item) &&
          numericModifier(item, "Adventures") > 0,
      )
      .map((pants) => numericModifier(pants, "Adventures")),
  ));

function cheeseBonus(mode: BonusEquipMode) {
  if (globalOptions.ascend) return 0;
  if (mode === BonusEquipMode.MEAT_TARGET) return 0;
  if (get("_stinkyCheeseCount") >= 100) return 0;
  if (!getFoldGroup($item`stinky cheese diaper`).some((item) => have(item))) {
    return 0;
  }
  if (estimatedGarboTurns() < 100 - get("_stinkyCheeseCount")) return 0;
  return get("valueOfAdventure") * (10 - getBestPantsAdventures()) * (1 / 100);
}

export function applyCheeseBonus(outfit: Outfit, mode: BonusEquipMode) {
  const bonus = cheeseBonus(mode);
  if (bonus > 0) outfit.modifier.push(`${bonus.toFixed(2)} stinky cheese`);
}
