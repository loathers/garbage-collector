import { equippedItem, Familiar, Item, numericModifier, print } from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $slot,
  findLeprechaunMultiplier,
  have,
  maxBy,
  totalFamiliarWeight,
} from "libram";
import { familiarWaterBreathingEquipment } from "../../outfit";

export function bestFamUnderwaterGear(fam: Familiar): Item {
  // Returns best familiar gear for yachtzee chaining
  return fam.underwater ||
    have($effect`Driving Waterproofly`) ||
    have($effect`Wet Willied`)
    ? have($item`amulet coin`)
      ? $item`amulet coin`
      : $item`filthy child leash`
    : have($item`das boot`)
      ? $item`das boot`
      : $item`little bitty bathysphere`;
}

function equipmentlessFamiliarWeight(fam: Familiar): number {
  return (
    totalFamiliarWeight(fam, true) -
    numericModifier(equippedItem($slot`familiar`), "Familiar Weight")
  );
}

export function bestYachtzeeFamiliar(): Familiar {
  const haveUnderwaterFamEquipment = familiarWaterBreathingEquipment.some(
    (item) => have(item),
  );
  const availableUnderwaterFamiliars = Familiar.all()
    .filter(
      (fam) =>
        have(fam) &&
        findLeprechaunMultiplier(fam) > 0 &&
        fam !== $familiar`Ghost of Crimbo Commerce` &&
        fam !== $familiar`Robortender` &&
        (fam.underwater || haveUnderwaterFamEquipment),
    )
    .map((familiar) => ({
      familiar,
      meat: numericModifier(
        familiar,
        "Meat Drop",
        equipmentlessFamiliarWeight(familiar),
        bestFamUnderwaterGear(familiar),
      ),
    }));

  print(`Familiar bonus meat%:`, "blue");
  availableUnderwaterFamiliars.forEach(({ familiar, meat }) => {
    print(`${familiar} (${meat.toFixed(2)}%)`, "blue");
  });

  if (availableUnderwaterFamiliars.length === 0) return $familiar.none;
  const best = maxBy(availableUnderwaterFamiliars, "meat").familiar;
  print(`Best Familiar: ${best}`, "blue");
  return best;
}
