import {
  booleanModifier,
  equippedItem,
  Familiar,
  numericModifier,
} from "kolmafia";
import { $slot, totalFamiliarWeight } from "libram";

// Workaround to get buffed familiar weight without equipment, since e.g. breathing gear may override it.
export function equipmentlessFamiliarWeight(familiar: Familiar): number {
  return (
    totalFamiliarWeight(familiar, true) -
    numericModifier(equippedItem($slot`familiar`), "Familiar Weight")
  );
}

export function familiarCanBreathe(familiar?: Familiar): boolean {
  return (
    (familiar?.underwater ?? false) ||
    // `booleanModifier("Underwater Familiar")` covers us for unusual breathing strategies
    // like the asdon martin's Driving Waterproofly effect
    (booleanModifier("Underwater Familiar") &&
      !booleanModifier(equippedItem($slot`familiar`), "Underwater Familiar"))
  );
}
