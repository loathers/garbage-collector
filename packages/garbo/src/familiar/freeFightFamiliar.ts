import { Familiar } from "kolmafia";
import { $familiar, findLeprechaunMultiplier } from "libram";
import { AdventureArgument } from "../garboWanderer";
import { estimatedGarboTurns } from "../turns";
import { barfCupidBowResetCost } from "./barfFamiliar";
import { experienceChargingValue } from "./experienceFamiliars";
import { bestFamiliarChoice, GeneralFamiliar } from "./lib";
import { familiarAllowed, FamiliarMenuOptions, menu } from "./menu";
import {
  chooseCupidBow,
  CupidBowChoice,
  getCupidBowDrops,
  getToyCupidBowFamiliars,
  maximumCupidBowResetCost,
} from "./toyCupidBowFamiliar";

export type FamiliarSelectionOptions = FamiliarMenuOptions &
  Partial<{
    forcedFamiliar: Familiar;
    equipmentForced: boolean;
    canEquipCupidBow: (familiar: Familiar) => boolean;
    fightsAvailable: number;
  }>;

export function freeFightFamiliarData(
  adventure: AdventureArgument,
  options: FamiliarSelectionOptions = {},
): CupidBowChoice {
  const fightsAvailable =
    options.fightsAvailable ?? Math.max(estimatedGarboTurns(), 1);
  const fallback = options.forcedFamiliar ?? $familiar.none;
  const ordinary = [
    ...menu(adventure, options),
    {
      familiar: fallback,
      expectedValue: 0,
      leprechaunMultiplier: findLeprechaunMultiplier(fallback),
      limit: "none" as const,
      worksOnFreeRun: true,
    },
  ];
  const cupidBowDrops = getCupidBowDrops(fightsAvailable, (familiar) =>
    familiarAllowed(familiar, options),
  );
  const cupidBowOnly = getToyCupidBowFamiliars(
    ordinary,
    cupidBowDrops,
    (candidate) => candidate,
  );
  const currentCupidBowResetCost = maximumCupidBowResetCost(
    [...ordinary, ...cupidBowOnly],
    cupidBowDrops,
    fightsAvailable,
    barfCupidBowResetCost(),
  );

  const evaluate = (candidate: GeneralFamiliar): CupidBowChoice[] => {
    if (
      options.forcedFamiliar &&
      candidate.familiar !== options.forcedFamiliar
    ) {
      return [];
    }
    return [
      chooseCupidBow(candidate, cupidBowDrops, currentCupidBowResetCost, {
        equipmentAvailable:
          !options.equipmentForced &&
          (options.canEquipCupidBow?.(candidate.familiar) ?? true),
        extraValue:
          candidate.limit === "experience" && options.mode !== "run"
            ? 2 *
              experienceChargingValue(
                candidate.familiar,
                options.mode ?? "free",
              )
            : 0,
      }),
    ];
  };
  const ordinaryChoices = ordinary.flatMap(evaluate);
  const cupidBowOnlyChoices = cupidBowOnly
    .flatMap(evaluate)
    .filter(({ cupidBowTurns }) => cupidBowTurns > 0);
  if (!cupidBowOnlyChoices.length) return bestFamiliarChoice(ordinaryChoices);
  return bestFamiliarChoice([
    ...ordinaryChoices,
    bestFamiliarChoice(cupidBowOnlyChoices),
  ]);
}

export function freeFightFamiliar(
  target: AdventureArgument,
  options: FamiliarSelectionOptions = {},
): Familiar {
  return freeFightFamiliarData(target, options).familiar;
}
