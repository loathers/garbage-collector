import { $familiar, get } from "libram";
import { globalOptions } from "../config";

export const mimicExperienceNeeded = () =>
  50 * (11 - get("_mimicEggsObtained")) + (globalOptions.ascend ? 0 : 550);

export function shouldChargeMimic(): boolean {
  /* If we can't make any more eggs tomorrow, don't charge the mimic more */
  return $familiar`Chest Mimic`.experience < mimicExperienceNeeded();
}

export function shouldMakeEgg(): boolean {
  return (
    $familiar`Chest Mimic`.experience / 50 >= 11 - get("_mimicEggsObtained") &&
    get("_mimicEggsObtained") < 11
  );
}
