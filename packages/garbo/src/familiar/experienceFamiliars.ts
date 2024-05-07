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
import { EMBEZZLER_MULTIPLIER } from "../lib";
import { mimicExperienceNeeded, shouldChargeMimic } from "../resources";

type ExperienceFamiliar = {
  familiar: Familiar;
  used: propertyTypes.BooleanProperty | (() => boolean);
  useValue: Delayed<number>;
  baseExp: number;
  xpCost?: number;
  xpLimit?: () => number;
};

const isUsed = (used: propertyTypes.BooleanProperty | (() => boolean)) =>
  typeof used === "string" ? get(used) : used();

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
    used: () => !shouldChargeMimic(),
    useValue: () => EMBEZZLER_MULTIPLIER() * get("valueOfAdventure"),
    baseExp: 0,
    xpCost: 50,
    xpLimit: mimicExperienceNeeded,
  },
];

function valueExperienceFamiliar(
  { familiar, useValue, xpCost, baseExp }: ExperienceFamiliar,
  mode: "barf" | "free",
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
  };
}

export default function getExperienceFamiliars(
  mode: "barf" | "free",
): GeneralFamiliar[] {
  return experienceFamiliars
    .filter(
      ({ used, familiar, xpLimit }) =>
        have(familiar) &&
        !isUsed(used) &&
        familiar.experience < (xpLimit?.() ?? 400),
    )
    .map((f) => valueExperienceFamiliar(f, mode));
}

export function getExperienceFamiliarLimit(fam: Familiar): number {
  const target = experienceFamiliars.find(({ familiar }) => familiar === fam);
  if (!have(fam) || !target) return 0;

  return (
    ((target.xpLimit?.() ?? 400) - fam.experience) / estimatedBarfExperience()
  );
}
