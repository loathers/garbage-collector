import { $effect, $item, EverfullDarts, have } from "libram";

export const guaranteedBullseye = () => EverfullDarts.bullseyeChance() >= 1;

export const DARTS_KILL_BEFORE_RUN = 5;

const dartLevelTooHigh = () =>
  EverfullDarts.currentPerks().length >= DARTS_KILL_BEFORE_RUN;

export const safeToAttemptBullseye = () =>
  have($item`Everfull Dart Holster`) &&
  (guaranteedBullseye() || have($item`spring shoes`)) &&
  !dartLevelTooHigh();

export const canBullseye = () =>
  !have($effect`Everything Looks Red`) &&
  (guaranteedBullseye() || !have($effect`Everything Looks Green`));
