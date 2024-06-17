import { Outfit, OutfitSpec } from "grimoire-kolmafia";
import {
  availableAmount,
  canAdventure,
  canEquip,
  cliExecute,
  equippedItem,
  inebrietyLimit,
  Item,
  itemAmount,
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
  getFoldGroup,
  have,
  lgrCurrencies,
  Requirement,
} from "libram";
import { acquire } from "../acquire";
import { globalOptions } from "../config";
import { copyTargetCount } from "../embezzler";
import { meatFamiliar } from "../familiar";
import { baseMeat } from "../lib";
import { digitizedMonstersRemaining } from "../turns";
import { garboValue } from "../garboValue";

export function bestBjornalike(outfit: Outfit): Item | null {
  const bjornalikes = $items`Buddy Bjorn, Crown of Thrones`.filter((item) =>
    outfit.canEquip(item),
  );
  if (bjornalikes.length === 0) return null;
  if (bjornalikes.length === 1) return bjornalikes[0];

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

export function useUPCs(): void {
  const UPC = $item`scratch 'n' sniff UPC sticker`;
  if (
    $items`scratch 'n' sniff sword, scratch 'n' sniff crossbow`.every(
      (i) => !have(i),
    )
  ) {
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
    visitUrl(
      `bedazzle.php?action=stick&pwd&slot=${slotNumber}&sticker=${toInt(UPC)}`,
    );
  }
}

const stickerSlots = $slots`sticker1, sticker2, sticker3`;
const UPC = $item`scratch 'n' sniff UPC sticker`;
export function useUPCsIfNeeded({ familiar }: Outfit): void {
  const currentWeapon =
    25 * (familiar ? findLeprechaunMultiplier(familiar) : 0);
  const embezzlers = globalOptions.ascend
    ? Math.min(20, copyTargetCount() || digitizedMonstersRemaining())
    : 20;

  const addedValueOfFullSword =
    (embezzlers * ((75 - currentWeapon) * (750 + baseMeat))) / 100;
  if (addedValueOfFullSword > 3 * mallPrice(UPC)) {
    const needed =
      3 -
      stickerSlots.filter((sticker) => equippedItem(sticker) === UPC).length;
    if (needed) acquire(needed, UPC, addedValueOfFullSword / 3, false);
    useUPCs();
  }
}

export const waterBreathingEquipment = $items`The Crown of Ed the Undying, aerated diving helmet, crappy Mer-kin mask, Mer-kin gladiator mask, Mer-kin scholar mask, old SCUBA tank`;
export const familiarWaterBreathingEquipment = $items`das boot, little bitty bathysphere`;

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

export function luckyGoldRingDropValues(
  includeVolcoino: boolean,
  includeFreddy: boolean,
): number[] {
  // Volcoino has a low drop rate which isn't accounted for here
  // Overestimating until it drops is probably fine, don't @ me
  const dropValues = [
    100, // 80 - 120 meat
    ...[
      itemAmount($item`hobo nickel`) > 0 ? 100 : 0, // This should be closeted
      itemAmount($item`sand dollar`) > 0 ? garboValue($item`sand dollar`) : 0, // This should be closeted
      includeFreddy ? garboValue($item`Freddy Kruegerand`) : 0,
      ...lgrCurrencies().map((i) =>
        i === $item`Volcoino` && !includeVolcoino ? 0 : garboValue(i),
      ),
    ].filter((value) => value > 0),
  ];

  return dropValues;
}
