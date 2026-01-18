import {
  availableAmount,
  Familiar,
  familiarEquipment,
  inebrietyLimit,
  mallPrice,
  myAdventures,
  myInebriety,
  totalTurnsPlayed,
} from "kolmafia";
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
  turnsToNC,
} from "../lib";
import {
  estimatedGarboTurns,
  highMeatMonsterCount,
  wanderingCopytargetsRemaining,
} from "../turns";
import { garboValue } from "../garboValue";
import { copyTargetCount } from "../target";
import { canBullseye, safeToAttemptBullseye } from "../resources";

export type FamiliarMode = "barf" | "free" | "target" | "run";

export type GeneralFamiliar = {
  familiar: Familiar;
  expectedValue: number;
  leprechaunMultiplier: number;
  limit: "drops" | "experience" | "none" | "special" | "cupid";
  worksOnFreeRun: boolean;
};

export function timeToMeatify(): boolean {
  if (
    !have($familiar`Grey Goose`) ||
    get("_meatifyMatterUsed") ||
    myInebriety() > inebrietyLimit()
  ) {
    return false;
  } else if ($familiar`Grey Goose`.experience >= 400) return true;
  else if (!globalOptions.ascend || myAdventures() > 50) return false;

  // Check Wanderers
  const totalTurns = totalTurnsPlayed();
  const usingLatte =
    have($item`latte lovers member's mug`) &&
    get("latteModifier").split(",").includes("Meat Drop: 40");

  const nextProtonicGhost =
    have($item`protonic accelerator pack`) ||
    mallPrice($item`almost-dead walkie-talkie`) <
      globalOptions.prefs.valueOfFreeFight
      ? Math.max(1, get("nextParanormalActivity") - totalTurns)
      : Infinity;
  const nextVoteMonster =
    have($item`"I Voted!" sticker`) && get("_voteFreeFights") < 3
      ? Math.max(0, ((totalTurns % 11) - 1) % 11)
      : Infinity;
  const nextVoidMonster =
    have($item`cursed magnifying glass`) &&
    get("_voidFreeFights") < 5 &&
    globalOptions.prefs.valueOfFreeFight / 13 >
      baseMeat() * (usingLatte ? 0.75 : 0.6)
      ? -get("cursedMagnifyingGlassCount") % 13
      : Infinity;

  // If any of the above are 0, then
  // (1) We should be fighting a free fight
  // (2) We meatify if Grey Goose is sufficiently heavy and we don't have another free wanderer in our remaining turns

  const freeFightNow =
    get("questPAGhost") !== "unstarted" ||
    nextVoteMonster === 0 ||
    nextVoidMonster === 0;
  const delay = Math.min(
    nextProtonicGhost,
    nextVoteMonster === 0
      ? get("_voteFreeFights") < 2
        ? 11
        : Infinity
      : nextVoteMonster,
    nextVoidMonster === 0 ? 13 : nextVoidMonster,
  );

  if (delay < myAdventures()) return false;
  // We can wait for the next free fight
  else if (freeFightNow || $familiar`Grey Goose`.experience >= 121) return true;

  return false;
}

export function canOpenRedPresent(): boolean {
  return (
    have($familiar`Crimbo Shrub`) &&
    !have($effect`Everything Looks Red`) &&
    !have($skill`Free-For-All`) &&
    !(safeToAttemptBullseye() && canBullseye()) &&
    get("shrubGifts") === "meat" &&
    myInebriety() <= inebrietyLimit()
  );
}

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
  const barfCombatRate = 1 - 1 / turnsToNC;
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
