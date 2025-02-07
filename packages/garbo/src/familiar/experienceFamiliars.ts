import { Familiar } from "kolmafia";
import {
  $familiar,
  Delayed,
  findLeprechaunMultiplier,
  get,
  have,
  propertyTypes,
  undelay,
} from "libram";
import { globalOptions } from "../config";
import { estimatedBarfExperience, GeneralFamiliar } from "./lib";
import { MEAT_TARGET_MULTIPLIER } from "../lib";
import { mimicExperienceNeeded, shouldChargeMimic } from "../resources";

type ExperienceFamiliar = {
  familiar: Familiar;
  used:
    | propertyTypes.BooleanProperty
    | ((mode: "barf" | "free" | "target") => boolean);
  useValue: Delayed<number>;
  baseExp: number;
  xpCost?: number;
  xpLimit?: (mode: "barf" | "free" | "target") => number;
};

const isUsed = (
  used:
    | propertyTypes.BooleanProperty
    | ((mode: "barf" | "free" | "target") => boolean),
  mode: "barf" | "free" | "target",
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
    used: (mode: "barf" | "free" | "target") =>
      !shouldChargeMimic(mode === "barf"),
    useValue: () => MEAT_TARGET_MULTIPLIER() * get("valueOfAdventure"),
    baseExp: 0,
    xpCost: 50,
    xpLimit: (mode: "barf" | "free" | "target") =>
      mimicExperienceNeeded(mode === "barf"),
  },
];

function valueExperienceFamiliar(
  { familiar, useValue, xpCost, baseExp }: ExperienceFamiliar,
  mode: "barf" | "free" | "target",
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
  mode: "barf" | "free" | "target",
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
