import {
  Familiar,
  familiarWeight,
  inebrietyLimit,
  myInebriety,
} from "kolmafia";
import {
  $element,
  $familiar,
  $item,
  AdventureTarget,
  adventureTargetToWeightedMap,
  clamp,
  findLeprechaunMultiplier,
  get,
  getModifier,
  have,
  SkeletonOfCrimboPast,
  Snapper,
  sum,
} from "libram";
import { canOpenRedPresent } from ".";
import { garboValue } from "../garboValue";
import getConstantValueFamiliars from "./constantValueFamiliars";
import getDropFamiliars from "./dropFamiliars";
import getExperienceFamiliars from "./experienceFamiliars";
import {
  FamiliarMode,
  GeneralFamiliar,
  getUsedTcbFamiliars,
  snapperValue,
  tcbValue,
  timeToMeatify,
} from "./lib";
import { meatFamiliar } from "./meatFamiliar";
import { gooseDroneEligible, valueDrops } from "../lib";
import { globalOptions } from "../config";
import { copyTargetCount } from "../target";
import { getToyCupidBowFamiliars } from "./toyCupidBowFamiliar";

export type FamiliarMenuOptions = Partial<{
  canChooseMacro: boolean;
  extraFamiliars: GeneralFamiliar[];
  excludeFamiliar: Familiar[];
  includeExperienceFamiliars: boolean;
  allowAttackFamiliars: boolean;
  mode: FamiliarMode;
  equipmentForced: boolean;
}>;

export function menu(
  target: AdventureTarget,
  {
    canChooseMacro = true,
    extraFamiliars = [],
    excludeFamiliar = [],
    includeExperienceFamiliars = true,
    allowAttackFamiliars = true,
    mode = "free",
  } = {} as FamiliarMenuOptions,
): GeneralFamiliar[] {
  const familiarMenu = [
    ...getConstantValueFamiliars(mode),
    ...getDropFamiliars(),
    ...getToyCupidBowFamiliars(),
    ...(includeExperienceFamiliars ? getExperienceFamiliars(mode) : []),
    ...extraFamiliars,
  ];

  const monsterRates = adventureTargetToWeightedMap(target);

  if (canChooseMacro && myInebriety() <= inebrietyLimit()) {
    if (timeToMeatify()) {
      familiarMenu.push({
        familiar: $familiar`Grey Goose`,
        expectedValue:
          (Math.max(familiarWeight($familiar`Grey Goose`) - 5), 0) ** 4,
        leprechaunMultiplier: 0,
        limit: "experience",
        worksOnFreeRun: false,
      });
    }

    if (
      mode === "target" &&
      gooseDroneEligible() &&
      get("gooseDronesRemaining") < copyTargetCount()
    ) {
      familiarMenu.push({
        familiar: $familiar`Grey Goose`,
        expectedValue:
          // It takes 9 experience to go from level 5 to 6 and emit a drone
          clamp(
            getModifier("Familiar Experience") / 9,
            0,
            // The limit to how valuable any emission can be is how many drones are actually gonna hit the copyTarget
            copyTargetCount() - get("gooseDronesRemaining"),
          ) * valueDrops(globalOptions.target),
        leprechaunMultiplier: 0,
        limit: "experience",
        worksOnFreeRun: false,
      });
    }

    if (mode === "target" && Snapper.have()) {
      familiarMenu.push({
        familiar: $familiar`Red-Nosed Snapper`,
        expectedValue: snapperValue(),
        leprechaunMultiplier: 0,
        limit: "special",
        worksOnFreeRun: false,
      });
    }

    if (canOpenRedPresent()) {
      familiarMenu.push({
        familiar: $familiar`Crimbo Shrub`,
        expectedValue: 2500,
        leprechaunMultiplier: 0,
        limit: "special",
        worksOnFreeRun: true,
      });
    }

    if (have($familiar`Space Jellyfish`)) {
      familiarMenu.push({
        familiar: $familiar`Space Jellyfish`,
        expectedValue: sum([...monsterRates.entries()], ([monster, rate]) =>
          monster.defenseElement === $element`Stench`
            ? (rate * garboValue($item`stench jelly`)) /
              (get("_spaceJellyfishDrops") < 5
                ? get("_spaceJellyfishDrops") + 1
                : 20)
            : 0,
        ),
        leprechaunMultiplier: 0,
        limit: "special",
        worksOnFreeRun: true,
      });
    }
  }

  if (SkeletonOfCrimboPast.have()) {
    familiarMenu.push({
      familiar: $familiar`Skeleton of Crimbo Past`,
      expectedValue:
        SkeletonOfCrimboPast.expectedBones(target) *
        garboValue($item`knucklebone`),
      leprechaunMultiplier: 0,
      limit: "special",
      worksOnFreeRun: false,
    });
  }

  const meatFam = meatFamiliar();

  familiarMenu.push({
    familiar: meatFam,
    expectedValue: 0,
    leprechaunMultiplier: findLeprechaunMultiplier(meatFam),
    limit: "none",
    // Because strictly speaking this is better than using no familiar at all
    worksOnFreeRun: true,
  });

  return familiarMenu.filter(
    ({ familiar, worksOnFreeRun }) =>
      (mode !== "run" || worksOnFreeRun) &&
      (allowAttackFamiliars ||
        !(familiar.physicalDamage || familiar.elementalDamage)) &&
      !excludeFamiliar.some(
        (excludedFamiliar) => excludedFamiliar === familiar,
      ),
  );
}

export function getAllJellyfishDrops(): {
  expectedValue: number;
  turnsAtValue: number;
}[] {
  if (!have($familiar`Space Jellyfish`)) {
    return [{ expectedValue: 0, turnsAtValue: 0 }];
  }

  const current = get("_spaceJellyfishDrops");
  const returnValue = [];

  for (
    let dropNumber = clamp(current + 1, 0, 6);
    dropNumber <= 6;
    dropNumber++
  ) {
    returnValue.push({
      expectedValue:
        garboValue($item`stench jelly`) / (dropNumber > 5 ? 20 : dropNumber),
      turnsAtValue: dropNumber > 5 ? Infinity : dropNumber,
    });
  }

  return returnValue;
}

export function freeFightFamiliarData(
  target: AdventureTarget,
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

  return menu(target, options).reduce(compareFamiliars, {
    familiar: $familiar.none,
    expectedValue: 0,
    leprechaunMultiplier: 0,
    limit: "none",
    worksOnFreeRun: true,
  });
}

export function freeFightFamiliar(
  target: AdventureTarget,
  options: FamiliarMenuOptions = {},
): Familiar {
  return freeFightFamiliarData(target, options).familiar;
}
