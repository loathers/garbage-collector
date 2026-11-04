import { canEquip, Familiar, familiarEquipment } from "kolmafia";
import {
  $familiar,
  $familiars,
  $item,
  findLeprechaunMultiplier,
  get,
  have,
  maxBy,
  ToyCupidBow,
} from "libram";
import { globalOptions } from "../config";
import { propertyManager } from "../lib";
import {
  CupidBowAction,
  familiarEquipmentValue,
  GeneralFamiliar,
  getUsedTcbFamiliars,
  tcbTurnsLeft,
} from "./lib";

export type CupidBowDrop = { equipmentValue: number; fightsLeft: number };
export type CupidBowDrops = ReadonlyMap<Familiar, CupidBowDrop>;
export type CupidBowChoice<T extends GeneralFamiliar = GeneralFamiliar> = T & {
  cupidBow: CupidBowAction;
  cupidBowTurns: number;
};

// Familiars that should never be introduced as a surprise.
const NO_TCB_FAMILIARS = $familiars`Mini-Hipster, Artistic Goth Kid`;

export function getCupidBowDrops(
  fightsAvailable: number,
  eligible: (familiar: Familiar) => boolean,
): CupidBowDrops {
  const drops = new Map<Familiar, CupidBowDrop>();
  if (!ToyCupidBow.have()) return drops;

  const used = getUsedTcbFamiliars();
  for (const familiar of Familiar.all()) {
    if (!have(familiar) || !eligible(familiar)) continue;
    if (!canEquip(familiar, $item`toy Cupid bow`)) continue;
    if (used.has(familiar)) continue;
    const fightsLeft = tcbTurnsLeft(familiar, used);
    if (fightsLeft > fightsAvailable) continue;

    const equipmentValue = familiarEquipmentValue(familiar);
    if (equipmentValue > 0) drops.set(familiar, { equipmentValue, fightsLeft });
  }
  return drops;
}

function canIntroduceCupidBowFamiliar(familiar: Familiar): boolean {
  if (
    NO_TCB_FAMILIARS.includes(familiar) ||
    familiar === $familiar`Doppelshifter`
  ) {
    return false;
  }
  if (
    !familiarEquipment(familiar).tradeable &&
    familiar !== $familiar`Cornbeefadon`
  ) {
    return false;
  }
  if (
    familiar === $familiar`Mini-Adventurer` &&
    !get("miniAdvClass") &&
    !get("choiceAdventure768")
  ) {
    if (!globalOptions.ascend) return false;
    propertyManager.setChoice(768, 4);
  }
  return true;
}

/** Additional familiars whose only reason to enter the menu is a bow drop. */
export function getToyCupidBowFamiliars<T extends GeneralFamiliar>(
  ordinary: T[],
  drops: CupidBowDrops,
  evaluate: (candidate: GeneralFamiliar) => T,
): T[] {
  const ordinaryFamiliars = new Set(ordinary.map(({ familiar }) => familiar));
  return [...drops.keys()]
    .filter(
      (familiar) =>
        !ordinaryFamiliars.has(familiar) &&
        canIntroduceCupidBowFamiliar(familiar),
    )
    .map((familiar) =>
      evaluate({
        familiar,
        expectedValue: 0,
        leprechaunMultiplier: findLeprechaunMultiplier(familiar),
        worksOnFreeRun: true,
        limit: "none",
      }),
    );
}

/** Future profit lost by discarding current progress rather than finishing it. */
export function calculateCupidBowResetCost(
  { equipmentValue, fightsLeft }: CupidBowDrop,
  fightsAvailable: number,
  opportunityCost: number,
): number {
  if (fightsLeft >= 5 || fightsLeft > fightsAvailable) return 0;

  const costPerFight = Math.max(0, opportunityCost);
  const profitFromFinishing = Math.max(
    0,
    equipmentValue - fightsLeft * costPerFight,
  );
  const profitFromRestarting =
    fightsAvailable >= 5 ? Math.max(0, equipmentValue - 5 * costPerFight) : 0;
  return profitFromFinishing - profitFromRestarting;
}

