import { Familiar, familiarWeight, inebrietyLimit, Item, Location, myInebriety } from "kolmafia";
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
  allowAttackFamiliars?: boolean;
};
const DEFAULT_MENU_OPTIONS = {
  canChooseMacro: true,
  location: $location`none`,
  extraFamiliars: [],
  includeExperienceFamiliars: true,
  allowAttackFamiliars: true,
};

const jellies = {
  Dinseylandfill: $item`stench jelly`,
  "Spring Break Beach": $item`sleaze jelly`,
  "The Glaciest": $item`cold jelly`,
  "Conspiracy Island": $item`spooky jelly`,
  "That 70s Volcano": $item`hot jelly`,
};

export function menu(options: MenuOptions = {}): GeneralFamiliar[] {
  const {
    includeExperienceFamiliars,
    canChooseMacro,
    location,
    extraFamiliars,
    allowAttackFamiliars,
  } = {
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
      const jelly: Item | undefined = jellies[location.zone];
      if (jelly) {
        const isStench = jelly === $item`stench jelly`;
        const turnsPerJelly =
          get("_spaceJellyfishDrops") < 5 ? get("_spaceJellyfishDrops") + 1 : 20;
        if (isStench || turnsPerJelly === 20) {
          familiarMenu.push({
            familiar: $familiar`Space Jellyfish`,
            expectedValue: garboValue(jelly) / turnsPerJelly,
            leprechaunMultiplier: 0,
            limit: "special",
          });
        }
      }
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

  if (!allowAttackFamiliars) {
    return familiarMenu.filter(
      (fam) => !(fam.familiar.physicalDamage || fam.familiar.elementalDamage)
    );
  }

  return familiarMenu;
}

export function getAllJellyfishDrops(): { expectedValue: number; turnsAtValue: number }[] {
  if (!have($familiar`Space Jellyfish`)) return [{ expectedValue: 0, turnsAtValue: 0 }];

  const current = get("_spaceJellyfishDrops");
  const returnValue = [];

  for (let dropNumber = clamp(current + 1, 0, 6); dropNumber <= 6; dropNumber++) {
    returnValue.push({
      expectedValue: garboValue($item`stench jelly`) / (dropNumber > 5 ? 20 : dropNumber),
      turnsAtValue: dropNumber > 5 ? Infinity : dropNumber,
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
