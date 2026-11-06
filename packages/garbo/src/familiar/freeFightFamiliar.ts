import { Familiar, inebrietyLimit, myInebriety } from "kolmafia";
import {
  $element,
  $familiar,
  $item,
  adventureTargetToWeightedMap,
  clamp,
  findLeprechaunMultiplier,
  get,
  getModifier,
  GreyGoose,
  have,
  maxBy,
  SkeletonOfCrimboPast,
  sum,
} from "libram";

import { garboKnuckleboneValue, garboValue } from "../garboValue";
import getConstantValueFamiliars from "./constantValueFamiliars";
import getDropFamiliars from "./dropFamiliars";
import getExperienceFamiliars from "./experienceFamiliars";
import {
  canOpenRedPresent,
  FamiliarMode,
  GeneralFamiliar,
  snapperReasonable,
  snapperValue,
  timeToMeatify,
} from "./lib";
import { meatFamiliar } from "./meatFamiliar";
import { gooseDroneEligible, valueDrops } from "../lib";
import { globalOptions } from "../config";
import { copyTargetCount } from "../target/fights";
import { getToyCupidBowFamiliars } from "./toyCupidBowFamiliar";
import { getCupidBowValues } from "./toyCupidBowValue";
import { AdventureArgument, toAdventure } from "../garboWanderer";

export type FamiliarMenuOptions = Partial<{
  canChooseMacro: boolean;
  extraFamiliars: GeneralFamiliar[];
  excludeFamiliar: Familiar[];
  includeExperienceFamiliars: boolean;
  allowAttackFamiliars: boolean;
  mode: FamiliarMode;
  equipmentForced: boolean;
  cupidBowValues: ReadonlyMap<Familiar, number>;
}>;

export function menu(
  adventure: AdventureArgument,
  {
    canChooseMacro = true,
    extraFamiliars = [],
    excludeFamiliar = [],
    includeExperienceFamiliars = true,
    allowAttackFamiliars = true,
    mode = "free",
    equipmentForced = false,
    cupidBowValues = equipmentForced ? new Map() : getCupidBowValues(adventure),
  } = {} as FamiliarMenuOptions,
): GeneralFamiliar[] {
  const { target } = toAdventure(adventure);
  const monsterRates = adventureTargetToWeightedMap(target);

  const familiarMenu = [
    ...getConstantValueFamiliars(mode, monsterRates),
    ...getDropFamiliars(),
    ...getToyCupidBowFamiliars(cupidBowValues, mode),
    ...(includeExperienceFamiliars ? getExperienceFamiliars(mode) : []),
    ...extraFamiliars,
  ];

  if (canChooseMacro && myInebriety() <= inebrietyLimit()) {
    if (timeToMeatify()) {
      familiarMenu.push({
        familiar: $familiar`Grey Goose`,
        expectedValue: GreyGoose.expectedMeat(),
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

    if (snapperReasonable(mode)) {
      familiarMenu.push({
        familiar: $familiar`Red-Nosed Snapper`,
        expectedValue: snapperValue(mode),
        leprechaunMultiplier: 0,
        limit: "none",
        worksOnFreeRun: false,
      });
    }

    if (
      mode === "barf" &&
      have($familiar`Sword of S Words`) &&
      get("swordOfSWordsMonster") &&
      get("_swordOfSWordsKills") < 100
    ) {
      familiarMenu.push({
        familiar: $familiar`Sword of S Words`,
        expectedValue: 0, // handled in barf cache
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
        SkeletonOfCrimboPast.expectedBones(target) * garboKnuckleboneValue(),
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
  adventure: AdventureArgument,
  options: FamiliarMenuOptions = {},
): GeneralFamiliar {
  const cupidBowValues = options.equipmentForced
    ? new Map<Familiar, number>()
    : (options.cupidBowValues ?? getCupidBowValues(adventure));
  const familiarCandidates = [
    ...menu(adventure, { ...options, cupidBowValues }),
    {
      familiar: $familiar.none,
      expectedValue: 0,
      leprechaunMultiplier: 0,
      limit: "none" as const,
      worksOnFreeRun: true,
    },
  ];
  const valueWithCupidBow = (candidate: GeneralFamiliar) =>
    candidate.expectedValue +
    // Bow-only entries already include this bonus; other familiars can forgo it.
    (candidate.limit === "cupid"
      ? 0
      : Math.max(0, cupidBowValues.get(candidate.familiar) ?? 0));
  const highestFamiliarValue = valueWithCupidBow(
    maxBy(familiarCandidates, valueWithCupidBow),
  );
  return maxBy(
    familiarCandidates.filter(
      (candidate) => valueWithCupidBow(candidate) === highestFamiliarValue,
    ),
    "leprechaunMultiplier",
  );
}

export function freeFightFamiliar(
  target: AdventureArgument,
  options: FamiliarMenuOptions = {},
): Familiar {
  return freeFightFamiliarData(target, options).familiar;
}
