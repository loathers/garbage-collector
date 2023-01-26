import {
  canAdventure,
  canEquip,
  cliExecute,
  equippedItem,
  inebrietyLimit,
  Item,
  myInebriety,
  numericModifier,
  toInt,
  toSlot,
  visitUrl,
} from "kolmafia";
import { $familiar, $item, $items, $location, get, have } from "libram";
import { baseMeat } from "../lib";

export enum BonusEquipMode {
  FREE = "FREE",
  EMBEZZLER = "EMBEZZLER",
  DMT = "DMT",
  BARF = "BARF",
}

export function ignoreLimitedDrops(mode: BonusEquipMode): boolean {
  return [BonusEquipMode.EMBEZZLER, BonusEquipMode.DMT].includes(mode);
}

export function isFreeFight(mode: BonusEquipMode): boolean {
  return [BonusEquipMode.FREE, BonusEquipMode.DMT].includes(mode);
}

export function meatValue(mode: BonusEquipMode): number {
  switch (mode) {
    case BonusEquipMode.BARF:
      return baseMeat / 100;
    case BonusEquipMode.EMBEZZLER:
      return 750 + baseMeat / 100;
    case BonusEquipMode.DMT:
    case BonusEquipMode.FREE:
      return 0;
  }
}

export function itemValue(mode: BonusEquipMode): number {
  return mode === BonusEquipMode.BARF ? 0.72 : 0;
}

export const VOA = get("valueOfAdventure");

export type BonusGear = {
  item: Item;
  value: (mode: BonusEquipMode) => number;
  circumstantial?: boolean;
};

export function toBonus(
  { item, value, circumstantial }: BonusGear,
  mode: BonusEquipMode,
  valueCircumstantialBonus = true
): [Item, number] | null {
  if (!have(item) || !canEquip(item)) return null;
  if ((circumstantial ?? true) && !valueCircumstantialBonus) return null;
  const val = value(mode);
  if (!val) return null;
  return [item, val];
}

export const waterBreathingEquipment = $items`The Crown of Ed the Undying, aerated diving helmet, crappy Mer-kin mask, Mer-kin gladiator mask, Mer-kin scholar mask, old SCUBA tank`;
export const familiarWaterBreathingEquipment = $items`das boot, little bitty bathysphere`;

let cachedUsingPurse: boolean | null = null;
export function usingPurse(): boolean {
  if (cachedUsingPurse === null) {
    cachedUsingPurse =
      myInebriety() <= inebrietyLimit() &&
      (!have($item`latte lovers member's mug`) ||
        (!have($familiar`Robortender`) && !have($familiar`Hobo Monkey`)) ||
        !canAdventure($location`The Black Forest`));
  }
  return cachedUsingPurse;
}

export function useUPCs(): void {
  const UPC = $item`scratch 'n' sniff UPC sticker`;
  if ($items`scratch 'n' sniff sword, scratch 'n' sniff crossbow`.every((i) => !have(i))) {
    visitUrl(`bedazzle.php?action=juststick&sticker=${toInt(UPC)}&pwd`);
  }
  for (let slotNumber = 1; slotNumber <= 3; slotNumber++) {
    const slot = toSlot(`sticker${slotNumber}`);
    const sticker = equippedItem(slot);
    if (sticker === UPC) continue;
    visitUrl("bedazzle.php");
    if (sticker !== $item.none) {
      visitUrl(`bedazzle.php?action=peel&pwd&slot=${slotNumber}`);
    }
    visitUrl(`bedazzle.php?action=stick&pwd&slot=${slotNumber}&sticker=${toInt(UPC)}`);
  }
}

export function refreshLatte(): boolean {
  // Refresh unlocked latte ingredients
  if (have($item`latte lovers member's mug`)) {
    visitUrl("main.php?latte=1", false);
  }

  return have($item`latte lovers member's mug`);
}

export function tryFillLatte(): boolean {
  if (
    have($item`latte lovers member's mug`) &&
    get("_latteRefillsUsed") < 3 &&
    (get("_latteCopyUsed") ||
      (get("latteUnlocks").includes("cajun") &&
        get("latteUnlocks").includes("rawhide") &&
        (numericModifier($item`latte lovers member's mug`, "Familiar Weight") !== 5 ||
          numericModifier($item`latte lovers member's mug`, "Meat Drop") !== 40 ||
          (get("latteUnlocks").includes("carrot") &&
            numericModifier($item`latte lovers member's mug`, "Item Drop") !== 20))))
  ) {
    const goodLatteIngredients = ["cajun", "rawhide", "carrot"];
    const latteIngredients = goodLatteIngredients.filter((ingredient) =>
      get("latteUnlocks").includes(ingredient)
    );
    if (latteIngredients.length < 3) latteIngredients.push("pumpkin");
    if (latteIngredients.length < 3) latteIngredients.push("vanilla");
    if (latteIngredients.length < 3) latteIngredients.push("cinnamon");
    cliExecute(`latte refill ${latteIngredients.join(" ")}`);
  }

  return (
    numericModifier($item`latte lovers member's mug`, "Familiar Weight") === 5 &&
    numericModifier($item`latte lovers member's mug`, "Meat Drop") === 40
  );
}
