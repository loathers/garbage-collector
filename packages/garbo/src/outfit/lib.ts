import { Outfit, OutfitSpec } from "grimoire-kolmafia";
import {
  availableAmount,
  canAdventure,
  canEquip,
  cliExecute,
  equippedItem,
  inebrietyLimit,
  Item,
  Location,
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
  $slot,
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
import { meatFamiliar } from "../familiar";
import { BonusEquipMode, targetMeat } from "../lib";
import {
  digitizedMonstersRemaining,
  estimatedGarboTurns,
  highMeatMonsterCount,
} from "../turns";
import { WanderDetails } from "garbo-lib";
import { wanderer } from "../garboWanderer";

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
  const targets = globalOptions.ascend
    ? Math.min(20, highMeatMonsterCount() || digitizedMonstersRemaining())
    : 20;

  const addedValueOfFullSword =
    (targets * ((75 - currentWeapon) * targetMeat())) / 100;
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

let bestPantsAdventures: number;
const getBestPantsAdventures = () =>
  (bestPantsAdventures ??= Math.max(
    0,
    ...Item.all()
      .filter(
        (item) =>
          toSlot(item) === $slot`pants` &&
          have(item) &&
          numericModifier(item, "Adventures") > 0,
      )
      .map((pants) => numericModifier(pants, "Adventures")),
  ));

function cheeseBonus(mode: BonusEquipMode) {
  if (globalOptions.ascend) return 0;
  if (mode === BonusEquipMode.MEAT_TARGET) return 0;
  if (get("_stinkyCheeseCount") >= 100) return 0;
  if (!getFoldGroup($item`stinky cheese diaper`).some((item) => have(item))) {
    return 0;
  }
  if (estimatedGarboTurns() < 100 - get("_stinkyCheeseCount")) return 0;
  return get("valueOfAdventure") * (10 - getBestPantsAdventures()) * (1 / 100);
}

export function applyCheeseBonus(outfit: Outfit, mode: BonusEquipMode) {
  const bonus = cheeseBonus(mode);
  if (bonus > 0) outfit.modifier.push(`${bonus.toFixed(2)} stinky cheese`);
}

export const destinationToLocation = (
  destination: Location | WanderDetails,
): Location =>
  destination instanceof Location
    ? destination
    : wanderer().getTarget(destination).location;
