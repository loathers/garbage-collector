import { Outfit, OutfitSpec } from "grimoire-kolmafia";
import {
  availableAmount,
  canAdventure,
  canEquip,
  cliExecute,
  equippedItem,
  inebrietyLimit,
  Item,
  mallPrice,
  myClass,
  myInebriety,
  numericModifier,
  toInt,
  toSlot,
  visitUrl,
} from "kolmafia";
import {
  $class,
  $familiar,
  $item,
  $items,
  $location,
  $slots,
  ActionSource,
  findLeprechaunMultiplier,
  get,
  getFoldGroup,
  have,
  Requirement,
} from "libram";
import { acquire } from "../acquire";
import { globalOptions } from "../config";
import { embezzlerCount } from "../embezzler";
import { meatFamiliar } from "../familiar";
import { baseMeat } from "../lib";
import { digitizedMonstersRemaining } from "../garboWanderer";

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

export function cleaverCheck(): void {
  if (availableAmount($item`June cleaver`) > 1) cliExecute("refresh inventory");
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

const stickerSlots = $slots`sticker1, sticker2, sticker3`;
const UPC = $item`scratch 'n' sniff UPC sticker`;
export function useUPCsIfNeeded({ familiar }: Outfit): void {
  const currentWeapon = 25 * (familiar ? findLeprechaunMultiplier(familiar) : 0);
  const embezzlers = globalOptions.ascend
    ? Math.min(20, embezzlerCount() || digitizedMonstersRemaining())
    : 20;

  const addedValueOfFullSword = (embezzlers * ((75 - currentWeapon) * (750 + baseMeat))) / 100;
  if (addedValueOfFullSword > 3 * mallPrice(UPC)) {
    const needed = 3 - stickerSlots.filter((sticker) => equippedItem(sticker) === UPC).length;
    if (needed) acquire(needed, UPC, addedValueOfFullSword / 3, false);
    useUPCs();
  }
}

export const waterBreathingEquipment = $items`The Crown of Ed the Undying, aerated diving helmet, crappy Mer-kin mask, Mer-kin gladiator mask, Mer-kin scholar mask, old SCUBA tank`;
export const familiarWaterBreathingEquipment = $items`das boot, little bitty bathysphere`;

// TODO: Make this not terrible, add MSG
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
      get("latteUnlocks").includes(ingredient),
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

export function toSpec(source?: ActionSource | Requirement): OutfitSpec {
  if (!source) return {};
  if (source instanceof Requirement) {
    const result: OutfitSpec = {};
    if (source.maximizeParameters.length) result.modifier = source.maximizeParameters;
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
