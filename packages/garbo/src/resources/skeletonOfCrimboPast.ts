import { $familiar, $item, $location, $phylum, get, have } from "libram";
import { garboValue } from "../garboValue";
import { globalOptions } from "../config";
import { FamiliarMode } from "../familiar/lib";
import { BonusEquipMode } from "../lib";
import { Location, Monster } from "kolmafia";

export function knuckleboneValue(
  mode: FamiliarMode | BonusEquipMode | Monster | Location,
): number {
  if (
    get("_knuckleboneDrops", 0) >= 100 ||
    !have($familiar`Skeleton of Crimbo Past`)
  ) {
    return 0;
  }
  const boneTradeValue = garboValue($item`knucklebone`);
  return knuckboneMultiplier(mode) * boneTradeValue;
}

function knuckboneMultiplier(
  mode: FamiliarMode | BonusEquipMode | Monster | Location,
): number {
  if (mode === "barf") {
    return getLocationPhylumMultiplier($location`Barf Mountain`);
  }

  if (mode === "target") {
    return getPhylumMultiplier(globalOptions.target);
  }

  if (mode instanceof Location) {
    return getLocationPhylumMultiplier(mode);
  }

  if (mode instanceof Monster) {
    return getPhylumMultiplier(mode);
  }

  return 0;
}

function getLocationPhylumMultiplier(loc: Location): number {
  const queueString = loc.combatQueue;
  if (!queueString) return 0;

  const names = queueString
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (names.length === 0) return 0;

  const multipliers = names
    .map((name) => Monster.get(name))
    .filter((mon) => mon !== Monster.none)
    .map((mon) => getPhylumMultiplier(mon));

  if (multipliers.length === 0) return 0;

  const sum = multipliers.reduce((a, b) => a + b, 0);
  return sum / multipliers.length;
}

function getPhylumMultiplier(monster: Monster): number {
  if (monster.attributes.includes("SKELETON")) {
    return 0.9;
  }

  switch (monster.phylum) {
    case $phylum`beast`:
      return 0.3;
    case $phylum`bug`:
      return 0.1;
    case $phylum`construct`:
      return 0.1;
    case $phylum`demon`:
      return 0.4;
    case $phylum`dude`:
      return 0.5;
    case $phylum`elemental`:
      return 0.0;
    case $phylum`elf`:
      return 0.5;
    case $phylum`fish`:
      return 0.2;
    case $phylum`goblin`:
      return 0.4;
    case $phylum`hobo`:
      return 0.5;
    case $phylum`horror`:
      return 0.0;
    case $phylum`humanoid`:
      return 0.4;
    case $phylum`mer-kin`:
      return 0.0;
    case $phylum`orc`:
      return 0.8;
    case $phylum`penguin`:
      return 0.2;
    case $phylum`pirate`:
      return 0.65;
    case $phylum`plant`:
      return 0.0;
    case $phylum`slime`:
      return 0.0;
    case $phylum`undead`:
      return 0.4;
    case $phylum`weird`:
      return 0.2;
    default:
      return 0;
  }
}
