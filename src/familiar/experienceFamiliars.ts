import { Familiar } from "kolmafia";
import { $familiar, findLeprechaunMultiplier, get, have, propertyTypes } from "libram";
import { globalOptions } from "../lib";
import { GeneralFamiliar } from "./lib";

type ExperienceFamiliar = {
  familiar: Familiar;
  used: propertyTypes.BooleanProperty;
  useValue: number;
  baseExp: number;
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
  const currentExp = familiar.experience || (have($familiar`Shorter-Order Cook`) ? 100 : 0);
  const experienceNeeded = 400 - (globalOptions.ascending ? currentExp : baseExp);
  const estimatedExperience = 12;
  return {
    familiar,
    expectedValue: useValue / (experienceNeeded / estimatedExperience),
    leprechaunMultiplier: findLeprechaunMultiplier(familiar),
  };
}

export default function getExperienceFamiliars(): GeneralFamiliar[] {
  return experienceFamiliars
    .filter(({ used, familiar }) => have(familiar) && !get(used) && familiar.experience <= 400)
    .map(valueExperienceFamiliar);
}
