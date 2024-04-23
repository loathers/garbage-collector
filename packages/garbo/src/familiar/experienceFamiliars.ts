import { Familiar } from "kolmafia";
import {
  $familiar,
  findLeprechaunMultiplier,
  get,
  have,
  propertyTypes,
} from "libram";
import { globalOptions } from "../config";
import { GeneralFamiliar } from "./lib";

type ExperienceFamiliar = {
  familiar: Familiar;
  used: propertyTypes.BooleanProperty;
  useValue: number;
  baseExp: number;
  xpLimit?: number;
};

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
    expectedValue: useValue / (experienceNeeded / estimatedExperience),
    leprechaunMultiplier: findLeprechaunMultiplier(familiar),
    limit: "experience",
  };
}

export default function getExperienceFamiliars(): GeneralFamiliar[] {
  return experienceFamiliars
    .filter(
      ({ used, familiar, xpLimit }) =>
        have(familiar) && !get(used) && familiar.experience < (xpLimit ?? 400),
    )
    .map(valueExperienceFamiliar);
}

export function getExperienceFamiliarLimit(fam: Familiar): number {
  const target = experienceFamiliars.find(({ familiar }) => familiar === fam);
  if (!have(fam) || !target) return 0;

  return (400 - fam.experience) / 5;
}
