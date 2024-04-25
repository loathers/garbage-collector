import { Monster, myAdventures, visitUrl } from "kolmafia";
import { $familiar, $item, get, have } from "libram";
import { globalOptions } from "../config";

export function canDifferentiateMonster(monster: Monster): number {
  if (!have($item`mimic egg`)) return 0;
  const regex = new RegExp(`${monster.name}\\s*(?:\\((\\d+)\\))?`, "i");
  const page = visitUrl(`desc_item.php?whichitem=646626465`, false, true);
  const match = page.match(regex);
  if (!match) {
    visitUrl("main.php");
    return 0;
  }
  visitUrl("main.php");
  return parseInt(match[1]) || 1;
}

export function shouldChargeMimic(): boolean {
  return (
    ((canDifferentiateMonster(globalOptions.target) &&
      $familiar`Chest Mimic`.experience / 50 >=
        11 - get("_mimicEggsObtained")) ||
      (myAdventures() === 1 && $familiar`Chest Mimic`.experience / 100 >= 1)) &&
    get("_mimicEggsObtained") < 11
  );
}

export function shouldMakeEgg(): boolean {
  return (
    $familiar`Chest Mimic`.experience / 50 >= 11 - get("_mimicEggsObtained") &&
    get("_mimicEggsObtained") < 11
  );
}
