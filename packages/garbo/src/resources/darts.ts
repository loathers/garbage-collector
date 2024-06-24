import { $effect, $item, get, have } from "libram";

export const guaranteedBullseye = () =>
  get("everfullDartPerks").includes("25% Better bullseye targeting") &&
  get("everfullDartPerks").includes("25% More Accurate bullseye targeting") &&
  get("everfullDartPerks").includes("25% better chance to hit bullseyes");

export const safeToAttemptBullseye = () =>
  guaranteedBullseye()
    ? have($item`Everfull Dart Holster`)
    : have($item`Everfull Dart Holster`) && have($item`spring shoes`);

export const canBullseye = () =>
  guaranteedBullseye()
    ? have($effect`Everything Looks Red`)
    : have($effect`Everything Looks Red`) ||
      have($effect`Everything Looks Green`);

export const DARTS_KILL_BEFORE_RUN = 5;

export const dartLevelTooHigh = () =>
  get("everfullDartPerks").split(",").length >= DARTS_KILL_BEFORE_RUN;
