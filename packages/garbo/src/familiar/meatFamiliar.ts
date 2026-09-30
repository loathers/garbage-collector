import {
  booleanModifier,
  equippedItem,
  Familiar,
  Item,
  numericModifier,
} from "kolmafia";
import {
  $familiar,
  $familiars,
  $item,
  $items,
  $slot,
  findFairyMultiplier,
  findLeprechaunMultiplier,
  have,
  maxBy,
} from "libram";
import { equipmentlessFamiliarWeight } from "./weight";

let fam: Familiar;

function findBestLeprechauns(): Familiar[] {
  const validFamiliars = Familiar.all().filter(
    (f) => have(f) && f !== $familiar`Ghost of Crimbo Commerce`,
  );
  if (!validFamiliars.length) return [];

  validFamiliars.sort(
    (a, b) => findLeprechaunMultiplier(b) - findLeprechaunMultiplier(a),
  );

  const bestLepMult = findLeprechaunMultiplier(validFamiliars[0]);
  const firstBadLeprechaun = validFamiliars.findIndex(
    (f) => findLeprechaunMultiplier(f) < bestLepMult,
  );

  if (firstBadLeprechaun === -1) return validFamiliars;
  return validFamiliars.slice(0, firstBadLeprechaun);
}

function findBestLeprechaun(): Familiar {
  const candidates = findBestLeprechauns();
  return candidates.length > 0
    ? maxBy(candidates, findFairyMultiplier)
    : $familiar.none;
}

export function setBestLeprechaunAsMeatFamiliar(): void {
  fam = findBestLeprechaun();
}

export function meatFamiliar(): Familiar {
  return (fam ??=
    $familiars`Robortender, Jill-of-All-Trades`.find(have) ??
    findBestLeprechaun());
}

const familiarWaterBreathingEquipment = $items`das boot, little bitty bathysphere`;

export function familiarCanBreathe(familiar?: Familiar): boolean {
  return (
    (familiar?.underwater ?? false) ||
    // `booleanModifier("Underwater Familiar")` covers us for unusual breathing strategies
    // like the asdon martin's Driving Waterproofly effect
    (booleanModifier("Underwater Familiar") &&
      !booleanModifier(equippedItem($slot`familiar`), "Underwater Familiar"))
  );
}
function meatDropWithEquipment(familiar: Familiar, equip: Item): number {
  return numericModifier(
    familiar,
    "Meat Drop",
    equipmentlessFamiliarWeight(familiar),
    equip,
  );
}

/**
 * Primarily a workaround for Jill-of-All-Trades; `meatFamiliar` assumes she always has LED
 * candle, but underwater, barring effects like Drive Waterproofly, she needs das boot or equivalent.
 *
 * This should be used during cowo/underwater wanderer/etc fights
 */
export function underwaterMeatFamiliar(): Familiar {
  const fallback = meatFamiliar();
  if (familiarCanBreathe(fallback)) return fallback;

  const breathingEquipment = familiarWaterBreathingEquipment.filter(have);
  if (!breathingEquipment.length) return fallback;

  const assumedFreeSlotEquipment = have($item`amulet coin`)
    ? $item`amulet coin`
    : $item.none;

  const familiarValue = (familiar: Familiar) =>
    familiarCanBreathe(familiar)
      ? meatDropWithEquipment(familiar, assumedFreeSlotEquipment)
      : Math.max(
          ...breathingEquipment.map((equip) =>
            meatDropWithEquipment(familiar, equip),
          ),
        );

  const candidates = Familiar.all().filter(
    (familiar) =>
      have(familiar) && familiar !== $familiar`Ghost of Crimbo Commerce`,
  );

  return candidates.length ? maxBy(candidates, familiarValue) : fallback;
}
