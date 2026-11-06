import { $effect, $item, EverfullDarts, have } from "libram";

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
