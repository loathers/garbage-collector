import { Outfit, OutfitSpec } from "grimoire-kolmafia";
import {
  availableAmount,
  canAdventure,
  canEquip,
  cliExecute,
  Familiar,
  inebrietyLimit,
  Item,
  Location,
  myClass,
  myInebriety,
  numericModifier,
} from "kolmafia";
import {
  $class,
  $familiar,
  $item,
  $items,
  $location,
  ActionSource,
  findLeprechaunMultiplier,
  getFoldGroup,
  have,
  Requirement,
} from "libram";
import { familiarCanBreathe } from "../familiar/familiarHelpers";
import { meatFamiliar } from "../familiar/meatFamiliar";
import { targetMeat } from "../lib";
import { FarmingStrategy } from "../farmingStrategy";

export enum BonusEquipMode {
  FREE,
  MEAT_TARGET,
  DMT,
  BARF,
}

export function modeIsFree(mode: BonusEquipMode): boolean {
  return [BonusEquipMode.FREE, BonusEquipMode.DMT].includes(mode);
}

export function modeUseLimitedDrops(mode: BonusEquipMode): boolean {
  return [BonusEquipMode.BARF, BonusEquipMode.FREE].includes(mode);
}

export function modeValueOfMeat(mode: BonusEquipMode): number {
  if (modeIsFree(mode)) return 0;
  if (mode === BonusEquipMode.BARF) return FarmingStrategy.meatDropValue();
  if (mode === BonusEquipMode.MEAT_TARGET) return targetMeat() / 100;
  return 0;
}

export function modeValueOfItem(mode: BonusEquipMode): number {
  return mode === BonusEquipMode.BARF ? FarmingStrategy.itemDropValue() : 0;
}

export function bestBjornalike(outfit: Outfit): Item | null {
  const bjornalikes = $items`Buddy Bjorn, Crown of Thrones`.filter((item) =>
    outfit.canEquip(item),
  );
  if (bjornalikes.length === 0) return null;
  if (bjornalikes.length === 1) return bjornalikes[0];

  if (outfit.bonuses.has($item`bat wings`)) return $item`Crown of Thrones`;

  const hasStrongLep = findLeprechaunMultiplier(meatFamiliar()) >= 2;
  const goodRobortHats = $items`crumpled felt fedora`;
  if (myClass() === $class`Turtle Tamer`) {
    goodRobortHats.push($item`warbear foil hat`);
  }
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

export function cleaverCheck(): void {
  if (availableAmount($item`June cleaver`) > 1) cliExecute("refresh inventory");
}

export const waterBreathingEquipment = $items`The Crown of Ed the Undying, aerated diving helmet, crappy Mer-kin mask, Mer-kin gladiator mask, Mer-kin scholar mask, old SCUBA tank`;
export const familiarWaterBreathingEquipment = $items`das boot, little bitty bathysphere`;

export function familiarSlotNeededForBreathing(
  location: Location,
  familiar?: Familiar,
): boolean {
  return location.environment === "underwater" && !familiarCanBreathe(familiar);
}

export function toSpec(source?: ActionSource | Requirement): OutfitSpec {
  if (!source) return {};
  if (source instanceof Requirement) {
    const result: OutfitSpec = {};
    if (source.maximizeParameters.length) {
      result.modifier = source.maximizeParameters;
    }
    if (source.maximizeOptions.forceEquip?.length) {
      result.equip = source.maximizeOptions.forceEquip;
    }
    if (source.maximizeOptions.preventEquip) {
      result.avoid = source.maximizeOptions.preventEquip;
    }

    return result;
  } else {
    const req = source.constraints.equipmentRequirements?.();
    const spec: OutfitSpec = req ? toSpec(req) : {};
    const familiar = source.constraints.familiar?.();
    if (familiar) spec.familiar = familiar;
    return spec;
  }
}

let cachedUsingPurse: boolean | null = null;
export function usingPurse(): boolean {
  if (cachedUsingPurse === null) {
    cachedUsingPurse =
      myInebriety() <= inebrietyLimit() &&
      !have($item`KoL Con 13 snowglobe`) &&
      !have($item`can of mixed everything`) &&
      (!have($item`latte lovers member's mug`) ||
        (!have($familiar`Robortender`) && !have($familiar`Hobo Monkey`)) ||
        !canAdventure($location`The Black Forest`));
  }
  return cachedUsingPurse;
}

export function validateGarbageFoldable(spec: OutfitSpec): void {
  const garbageItems = getFoldGroup($item`January's Garbage Tote`);
  for (const garbageItem of garbageItems) {
    if (
      Object.values(spec).some(
        (specEntry) =>
          specEntry === garbageItem ||
          (Array.isArray(specEntry) && specEntry.includes(garbageItem)),
      )
    ) {
      if (!have(garbageItem)) cliExecute(`fold ${garbageItem}`);
      break;
    }
  }
}
