import { Outfit } from "grimoire-kolmafia";
import { Item, myClass, numericModifier, canEquip } from "kolmafia";
import { $class, $item, $items, findLeprechaunMultiplier, have, SongBoom } from "libram";
import { meatFamiliar } from "../familiar";

export enum BonusEquipMode {
  FREE,
  EMBEZZLER,
  DMT,
  BARF,
}

export function isFree(mode: BonusEquipMode): boolean {
  return [BonusEquipMode.FREE, BonusEquipMode.DMT].includes(mode);
}

export function useLimitedDrops(mode: BonusEquipMode): boolean {
  return [BonusEquipMode.BARF, BonusEquipMode.FREE].includes(mode);
}

export function valueOfMeat(mode: BonusEquipMode): number {
  return isFree(mode)
    ? 0
    : (250 +
        (mode === BonusEquipMode.EMBEZZLER ? 750 : 0) +
        (SongBoom.song() === "Total Eclipse of Your Meat" ? 25 : 0)) /
        100;
}

export function valueOfItem(mode: BonusEquipMode): number {
  return mode === BonusEquipMode.BARF ? 0.72 : 0;
}

export function bestBjornalike(outfit: Outfit): Item | null {
  const bjornalikes = $items`Buddy Bjorn, Crown of Thrones`.filter((item) => outfit.canEquip(item));
  if (bjornalikes.length === 0) return null;
  if (bjornalikes.length === 1) return bjornalikes[0];

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
