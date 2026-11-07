import { $effect, $item, EverfullDarts, have } from "libram";
import { globalOptions } from "../config";
import { bumperAvailable, bumperFuelCost } from "./asdonMartin";

export const guaranteedBullseye = () => EverfullDarts.bullseyeChance() === 1;

const DARTS_KILL_BEFORE_RUN = 5;

const dartLevelTooHigh = () =>
  EverfullDarts.currentPerks().length >= DARTS_KILL_BEFORE_RUN;

export const safeToAttemptBullseye = () =>
  EverfullDarts.have() &&
  (guaranteedBullseye() ||
    ((have($item`spring shoes`) || have($item`Roman Candelabra`)) &&
      !dartLevelTooHigh()));

export const canBullseye = () =>
  !have($effect`Everything Looks Red`) &&
  (guaranteedBullseye() || !have($effect`Everything Looks Green`));

export function shouldBumperBullseye(): boolean {
  if (
    !EverfullDarts.have() ||
    guaranteedBullseye() ||
    dartLevelTooHigh() ||
    have($effect`Everything Looks Red`) ||
    !bumperAvailable()
  ) {
    return false;
  }
  const bullseyeChance = EverfullDarts.bullseyeChance();
  // Fuel is consumed only after a miss; green cooldown does not block the bumper.
  return (
    bullseyeChance * globalOptions.prefs.valueOfFreeFight >
    (1 - bullseyeChance) * bumperFuelCost()
  );
}
