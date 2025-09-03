import { $familiar, ChestMimic, get, SourceTerminal } from "libram";
import { globalOptions } from "../config";

export const mimicExperienceNeeded = (needKickstarterEgg: boolean) =>
  50 * (11 - get("_mimicEggsObtained")) +
  (globalOptions.ascend
    ? needKickstarterEgg &&
      !SourceTerminal.have() &&
      get("_mimicEggsObtained") < 11
      ? 50
      : 0
    : 550);

export function shouldChargeMimic(needKickstarterEgg: boolean): boolean {
  /* If we can't make any more eggs tomorrow, don't charge the mimic more */
  return (
    $familiar`Chest Mimic`.experience <
    mimicExperienceNeeded(needKickstarterEgg)
  );
}

let monsterInEggnet: boolean;
export const monsterIsInEggnet = () =>
  (monsterInEggnet ??= ChestMimic.getReceivableMonsters().includes(
    globalOptions.target,
  ));

export function shouldMakeEgg(barf: boolean): boolean {
  const needKickstarterEgg =
    barf && ChestMimic.differentiableQuantity(globalOptions.target) <= 0;
  if (needKickstarterEgg && !monsterIsInEggnet()) return false;
  const experienceNeeded =
    50 * (11 - get("_mimicEggsObtained")) + (needKickstarterEgg ? 50 : 0);
  return (
    $familiar`Chest Mimic`.experience >= experienceNeeded &&
    get("_mimicEggsObtained") < 11
  );
}

export const minimumMimicExperience = () =>
  50 + (ChestMimic.differentiableQuantity(globalOptions.target) ? 0 : 100);
