import {
  equippedItem,
  Familiar,
  familiarWeight,
  Item,
  myFamiliar,
  numericModifier,
  print,
  weightAdjustment,
} from "kolmafia";
import { $effect, $familiar, $item, $slot, findLeprechaunMultiplier, have } from "libram";
import { familiarWaterBreathingEquipment } from "../outfit";

function bestFamUnderwaterGear(fam: Familiar): Item {
  // Returns best familiar gear for yachtzee chaining
  return fam.underwater || have($effect`Driving Waterproofly`) || have($effect`Wet Willied`)
    ? have($item`amulet coin`)
      ? $item`amulet coin`
      : $item`filthy child leash`
    : have($item`das boot`)
    ? $item`das boot`
    : $item`little bitty bathysphere`;
}

export function bestYachtzeeFamiliar(): Familiar {
  const haveUnderwaterFamEquipment = familiarWaterBreathingEquipment.some((item) => have(item));
  const famWt =
    familiarWeight(myFamiliar()) +
    weightAdjustment() -
    numericModifier(equippedItem($slot`familiar`), "Familiar Weight");

  const sortedUnderwaterFamiliars = Familiar.all()
    .filter(
      (fam) =>
        have(fam) &&
        findLeprechaunMultiplier(fam) > 0 &&
        fam !== $familiar`Ghost of Crimbo Commerce` &&
        fam !== $familiar`Robortender` &&
        (fam.underwater || haveUnderwaterFamEquipment)
    )
    .sort(
      (left, right) =>
        numericModifier(right, "Meat Drop", famWt, bestFamUnderwaterGear(right)) -
        numericModifier(left, "Meat Drop", famWt, bestFamUnderwaterGear(left))
    );

  print(`Familiar bonus meat%:`, "blue");
  sortedUnderwaterFamiliars.forEach((fam) => {
    print(
      `${fam} (${numericModifier(fam, "Meat Drop", famWt, bestFamUnderwaterGear(fam)).toFixed(
        2
      )}%)`,
      "blue"
    );
  });

  if (sortedUnderwaterFamiliars.length === 0) return $familiar.none;
  print(`Best Familiar: ${sortedUnderwaterFamiliars[0]}`, "blue");
  return sortedUnderwaterFamiliars[0];
}
