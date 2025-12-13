import { Familiar } from "kolmafia";
import {
  $familiar,
  $item,
  Delayed,
  findLeprechaunMultiplier,
  get,
  getAverageAdventures,
  have,
  propertyTypes,
  undelay,
} from "libram";
import { globalOptions } from "../config";
import { estimatedBarfExperience, FamiliarMode, GeneralFamiliar } from "./lib";
import { MEAT_TARGET_MULTIPLIER } from "../lib";
import { mimicExperienceNeeded, shouldChargeMimic } from "../resources";

type ExperienceFamiliar = {
  familiar: Familiar;
  used: propertyTypes.BooleanProperty | ((mode: FamiliarMode) => boolean);
  useValue: Delayed<number>;
  baseExp: number;
  xpCost?: number;
  xpLimit?: (mode: FamiliarMode) => number;
};

const isUsed = (
  used: propertyTypes.BooleanProperty | ((mode: FamiliarMode) => boolean),
  mode: FamiliarMode,
) => (typeof used === "string" ? get(used) : used(mode));

const experienceFamiliars: ExperienceFamiliar[] = [
  {
    familiar: $familiar`Pocket Professor`,
    used: "_thesisDelivered",
    useValue: 11 * get("valueOfAdventure"),
    baseExp: 200,
  },
  {
    familiar: $familiar`Grey Goose`,
    used: "_meatifyMatterUsed",
    useValue: 15 ** 4,
    baseExp: 25,
  },
  {
    familiar: $familiar`Chest Mimic`,
    used: (mode: FamiliarMode) => !shouldChargeMimic(mode === "barf"),
    useValue: () => MEAT_TARGET_MULTIPLIER() * get("valueOfAdventure"),
    baseExp: 0,
    xpCost: 50,
    xpLimit: (mode: FamiliarMode) => mimicExperienceNeeded(mode === "barf"),
  },
  {
    familiar: $familiar`Cooler Yeti`,
    used: () => {
      return (
        $familiar`Cooler Yeti`.experience >= 400 ||
        globalOptions.ascend ||
        !globalOptions.prefs.chargeYeti
      );
    },
    // Vintage Smart Drink is 40 adventures
    useValue:
      getAverageAdventures($item`vintage smart drink`) *
      get("valueOfAdventure"),
    baseExp: 0,
  },
];

function valueExperienceFamiliar(
  { familiar, useValue, xpCost, baseExp }: ExperienceFamiliar,
  mode: FamiliarMode,
): GeneralFamiliar {
  const currentExp =
    familiar.experience || (have($familiar`Shorter-Order Cook`) ? 100 : 0);
  const experienceNeeded =
    xpCost ?? 400 - (globalOptions.ascend ? currentExp : baseExp);
  const estimatedExperience = mode === "free" ? 12 : estimatedBarfExperience();
  return {
    familiar,
    expectedValue: undelay(useValue) / (experienceNeeded / estimatedExperience),
    leprechaunMultiplier: findLeprechaunMultiplier(familiar),
    limit: "experience",
    worksOnFreeRun: false,
  };
}

export default function getExperienceFamiliars(
  mode: FamiliarMode,
): GeneralFamiliar[] {
  return experienceFamiliars
    .filter(
      ({ used, familiar, xpLimit }) =>
        have(familiar) &&
        !isUsed(used, mode) &&
        familiar.experience < (xpLimit?.(mode) ?? 400),
    )
    .map((f) => valueExperienceFamiliar(f, mode));
}

export function getExperienceFamiliarLimit(fam: Familiar): number {
  const target = experienceFamiliars.find(({ familiar }) => familiar === fam);
  if (!have(fam) || !target) return 0;

  return (
    ((target.xpLimit?.("barf") ?? 400) - fam.experience) /
    estimatedBarfExperience()
  );
}
