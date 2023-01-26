import { Item, mallPrice } from "kolmafia";
import { $item, $items, get, getAverageAdventures } from "libram";
import { globalOptions } from "../../config";
import { mallMin } from "../../diet";
import { BonusEquipMode, toBonus, VOA } from "../lib";

function designerSweatpantsValue(mode: BonusEquipMode): number {
  if (mode === BonusEquipMode.EMBEZZLER) return 0;

  const needSweat =
    (!globalOptions.ascend && get("sweat", 0) < 75) ||
    get("sweat", 0) < 25 * (3 - get("_sweatOutSomeBoozeUsed", 0));

  if (!needSweat) return 0;

  const bestPerfectDrink = mallMin(
    $items`perfect cosmopolitan, perfect negroni, perfect dark and stormy, perfect mimosa, perfect old-fashioned, perfect paloma`
  );
  const perfectDrinkValuePerDrunk =
    ((getAverageAdventures(bestPerfectDrink) + 3) * VOA - mallPrice(bestPerfectDrink)) / 3;
  const splendidMartiniValuePerDrunk = (getAverageAdventures($item`splendid martini`) + 2) * VOA;

  return (Math.max(perfectDrinkValuePerDrunk, splendidMartiniValuePerDrunk) * 2) / 25;
}

const designerSweatpants = { item: $item`designer sweatpants`, value: designerSweatpantsValue };
export default (mode: BonusEquipMode): [Item, number] | null => toBonus(designerSweatpants, mode);
