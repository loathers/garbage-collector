import {
  canEquip,
  Familiar,
  familiarEquipment,
  numericModifier,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $familiars,
  $item,
  clamp,
  findLeprechaunMultiplier,
  get,
  have,
  maxBy,
  totalFamiliarWeight,
  ToyCupidBow,
} from "libram";
import { globalOptions } from "../config";
import { FarmingStrategy } from "../farmingStrategy";
import { AdventureArgument } from "../garboWanderer";
import { garboValue } from "../garboValue";
import { withLocation } from "../lib";
import { estimatedGarboTurns } from "../turns";
import { menu } from "./freeFightFamiliar";
import { amuletCoinValue, GeneralFamiliar, turnsAvailable } from "./lib";
import { specialFamiliarOutfits } from "./specialFamiliarOutfits";

export const getUsedTcbFamiliars = () => new Set(ToyCupidBow.familiarsToday());

export const tcbTurnsLeft = (
  familiar: Familiar,
  usedFamiliars: Set<Familiar>,
) =>
  usedFamiliars.has(familiar)
    ? Infinity
    : ToyCupidBow.currentFamiliar() === familiar
      ? clamp(5 - get("cupidBowFights"), 1, 5)
      : 5;

export function shouldAvoidTemporaryCupidBowSwap(
  familiar: Familiar,
  combatCount: number,
): boolean {
  if (!ToyCupidBow.have() || combatCount >= 5) return false;
  const currentFamiliar = ToyCupidBow.currentFamiliar();

  // Keep progress if we aren't switching long enough to actually get the drop
  return (
    currentFamiliar !== null &&
    currentFamiliar !== familiar &&
    get("cupidBowFights") > 0 &&
    !ToyCupidBow.doneToday(currentFamiliar)
  );
}

export function familiarEquipmentValue(familiar: Familiar): number {
  if (familiar === $familiar`Cornbeefadon`) {
    return have($item`amulet coin`) ? 0 : amuletCoinValue();
  }
  if (
    $familiars`Frozen Gravy Fairy, Flaming Gravy Fairy, Sleazy Gravy Fairy, Spooky Gravy Fairy, Stinky Gravy Fairy`.includes(
      familiar,
    )
  ) {
    return garboValue($item`heart necklace`);
  }
  return garboValue(familiarEquipment(familiar));
}

export function amuletCoinOpportunityCost(familiar: Familiar): number {
  if (!have($item`amulet coin`)) return 0;
  const leprechaunMultiplier = findLeprechaunMultiplier(familiar);
  // Approximate the Meat lost from the coin's Meat Drop and familiar weight.
  return (
    (50 + 10 * (2 * leprechaunMultiplier + Math.sqrt(leprechaunMultiplier))) *
    FarmingStrategy.meatDropValue()
  );
}

export function calculateCupidBowResetCost(
  equipmentValue: number,
  fightsLeft: number,
  fightsAvailable: number,
  opportunityCost: number,
): number {
  if (fightsLeft >= 5 || fightsLeft > fightsAvailable) return 0;
  const costPerFight = Math.max(0, opportunityCost);
  const profitFromFinishing = Math.max(
    0,
    equipmentValue - fightsLeft * costPerFight,
  );
  // With enough fights left, resetting need not forfeit the whole drop.
  const profitFromRestarting =
    fightsAvailable >= 5 ? Math.max(0, equipmentValue - 5 * costPerFight) : 0;
  return profitFromFinishing - profitFromRestarting;
}

function farmingFamiliarValue({
  familiar,
  expectedValue,
}: Pick<GeneralFamiliar, "familiar" | "expectedValue">): number {
  // Use current buffed weight for this estimate. Building farming outfits here
  // would populate their cache before farming buffs are ready.
  const weight = totalFamiliarWeight(familiar);
  const equipment = specialFamiliarOutfits.get(familiar)?.equip ?? $item.none;
  return (
    expectedValue +
    numericModifier(familiar, "Meat Drop", weight, equipment) *
      FarmingStrategy.meatDropValue() +
    numericModifier(familiar, "Item Drop", weight, equipment) *
      FarmingStrategy.itemDropValue()
  );
}

function farmingResetCost(
  currentFamiliar: Familiar,
  equipmentValue: number,
  fightsLeft: number,
): number {
  if (
    globalOptions.nobarf ||
    get("garbo_IgnoreMarginalFamiliars", false) ||
    specialFamiliarOutfits.get(currentFamiliar)?.equip ||
    (FarmingStrategy.isUnderwater() &&
      !have($effect`Driving Waterproofly`) &&
      !currentFamiliar.underwater)
  ) {
    return 0;
  }
  return withLocation(FarmingStrategy.location, () => {
    const farmingFamiliars = menu(FarmingStrategy.location, {
      mode: "barf",
      cupidBowValues: new Map(),
    });
    const cruisingFamiliar = maxBy(
      farmingFamiliars.filter(({ limit }) => limit === "none"),
      farmingFamiliarValue,
    );
    const currentCandidates = farmingFamiliars.filter(
      ({ familiar }) => familiar === currentFamiliar,
    );
    const currentValue = currentCandidates.length
      ? farmingFamiliarValue(maxBy(currentCandidates, farmingFamiliarValue))
      : farmingFamiliarValue({ familiar: currentFamiliar, expectedValue: 0 });
    return calculateCupidBowResetCost(
      equipmentValue,
      fightsLeft,
      turnsAvailable(),
      farmingFamiliarValue(cruisingFamiliar) -
        currentValue +
        amuletCoinOpportunityCost(currentFamiliar),
    );
  });
}

