import { Familiar, toInt } from "kolmafia";
import { $familiar, findLeprechaunMultiplier, get, have } from "libram";
import { globalOptions } from "../config";
import { GeneralFamiliar } from "./lib";

type ExperienceFamiliar = {
  familiar: Familiar;
  used: boolean;
  useValue: number;
  baseExp: number;
  xpLimit?: number;
};

const experienceFamiliars: ExperienceFamiliar[] = [
  {
    familiar: $familiar`Pocket Professor`,
    used: get("_thesisDelivered"),
    useValue: 11 * get("valueOfAdventure"),
    baseExp: 200,
  },
  {
    familiar: $familiar`Grey Goose`,
    used: get("_meatifyMatterUsed"),
    useValue: 15 ** 4,
    baseExp: 25,
  },
  {
    familiar: $familiar`Chest Mimic`,
    used: get("_mimicEggsObtained") >= 11,
    useValue:
      get("valueOfAdventure") * toInt(get("garbo_embezzlerMultiplier")) * 11,
    baseExp: 50,
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
        have(familiar) && !used && familiar.experience < (xpLimit ?? 400)
    )
    .map(valueExperienceFamiliar);
}

export function getExperienceFamiliarLimit(fam: Familiar): number {
  const target = experienceFamiliars.find(({ familiar }) => familiar === fam);
  if (!have(fam) || !target) return 0;

  return (400 - fam.experience) / 5;
}
