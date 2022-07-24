import { Familiar, familiarWeight } from "kolmafia";
import { $familiar, findLeprechaunMultiplier } from "libram";
import { canOpenRedPresent } from ".";
import getConstantValueFamiliars from "./constantValueFamiliars";
import getDropFamiliars from "./dropFamiliars";
import getExperienceFamiliars from "./experienceFamiliars";
import { GeneralFamiliar, timeToMeatify } from "./lib";
import { meatFamiliar } from "./meatFamiliar";

export function menu(includeExperienceFamiliars = true, canChooseMacro = false): GeneralFamiliar[] {
  const familiarMenu = [
    ...getConstantValueFamiliars(),
    ...getDropFamiliars(),
    ...(includeExperienceFamiliars ? getExperienceFamiliars() : []),
  ];

  if (canChooseMacro) {
    if (timeToMeatify()) {
      familiarMenu.push({
        familiar: $familiar`Grey Goose`,
        expectedValue: (Math.max(familiarWeight($familiar`Grey Goose`) - 5), 0) ** 4,
        leprechaunMultiplier: 0,
        limit: "experience",
      });
    }

    if (canOpenRedPresent()) {
      familiarMenu.push({
        familiar: $familiar`Crimbo Shrub`,
        expectedValue: 2500,
        leprechaunMultiplier: 0,
        limit: "none",
      });
    }
  }

  const meatFam = meatFamiliar();

  if (familiarMenu.every(({ familiar }) => familiar !== meatFam)) {
    familiarMenu.push({
      familiar: meatFam,
      expectedValue: 0,
      leprechaunMultiplier: findLeprechaunMultiplier(meatFam),
      limit: "none",
    });
  }

  return familiarMenu;
}

export function freeFightFamiliarData(canChooseMacro = false): GeneralFamiliar {
  const compareFamiliars = (a: GeneralFamiliar, b: GeneralFamiliar) => {
    if (a.expectedValue === b.expectedValue) {
      return a.leprechaunMultiplier > b.leprechaunMultiplier ? a : b;
    }
    return a.expectedValue > b.expectedValue ? a : b;
  };

  return menu(true, canChooseMacro).reduce(compareFamiliars);
}

export function freeFightFamiliar(canChooseMacro = false): Familiar {
  return freeFightFamiliarData(canChooseMacro).familiar;
}
