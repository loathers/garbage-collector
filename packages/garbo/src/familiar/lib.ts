import { availableAmount, Familiar, familiarEquipment } from "kolmafia";
import {
  $effect,
  $familiar,
  $familiars,
  $item,
  $skill,
  clamp,
  findLeprechaunMultiplier,
  get,
  have,
  Snapper,
  sumNumbers,
  ToyCupidBow,
} from "libram";
import { globalOptions } from "../config";
import {
  baseMeat,
  ESTIMATED_OVERDRUNK_TURNS,
  isFree,
  targetMeat,
} from "../lib";
import {
  estimatedGarboTurns,
  highMeatMonsterCount,
  wanderingCopytargetsRemaining,
} from "../turns";
import { garboValue } from "../garboValue";
import { copyTargetCount } from "../target/fights";
import { FarmingStrategy } from "../farmingStrategy";

export type FamiliarMode = "barf" | "free" | "target" | "run";

export type GeneralFamiliar = {
  familiar: Familiar;
  expectedValue: number;
  leprechaunMultiplier: number;
  limit: "drops" | "experience" | "none" | "special" | "cupid";
  worksOnFreeRun: boolean;
};

/**
 * Rough estimate of the  number of barf combats we expect to do. Used for marginal familiar tabulation.
 * @returns A rough estimate of the number of barf combats we expect to do.
 */
export function turnsAvailable(): number {
  const baseTurns = estimatedGarboTurns();
  const digitizes = wanderingCopytargetsRemaining();
  const mapTurns = globalOptions.ascend
    ? clamp(
        availableAmount($item`Map to Safety Shelter Grimace Prime`),
        0,
        ESTIMATED_OVERDRUNK_TURNS,
      )
    : 0;

  const barfTurns = baseTurns - digitizes - mapTurns;
  const barfCombatRate = 1 - 1 / FarmingStrategy.turnsToNC();
  return barfTurns * barfCombatRate;
}

export function estimatedBarfExperience(): number {
  const sources = [1];
  if (
    [
      $skill`Curiosity of Br'er Tarrypin`,
      $effect`Curiosity of Br'er Tarrypin`,
    ].some((x) => have(x))
  ) {
    sources.push(1);
  }
  if (have($skill`Testudinal Teachings`)) sources.push(1 / 6);
  const voter = get("_voteModifier").match(
    /Experience \(familiar\): (\d+)/,
  )?.[1];
  if (voter) sources.push(Number(voter));

  return sumNumbers(sources);
}

export function snapperValue(): number {
  const item = Snapper.phylumItem.get(globalOptions.target.phylum);
  if (!item) return 0;

  const denominator =
    11 -
    (Snapper.getTrackedPhylum() === globalOptions.target.phylum
      ? Snapper.getProgress()
      : 0);
  if (denominator > copyTargetCount()) return 0;

  return garboValue(item) / denominator;
}

export const getUsedTcbFamiliars = () => new Set(ToyCupidBow.familiarsToday());

export const tcbTurnsLeft = (f: Familiar, used: Set<Familiar>) =>
  used.has(f)
    ? Infinity
    : ToyCupidBow.currentFamiliar() === f
      ? clamp(5 - get("cupidBowFights"), 1, 5)
      : 5;

export const amuletCoinValue = () => {
  const [copies, barf] = isFree(globalOptions.target)
    ? [0, estimatedGarboTurns()]
    : (() => {
        const copies = highMeatMonsterCount();
        return [copies, estimatedGarboTurns() - copies];
      })();
  return 0.5 * (barf * baseMeat() + copies * targetMeat());
};

export const familiarEquipmentValue = (f: Familiar) => {
  if (f === $familiar`Cornbeefadon`) {
    return have($item`amulet coin`) ? 0 : amuletCoinValue();
  }

  if (
    $familiars`Frozen Gravy Fairy, Flaming Gravy Fairy, Sleazy Gravy Fairy, Spooky Gravy Fairy, Stinky Gravy Fairy`.includes(
      f,
    )
  ) {
    return garboValue($item`lead necklace`);
  }

  return garboValue(familiarEquipment(f));
};

export function tcbValue(
  familiar: Familiar,
  tcbFamiliars: Set<Familiar>,
  equipmentForced?: boolean,
  includeAmuletCoinOpportunityCost?: boolean,
): number {
  if (equipmentForced) return 0;
  if (!ToyCupidBow.have()) return 0;
  if (tcbFamiliars.has(familiar)) return 0;
  const leprechaunMultiplier = findLeprechaunMultiplier(familiar);
  // This is only used during barf so we can just use basemeat
  // Includes a lazy linearization of the value of its leprechaun-pounds
  const amuletCoin =
    includeAmuletCoinOpportunityCost && have($item`amulet coin`)
      ? ((50 +
          10 * (2 * leprechaunMultiplier + Math.sqrt(leprechaunMultiplier))) *
          baseMeat()) /
        100
      : 0;
  return (
    familiarEquipmentValue(familiar) / tcbTurnsLeft(familiar, tcbFamiliars) -
    amuletCoin
  );
}
