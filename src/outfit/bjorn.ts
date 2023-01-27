import { canEquip, Item, myClass, numericModifier, toSlot } from "kolmafia";
import {
  $class,
  $item,
  $items,
  CrownOfThrones,
  findFairyMultiplier,
  findLeprechaunMultiplier,
  have,
  Modifiers,
} from "libram";
import { meatFamiliar } from "../familiar/meatFamiliar";
import { BonusEquipMode, ignoreLimitedDrops, itemValue, meatValue } from "./lib";

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

  const lepMult = findLeprechaunMultiplier(meatFamiliar());
  const lepBonus = weight * (2 * lepMult + Math.sqrt(lepMult));
  const fairyMult = findFairyMultiplier(meatFamiliar());
  const fairyBonus = weight * (fairyMult + Math.sqrt(fairyMult) / 2);

  const bjornMeatDropValue = meatValue(mode) * (meat + lepBonus);
  const bjornItemDropValue = itemValue(mode) * (item + fairyBonus);

  return bjornMeatDropValue + bjornItemDropValue;
}

function riderMode(mode: BonusEquipMode, ignoreLimitedDrops: boolean) {
  CrownOfThrones.createRiderMode(
    mode,
    (modifiers) => valueBjornModifiers(mode, modifiers),
    ignoreLimitedDrops
  );
}

export function initializeRiders(): void {
  for (const mode of Object.values(BonusEquipMode)) {
    riderMode(mode, ignoreLimitedDrops(mode));
  }
}

export function pickBjorn(mode: BonusEquipMode): CrownOfThrones.FamiliarRider {
  const attempt = CrownOfThrones.pickRider(mode);
  if (!attempt) throw new Error("Unable to make a sensible bjorn decision!");
  return attempt;
}

export function bestBjornalike(existingForceEquips: Item[]): Item | null {
  const bjornalikes = $items`Buddy Bjorn, Crown of Thrones`;
  const slots = bjornalikes
    .map((bjornalike) => toSlot(bjornalike))
    .filter((slot) => !existingForceEquips.some((equipment) => toSlot(equipment) === slot));
  if (!slots.length) return null;
  if (slots.length < 2 || bjornalikes.some((thing) => !have(thing))) {
    return bjornalikes.find((thing) => have(thing) && slots.includes(toSlot(thing))) ?? null;
  }

  const hasStrongLep = findLeprechaunMultiplier(meatFamiliar()) >= 2;
  const goodRobortHats = $items`crumpled felt fedora`;
  if (myClass() === $class`Turtle Tamer`) goodRobortHats.push($item`warbear foil hat`);
  if (numericModifier($item`shining star cap`, "Familiar Weight") === 10) {
    goodRobortHats.push($item`shining star cap`);
  }
  if (
    have($item`carpe`) &&
    (!hasStrongLep || !goodRobortHats.some((hat) => have(hat) && canEquip(hat)))
  ) {
    return $item`Crown of Thrones`;
  }
  return $item`Buddy Bjorn`;
}
