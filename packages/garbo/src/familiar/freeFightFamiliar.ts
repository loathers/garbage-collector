import { Familiar } from "kolmafia";
import { $familiar } from "libram";
import { AdventureArgument } from "../garboWanderer";
import { GeneralFamiliar, getUsedTcbFamiliars, tcbValue } from "./lib";
import { FamiliarMenuOptions, menu } from "./menu";

export type { FamiliarMenuOptions } from "./menu";

export function freeFightFamiliarData(
  adventure: AdventureArgument,
  options: Partial<FamiliarMenuOptions> = {},
): GeneralFamiliar {
  const usedTcbFamiliars = getUsedTcbFamiliars();
  const compareFamiliars = (a: GeneralFamiliar, b: GeneralFamiliar) => {
    if (a === null) return b;
    const aValue =
      a.expectedValue +
      tcbValue(a.familiar, usedTcbFamiliars, options.equipmentForced);
    const bValue =
      b.expectedValue +
      tcbValue(b.familiar, usedTcbFamiliars, options.equipmentForced);
    if (aValue === bValue) {
      return a.leprechaunMultiplier > b.leprechaunMultiplier ? a : b;
    }
    return aValue > bValue ? a : b;
  };

  return menu(adventure, options).reduce(compareFamiliars, {
    familiar: $familiar.none,
    expectedValue: 0,
    leprechaunMultiplier: 0,
    limit: "none",
    worksOnFreeRun: true,
  });
}

export function freeFightFamiliar(
  target: AdventureArgument,
  options: FamiliarMenuOptions = {},
): Familiar {
  return freeFightFamiliarData(target, options).familiar;
}