function cupidBowResetCost(
  adventure: AdventureArgument,
  dropBonuses: ReadonlyMap<Familiar, number>,
  fightsAvailable: number,
  usedFamiliars: Set<Familiar>,
): number {
  const currentFamiliar = ToyCupidBow.currentFamiliar();
  if (!currentFamiliar) return 0;
  const fightsLeft = tcbTurnsLeft(currentFamiliar, usedFamiliars);
  if (fightsLeft >= 5 || fightsLeft > fightsAvailable) return 0;
  const equipmentValue = (dropBonuses.get(currentFamiliar) ?? 0) * fightsLeft;
  if (!equipmentValue) return 0;

  // Exclude bow income when measuring the cost of spending fights on this
  // familiar. The empty map also prevents recursive reset-cost valuation.
  const freeFightFamiliars = menu(adventure, { cupidBowValues: new Map() });
  const currentCandidates = freeFightFamiliars.filter(
    ({ familiar }) => familiar === currentFamiliar,
  );
  const currentValue = currentCandidates.length
    ? maxBy(currentCandidates, "expectedValue").expectedValue
    : 0;
  const freeFightResetCost = calculateCupidBowResetCost(
    equipmentValue,
    fightsLeft,
    fightsAvailable,
    maxBy(freeFightFamiliars, "expectedValue").expectedValue - currentValue,
  );

  const runFamiliarValue = ({
    familiar,
    expectedValue,
    worksOnFreeRun,
  }: Pick<GeneralFamiliar, "familiar" | "expectedValue" | "worksOnFreeRun">) =>
    (worksOnFreeRun ? expectedValue : 0) + (dropBonuses.get(familiar) ?? 0);
  const runAlternatives = [
    ...freeFightFamiliars,
    ...[...dropBonuses.keys()].map((familiar) => ({
      familiar,
      expectedValue: 0,
      worksOnFreeRun: true,
    })),
  ].filter(({ familiar }) => familiar !== currentFamiliar);
  const currentRunCandidates = currentCandidates.filter(
    ({ worksOnFreeRun }) => worksOnFreeRun,
  );
  // Runs can advance the bow even when they cannot earn the familiar's normal
  // benefit, and competing bow drops still occupy those fights.
  const freeRunResetCost = calculateCupidBowResetCost(
    equipmentValue,
    fightsLeft,
    fightsAvailable,
    (runAlternatives.length
      ? runFamiliarValue(maxBy(runAlternatives, runFamiliarValue))
      : 0) -
      (currentRunCandidates.length
        ? maxBy(currentRunCandidates, "expectedValue").expectedValue
        : 0),
  );
  return Math.max(
    farmingResetCost(currentFamiliar, equipmentValue, fightsLeft),
    freeFightResetCost,
    freeRunResetCost,
  );
}

export function getCupidBowValues(
  adventure: AdventureArgument = FarmingStrategy.location,
): ReadonlyMap<Familiar, number> {
  if (!ToyCupidBow.have()) return new Map();
  const fightsAvailable = Math.max(estimatedGarboTurns(), 1);
  const usedFamiliars = getUsedTcbFamiliars();
  const equippableFamiliars = Familiar.all().filter(
    (familiar) => have(familiar) && canEquip(familiar, $item`toy Cupid bow`),
  );
  const dropBonuses = new Map(
    equippableFamiliars
      // Don't want to equip doppel by accident
      .filter(
        (familiar) =>
          !usedFamiliars.has(familiar) && familiar !== $familiar`Doppelshifter`,
      )
      .map((familiar) => {
        const fightsLeft = tcbTurnsLeft(familiar, usedFamiliars);
        return [
          familiar,
          fightsLeft <= fightsAvailable
            ? Math.max(0, familiarEquipmentValue(familiar)) / fightsLeft
            : 0,
        ] as const;
      }),
  );
  const resetCost = cupidBowResetCost(
    adventure,
    dropBonuses,
    fightsAvailable,
    usedFamiliars,
  );
  const currentFamiliar = ToyCupidBow.currentFamiliar();
  return new Map(
    equippableFamiliars.map((familiar) => {
      const dropBonus = dropBonuses.get(familiar) ?? 0;
      // A new drop spreads the reset cost over its remaining fights. Without
      // an attainable drop, wearing the bow incurs the whole reset penalty.
      const resetPenalty =
        familiar === currentFamiliar
          ? 0
          : dropBonus > 0
            ? resetCost / tcbTurnsLeft(familiar, usedFamiliars)
            : resetCost;
      return [familiar, dropBonus - resetPenalty];
    }),
  );
}
