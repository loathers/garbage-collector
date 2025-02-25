import { Familiar, familiarEquipment } from "kolmafia";
import { findLeprechaunMultiplier, have, ToyCupidBow } from "libram";
import { garboValue } from "../garboValue";
import {
  familiarEquipmentValue,
  GeneralFamiliar,
  getUsedTcbFamiliars,
} from "./lib";
import { estimatedGarboTurns } from "../turns";

export function getToyCupidBowFamiliars(): GeneralFamiliar[] {
  const usedTcbFamiliars = getUsedTcbFamiliars();

  // If there aren't enough turns to run someone to completion, only check for the current cupid familiar
  if (estimatedGarboTurns() < ToyCupidBow.turnsLeft()) {
    const current = ToyCupidBow.currentFamiliar();
    if (!current) return [];
    if (usedTcbFamiliars.has(current)) return [];
    return [
      {
        familiar: current,
        expectedValue:
          garboValue(familiarEquipment(current)) / ToyCupidBow.turnsLeft(),
        worksOnFreeRun: true,
        limit: "cupid",
        leprechaunMultiplier: findLeprechaunMultiplier(current),
      },
    ];
  }

  // Otherwise find the best for each leprechaun multiplier
  const bestFamiliarsByLeprechaunMultiplier = new Map<
    number,
    GeneralFamiliar
  >();
  for (const familiar of Familiar.all()) {
    if (!have(familiar)) continue;
    if (usedTcbFamiliars.has(familiar)) continue;
    if (!familiarEquipment(familiar).tradeable) continue;

    const leprechaunMultiplier = findLeprechaunMultiplier(familiar);
    const expectedValue =
      familiarEquipmentValue(familiar) / ToyCupidBow.turnsLeft(familiar);

    const currentBestValue =
      bestFamiliarsByLeprechaunMultiplier.get(leprechaunMultiplier)
        ?.expectedValue ?? 0;

    if (expectedValue > currentBestValue) {
      bestFamiliarsByLeprechaunMultiplier.set(leprechaunMultiplier, {
        familiar,
        expectedValue,
        worksOnFreeRun: true,
        limit: "cupid",
        leprechaunMultiplier,
      });
    }
  }
  return [...bestFamiliarsByLeprechaunMultiplier.values()];
}
