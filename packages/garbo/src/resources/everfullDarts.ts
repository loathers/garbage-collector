import { $effect, $item, get, have } from "libram";

export const guaranteedBullseye = () =>
  get("everfullDartPerks").includes("25% Better bullseye targeting") &&
  get("everfullDartPerks").includes("25% More Accurate bullseye targeting") &&
  get("everfullDartPerks").includes("25% better chance to hit bullseyes");

export const DARTS_KILL_BEFORE_RUN = 5;

const dartLevelTooHigh = () =>
  get("everfullDartPerks").split(",").length >= DARTS_KILL_BEFORE_RUN;

export const safeToAttemptBullseye = () =>
  have($item`Everfull Dart Holster`) &&
  (guaranteedBullseye() ||
    ((have($item`spring shoes`) || have($item`Roman Candelabra`)) &&
      !dartLevelTooHigh()));

export const canBullseye = () =>
  !have($effect`Everything Looks Red`) &&
  (guaranteedBullseye() || !have($effect`Everything Looks Green`));
