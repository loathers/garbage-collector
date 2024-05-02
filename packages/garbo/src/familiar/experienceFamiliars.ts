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
import { GeneralFamiliar } from "./lib";
import { EMBEZZLER_MULTIPLIER } from "../lib";

type ExperienceFamiliar = {
  familiar: Familiar;
  used: propertyTypes.BooleanProperty | (() => boolean);
  useValue: Delayed<number>;
  baseExp: number;
  xpLimit?: number;
};

const isUsed = (used: propertyTypes.BooleanProperty | (() => boolean)) =>
  typeof used === "string" ? get(used) : used();

function mimicValue(): number {
  return get("valueOfAdventure") * EMBEZZLER_MULTIPLIER() * 11;
}

function mimicUsed(): boolean {
  return get("_mimicEggsObtained") >= 11;
}

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
    used: mimicUsed,
    useValue: mimicValue,
    baseExp: 0,
  },
];

function valueExperienceFamiliar({
  familiar,
  useValue,
  baseExp,
}: ExperienceFamiliar): GeneralFamiliar {
  const currentExp =
    familiar.experience || (have($familiar`Shorter-Order Cook`) ? 100 : 0);
  const experienceNeeded = 400 - (globalOptions.ascend ? currentExp : baseExp);
  const estimatedExperience = 12;
  return {
    familiar,
    expectedValue: undelay(useValue) / (experienceNeeded / estimatedExperience),
    leprechaunMultiplier: findLeprechaunMultiplier(familiar),
    limit: "experience",
  };
}

export default function getExperienceFamiliars(): GeneralFamiliar[] {
  return experienceFamiliars
    .filter(
      ({ used, familiar, xpLimit }) =>
        have(familiar) &&
        !isUsed(used) &&
        familiar.experience < (xpLimit ?? 400),
    )
    .map(valueExperienceFamiliar);
}

export function getExperienceFamiliarLimit(fam: Familiar): number {
  const target = experienceFamiliars.find(({ familiar }) => familiar === fam);
  if (!have(fam) || !target) return 0;

  return (400 - fam.experience) / 5;
}
