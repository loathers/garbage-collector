import { Familiar, familiarEquipment } from "kolmafia";
import {
  $familiar,
  $familiars,
  findLeprechaunMultiplier,
  get,
  ToyCupidBow,
} from "libram";
import {
  amuletCoinOpportunityCost,
  getUsedTcbFamiliars,
} from "./toyCupidBowValue";
import { FamiliarMode, GeneralFamiliar } from "./lib";
import { globalOptions } from "../config";
import { propertyManager } from "../lib";

// Familiars that should never be introduced as a surprise
const NO_TCB_FAMILIARS = $familiars`Mini-Hipster, Artistic Goth Kid`;
export function getToyCupidBowFamiliars(
  cupidBowValues: ReadonlyMap<Familiar, number>,
  mode: FamiliarMode,
): GeneralFamiliar[] {
  if (!ToyCupidBow.have()) return [];

  const skipFamiliars = getUsedTcbFamiliars();
  for (const familiar of NO_TCB_FAMILIARS) skipFamiliars.add(familiar);

  // Limit extra candidates to the most profitable drop at each multiplier.
  const bestFamiliarsByLeprechaunMultiplier = new Map<
    number,
    GeneralFamiliar
  >();
  for (const [familiar, cupidBowValue] of cupidBowValues) {
    if (skipFamiliars.has(familiar)) continue;
    const expectedValue =
      cupidBowValue -
      (mode === "barf" ? amuletCoinOpportunityCost(familiar) : 0);
    if (expectedValue <= 0) continue;
    if (
      !familiarEquipment(familiar).tradeable &&
      familiar !== $familiar`Cornbeefadon`
    ) {
      continue;
    }
    if (
      familiar === $familiar`Mini-Adventurer` &&
      !get("miniAdvClass") &&
      !get("choiceAdventure768")
    ) {
      if (globalOptions.ascend) {
        propertyManager.setChoice(768, 4);
      } // Littlest identity crisis, sauceror
      else continue;
    }
    if (familiar === $familiar`Doppelshifter`) continue;

    const leprechaunMultiplier = findLeprechaunMultiplier(familiar);
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
