import { Familiar, familiarWeight } from "kolmafia";
import { $familiar, findLeprechaunMultiplier } from "libram";
import getConstantValueFamiliars from "./constantValueFamiliars";
import getDropFamiliars from "./dropFamiliars";
import getExperienceFamiliars from "./experienceFamiliars";
import { GeneralFamiliar, timeToMeatify } from "./lib";
import MeatFamiliar from "./meatFamiliar";

export function menu(): GeneralFamiliar[] {
  const familiarMenu = [
    ...getConstantValueFamiliars(),
    ...getDropFamiliars(),
    ...getExperienceFamiliars(),
  ];

  const meatFamiliar = MeatFamiliar.familiar();

  if (familiarMenu.every(({ familiar }) => familiar !== meatFamiliar)) {
    const meatFamiliarEntry = {
      familiar: meatFamiliar,
      expectedValue: 0,
      leprechaunMultiplier: findLeprechaunMultiplier(meatFamiliar),
    };

    familiarMenu.push(meatFamiliarEntry);
  }

  return familiarMenu;
}

export function freeFightFamiliarData(canMeatify = false): GeneralFamiliar {
  if (canMeatify && timeToMeatify()) {
    return {
      familiar: $familiar`Grey Goose`,
      expectedValue: (familiarWeight($familiar`Grey Goose`) - 5) ** 4,
      leprechaunMultiplier: 0,
    };
  }

  const compareFamiliars = (a: GeneralFamiliar, b: GeneralFamiliar) => {
    if (a.expectedValue === b.expectedValue) {
      return a.leprechaunMultiplier > b.leprechaunMultiplier ? a : b;
    }
    return a.expectedValue > b.expectedValue ? a : b;
  };

  return menu().reduce(compareFamiliars);
}

export function freeFightFamiliar(canMeatify = false): Familiar {
  return freeFightFamiliarData(canMeatify).familiar;
}
