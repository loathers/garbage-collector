import { Familiar, familiarWeight, inebrietyLimit, Location, myInebriety } from "kolmafia";
import { $familiar, $item, $location, clamp, findLeprechaunMultiplier, get, have } from "libram";
import { canOpenRedPresent } from ".";
import { garboValue } from "../session";
import getConstantValueFamiliars from "./constantValueFamiliars";
import getDropFamiliars from "./dropFamiliars";
import getExperienceFamiliars from "./experienceFamiliars";
import { GeneralFamiliar, timeToMeatify } from "./lib";
import { meatFamiliar } from "./meatFamiliar";

type MenuOptions = {
  canChooseMacro?: boolean;
  location?: Location;
  extraFamiliars?: GeneralFamiliar[];
  includeExperienceFamiliars?: boolean;
};
const DEFAULT_MENU_OPTIONS = {
  canChooseMacro: true,
  location: $location`none`,
  extraFamiliars: [],
  includeExperienceFamiliars: true,
};
export function menu(options: MenuOptions = {}): GeneralFamiliar[] {
  const { includeExperienceFamiliars, canChooseMacro, location, extraFamiliars } = {
    ...DEFAULT_MENU_OPTIONS,
    ...options,
  };
  const familiarMenu = [
    ...getConstantValueFamiliars(),
    ...getDropFamiliars(),
    ...(includeExperienceFamiliars ? getExperienceFamiliars() : []),
    ...extraFamiliars,
  ];

  if (canChooseMacro && myInebriety() <= inebrietyLimit()) {
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
        limit: "special",
      });
    }

    if (location.zone === "Dinseylandfill" && have($familiar`Space Jellyfish`)) {
      familiarMenu.push({
        familiar: $familiar`Space Jellyfish`,
        expectedValue:
          garboValue($item`stench jelly`) /
          (get("_spaceJellyfishDrops") < 5 ? get("_spaceJellyfishDrops") + 1 : 20),
        leprechaunMultiplier: 0,
        limit: "special",
      });
    }
  }

  const meatFam = meatFamiliar();

  if (!familiarMenu.some(({ familiar }) => familiar === meatFam)) {
    familiarMenu.push({
      familiar: meatFam,
      expectedValue: 0,
      leprechaunMultiplier: findLeprechaunMultiplier(meatFam),
      limit: "none",
    });
  }

  return familiarMenu;
}

export function getAllJellyfishDrops(): { expectedValue: number; expectedTurns: number }[] {
  if (!have($familiar`Space Jellyfish`)) return [{ expectedValue: 0, expectedTurns: 0 }];

  const current = get("_spaceJellyfishDrops");
  const returnValue = [];

  for (let dropNumber = clamp(current + 1, 0, 6); dropNumber <= 6; dropNumber++) {
    returnValue.push({
      expectedValue: garboValue($item`stench jelly`) / (dropNumber > 5 ? 20 : dropNumber),
      expectedTurns: dropNumber > 5 ? Infinity : dropNumber,
    });
  }

  return returnValue;
}

export function freeFightFamiliarData(options: MenuOptions = {}): GeneralFamiliar {
  const compareFamiliars = (a: GeneralFamiliar, b: GeneralFamiliar) => {
    if (a.expectedValue === b.expectedValue) {
      return a.leprechaunMultiplier > b.leprechaunMultiplier ? a : b;
    }
    return a.expectedValue > b.expectedValue ? a : b;
  };

  return menu(options).reduce(compareFamiliars);
}

export function freeFightFamiliar(options: MenuOptions = {}): Familiar {
  return freeFightFamiliarData(options).familiar;
}
