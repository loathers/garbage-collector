import { $familiar, get } from "libram";

export function shouldChargeMimic(): boolean {
  /* If we can't make any more eggs tomorrow, don't charge the mimic more */
  return $familiar`Chest Mimic`.experience < 550;
}

export function shouldMakeEgg(): boolean {
  return (
    $familiar`Chest Mimic`.experience / 50 >= 11 - get("_mimicEggsObtained") &&
    get("_mimicEggsObtained") < 11
  );
}