export function cupidBowResetCost<T extends GeneralFamiliar>(
  candidates: T[],
  drops: CupidBowDrops,
  fightsAvailable: number,
  valueWithoutDrop: (candidate: T) => number,
  baseline: number,
): number {
  const current = ToyCupidBow.currentFamiliar();
  const drop = current && drops.get(current);
  if (!drop) return 0;

  const currentCandidates = candidates.filter(
    ({ familiar }) => familiar === current,
  );
  if (!currentCandidates.length) return 0;
  const candidate = maxBy(currentCandidates, valueWithoutDrop);
  return calculateCupidBowResetCost(
    drop,
    fightsAvailable,
    baseline - valueWithoutDrop(candidate),
  );
}

/** Choose the better equipment for this familiar; its ordinary limit stays intact. */
export function chooseCupidBow<T extends GeneralFamiliar>(
  candidate: T,
  drops: CupidBowDrops,
  resetCost: number,
  {
    equipmentAvailable,
    extraValue = 0,
  }: { equipmentAvailable: boolean; extraValue?: number },
): CupidBowChoice<T> {
  const cost =
    candidate.familiar === ToyCupidBow.currentFamiliar() ? 0 : resetCost;
  const normal: CupidBowChoice<T> = {
    ...candidate,
    cupidBow: cost > 0 ? "avoid" : "allow",
    cupidBowTurns: 0,
  };
  if (
    !equipmentAvailable ||
    !ToyCupidBow.have() ||
    !canEquip(candidate.familiar, $item`toy Cupid bow`)
  ) {
    return normal;
  }

  const drop = drops.get(candidate.familiar);
  const benefit = drop
    ? drop.equipmentValue / drop.fightsLeft +
      extraValue -
      cost / drop.fightsLeft
    : extraValue - cost;
  if (benefit <= 0) return normal;

  return {
    ...candidate,
    expectedValue: candidate.expectedValue + benefit,
    cupidBow: "equip",
    cupidBowTurns: drop?.fightsLeft ?? 0,
  };
}

export function shortlistCupidBowFamiliars<T extends GeneralFamiliar>(
  choices: CupidBowChoice<T>[],
  value: (candidate: CupidBowChoice<T>) => number,
): CupidBowChoice<T>[] {
  const multipliers = new Set(
    choices.map(({ leprechaunMultiplier }) => leprechaunMultiplier),
  );
  const bestByMultiplier = new Set(
    [...multipliers].map((multiplier) =>
      maxBy(
        choices.filter(
          ({ leprechaunMultiplier }) => leprechaunMultiplier === multiplier,
        ),
        value,
      ),
    ),
  );
  const current = ToyCupidBow.currentFamiliar();
  return choices.filter(
    (choice) => bestByMultiplier.has(choice) || choice.familiar === current,
  );
}

export function maximumCupidBowResetCost(
  candidates: GeneralFamiliar[],
  drops: CupidBowDrops,
  fightsAvailable: number,
  farmingResetCost: number,
): number {
  const value = ({ expectedValue }: GeneralFamiliar) => expectedValue;
  const baseline = value(maxBy(candidates, value));
  const freeFightResetCost = cupidBowResetCost(
    candidates,
    drops,
    fightsAvailable,
    value,
    baseline,
  );

  // A familiar that cannot earn its ordinary benefit on a free run can still advance the bow.
  const runCandidates = candidates.map((candidate): GeneralFamiliar => {
    if (candidate.worksOnFreeRun) return candidate;
    return {
      ...candidate,
      expectedValue: 0,
      worksOnFreeRun: true,
      limit: "none",
    };
  });
  const current = ToyCupidBow.currentFamiliar();
  const alternatives = runCandidates.filter(
    ({ familiar }) => familiar !== current,
  );
  const runValue = (candidate: GeneralFamiliar) => {
    const drop = drops.get(candidate.familiar);
    return (
      candidate.expectedValue +
      (drop ? drop.equipmentValue / drop.fightsLeft : 0)
    );
  };
  const runBaseline = alternatives.length
    ? runValue(maxBy(alternatives, runValue))
    : 0;
  const freeRunResetCost = cupidBowResetCost(
    runCandidates,
    drops,
    fightsAvailable,
    value,
    runBaseline,
  );
  return Math.max(farmingResetCost, freeFightResetCost, freeRunResetCost);
}
