import { Familiar } from "kolmafia";
import {
  $familiar,
  $item,
  Delayed,
  findLeprechaunMultiplier,
  get,
  getAverageAdventures,
  GreyGoose,
  have,
  propertyTypes,
  undelay,
} from "libram";
import { globalOptions } from "../config";
import { estimatedBarfExperience, FamiliarMode, GeneralFamiliar } from "./lib";
import { MEAT_TARGET_MULTIPLIER } from "../lib";
import {
  mimicExperienceNeeded,
  shouldChargeMimic,
} from "../resources/chestMimic";

type ExperienceFamiliar = {
  familiar: Familiar;
  used: propertyTypes.BooleanProperty | ((mode: FamiliarMode) => boolean);
  experienceValue: (experience: number) => number;
  cashout?: boolean;
  currentExperience?: () => number;
  xpLimit?: (mode: FamiliarMode) => number;
};

type ExperiencePurpose = "charging" | "award";

const isUsed = (
  used: propertyTypes.BooleanProperty | ((mode: FamiliarMode) => boolean),
  mode: FamiliarMode,
) => (typeof used === "string" ? get(used) : used(mode));

const experienceFamiliars: ExperienceFamiliar[] = [
  {
    familiar: $familiar`Pocket Professor`,
    used: "_thesisDelivered",
    experienceValue: (experience) =>
      (experience * 11 * get("valueOfAdventure")) / 200,
  },
  {
    familiar: $familiar`Grey Goose`,
    used: "_meatifyMatterUsed",
    experienceValue: (experience) =>
      GreyGoose.expectedMeat(Math.floor(Math.sqrt(experience))),
    cashout: true,
    currentExperience: GreyGoose.currentExperience,
  },
  {
    familiar: $familiar`Chest Mimic`,
    used: (mode: FamiliarMode) => !shouldChargeMimic(mode === "barf"),
    experienceValue: (experience) =>
      (experience * MEAT_TARGET_MULTIPLIER() * get("valueOfAdventure")) / 50,
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
    experienceValue: (experience) =>
      (experience *
        getAverageAdventures($item`vintage smart drink`) *
        get("valueOfAdventure")) /
      400,
  },
];

function valueExperienceFamiliar(
  {
    familiar,
    experienceValue,
    cashout,
    currentExperience,
    xpLimit,
  }: ExperienceFamiliar,
  mode: FamiliarMode,
  experience: number,
  purpose: ExperiencePurpose,
): GeneralFamiliar {
  const currentExp =
    currentExperience?.() ??
    (familiar.experience || (have($familiar`Shorter-Order Cook`) ? 100 : 0));
  const limit = xpLimit?.(mode) ?? 400;
  const remainingExperience = Math.max(0, limit - currentExp);
  const usefulExperience =
    globalOptions.ascend || cashout
      ? Math.min(experience, remainingExperience)
      : experience;
  let expectedValue = experienceValue(usefulExperience);
  if (cashout) {
    const currentValue = experienceValue(currentExp);
    expectedValue =
      purpose === "award"
        ? experienceValue(currentExp + usefulExperience) - currentValue
        : remainingExperience > 0
          ? ((experienceValue(limit) - currentValue) * usefulExperience) /
            remainingExperience
          : 0;
  }
  return {
    familiar,
    expectedValue,
    leprechaunMultiplier: findLeprechaunMultiplier(familiar),
    limit: "experience",
    worksOnFreeRun: false,
  };
}

export function experienceChargingValue(
  familiar: Familiar,
  mode: FamiliarMode,
): number {
  const target = experienceFamiliars.find((f) => f.familiar === familiar);
  return target
    ? valueExperienceFamiliar(target, mode, 1, "charging").expectedValue
    : 0;
}

export default function getExperienceFamiliars(
  mode: FamiliarMode,
  experience: Delayed<number, [Familiar]> = mode === "free"
    ? 12
    : estimatedBarfExperience(),
  purpose: ExperiencePurpose = "charging",
): GeneralFamiliar[] {
  return experienceFamiliars
    .filter(
      ({ used, familiar, xpLimit, currentExperience }) =>
        have(familiar) &&
        !isUsed(used, mode) &&
        (currentExperience?.() ?? familiar.experience) <
          (xpLimit?.(mode) ?? 400),
    )
    .map((f) =>
      valueExperienceFamiliar(
        f,
        mode,
        undelay(experience, f.familiar),
        purpose,
      ),
    );
}

export function getExperienceFamiliarLimit(fam: Familiar): number {
  const target = experienceFamiliars.find(({ familiar }) => familiar === fam);
  if (!have(fam) || !target) return 0;

  const experience = target.currentExperience?.() ?? fam.experience;
  return (
    ((target.xpLimit?.("barf") ?? 400) - experience) / estimatedBarfExperience()
  );
}
