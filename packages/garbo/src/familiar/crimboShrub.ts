import { inebrietyLimit, myInebriety } from "kolmafia";
import { $effect, $familiar, $skill, get, have } from "libram";
import { canBullseye, safeToAttemptBullseye } from "../resources/everfullDarts";

export function canOpenRedPresent(): boolean {
  return (
    have($familiar`Crimbo Shrub`) &&
    !have($effect`Everything Looks Red`) &&
    !have($skill`Free-For-All`) &&
    !(safeToAttemptBullseye() && canBullseye()) &&
    get("shrubGifts") === "meat" &&
    myInebriety() <= inebrietyLimit()
  );
}
