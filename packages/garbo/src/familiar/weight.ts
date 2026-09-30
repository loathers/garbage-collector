import { equippedItem, Familiar, numericModifier } from "kolmafia";
import { $slot, totalFamiliarWeight } from "libram";

// Workaround to get buffed familiar weight without equipment, since e.g. breathing gear may override it.
export function equipmentlessFamiliarWeight(familiar: Familiar): number {
  return (
    totalFamiliarWeight(familiar, true) -
    numericModifier(equippedItem($slot`familiar`), "Familiar Weight")
  );
}
