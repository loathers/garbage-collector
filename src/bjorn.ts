import { Modifiers } from "libram/dist/modifier";
import {
  createRiderMode,
  FamiliarRider,
  pickRider,
} from "libram/dist/resources/2010/CrownOfThrones";
import { meatFamiliar } from "./familiar";
import { baseMeat, BonusEquipMode, fairyMultiplier, leprechaunMultiplier } from "./lib";

/**
 * Determine the meat value of the modifier bonuses a particular bjorned familiar grants
 * @param mode The BonusEquipMode of this fight: "free", "dmt", "embezzler", or "barf"
 * @param modifiers An object containing any and all modifier-value pairs that the potential familiar choice grants
 * @returns The meat value of the modifier bonuses given that mode
 */
export function valueBjornModifiers(mode: BonusEquipMode, modifiers: Modifiers): number {
  const weight = modifiers["Familiar Weight"] ?? 0;
  const meat = modifiers["Meat Drop"] ?? 0;
  const item = modifiers["Item Drop"] ?? 0;

  const meatValue =
    (!["dmt", "free"].includes(mode) ? (baseMeat + mode === "embezzler" ? 750 : 0) : 0) / 100;
  const itemValue = mode === "barf" ? 0.72 : 0;

  const lepMult = leprechaunMultiplier(meatFamiliar());
  const lepBonus = weight * (2 * lepMult + Math.sqrt(lepMult));
  const fairyMult = fairyMultiplier(meatFamiliar());
  const fairyBonus = weight * (fairyMult + Math.sqrt(fairyMult) / 2);

  const bjornMeatDropValue = meatValue * (meat + lepBonus);
  const bjornItemDropValue = itemValue * (item + fairyBonus);

  return bjornMeatDropValue + bjornItemDropValue;
}

createRiderMode("free", (modifiers: Modifiers) => valueBjornModifiers("free", modifiers), false);
createRiderMode(
  "embezzler",
  (modifiers: Modifiers) => valueBjornModifiers("embezzler", modifiers),
  true
);
createRiderMode("dmt", (modifiers: Modifiers) => valueBjornModifiers("dmt", modifiers), true);
createRiderMode(
  "barf",
  (modifiers: Modifiers) => valueBjornModifiers("barf", modifiers),
  false,
  true
);

/**
 * Determines the best familiar to bjornify given a particular fight mode
 * @param mode The BonusEquipMode of this fight: "free", "dmt", "embezzler", or "barf"
 * @returns The best familiar to bjornify given this fight mode
 */
export function pickBjorn(mode: BonusEquipMode = "free"): FamiliarRider {
  const attempt = pickRider(mode);
  if (attempt) return attempt;
  throw new Error("Unable to make a sensible bjorn decision");
}
