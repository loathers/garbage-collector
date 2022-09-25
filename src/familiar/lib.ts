import {
  availableAmount,
  Familiar,
  familiarWeight,
  inebrietyLimit,
  myAdventures,
  myInebriety,
  totalTurnsPlayed,
  weightAdjustment,
} from "kolmafia";
import { $effect, $familiar, $item, clamp, get, have } from "libram";
import { ESTIMATED_OVERDRUNK_TURNS, globalOptions, turnsToNC } from "../lib";
import { digitizedMonstersRemaining, estimatedTurns } from "../turns";

export type GeneralFamiliar = {
  familiar: Familiar;
  expectedValue: number;
  leprechaunMultiplier: number;
  limit: "drops" | "experience" | "none" | "special";
};

export function timeToMeatify(): boolean {
  if (
    !have($familiar`Grey Goose`) ||
    get("_meatifyMatterUsed") ||
    myInebriety() > inebrietyLimit()
  ) {
    return false;
  } else if ($familiar`Grey Goose`.experience >= 400) return true;
  else if (!globalOptions.ascending || myAdventures() > 50) return false;

  // Check Wanderers
  const totalTurns = totalTurnsPlayed();
  const baseMeat = have($item`SongBoom™ BoomBox`) ? 275 : 250;
  const usingLatte =
    have($item`latte lovers member's mug`) &&
    get("latteModifier").split(",").includes("Meat Drop: 40");

  const nextProtonicGhost = have($item`protonic accelerator pack`)
    ? Math.max(1, get("nextParanormalActivity") - totalTurns)
    : Infinity;
  const nextVoteMonster =
    have($item`"I Voted!" sticker`) && get("_voteFreeFights") < 3
      ? Math.max(0, ((totalTurns % 11) - 1) % 11)
      : Infinity;
  const nextVoidMonster =
    have($item`cursed magnifying glass`) &&
    get("_voidFreeFights") < 5 &&
    get("valueOfFreeFight", 2000) / 13 > baseMeat * (usingLatte ? 0.75 : 0.6)
      ? -get("cursedMagnifyingGlassCount") % 13
      : Infinity;

  // If any of the above are 0, then
  // (1) We should be fighting a free fight
  // (2) We meatify if Grey Goose is sufficiently heavy and we don't have another free wanderer in our remaining turns

  const freeFightNow =
    get("questPAGhost") !== "unstarted" || nextVoteMonster === 0 || nextVoidMonster === 0;
  const delay = [
    nextProtonicGhost,
    nextVoteMonster === 0 ? (get("_voteFreeFights") < 2 ? 11 : Infinity) : nextVoteMonster,
    nextVoidMonster === 0 ? 13 : nextVoidMonster,
  ].reduce((a, b) => (a < b ? a : b));

  if (delay < myAdventures()) return false;
  // We can wait for the next free fight
  else if (freeFightNow || $familiar`Grey Goose`.experience >= 121) return true;

  return false;
}

export function pocketProfessorLectures(): number {
  return 2 + Math.ceil(Math.sqrt(familiarWeight($familiar`Pocket Professor`) + weightAdjustment()));
}

export function canOpenRedPresent(): boolean {
  return (
    have($familiar`Crimbo Shrub`) &&
    !have($effect`Everything Looks Red`) &&
    get("shrubGifts") === "meat" &&
    myInebriety() <= inebrietyLimit()
  );
}

/**
 * Rough estimate of the  number of barf combats we expect to do. Used for marginal familiar tabulation.
 * @returns A rough estimate of the number of barf combats we expect to do.
 */
export function turnsAvailable(): number {
  const baseTurns = estimatedTurns();
  const digitizes = digitizedMonstersRemaining();
  const mapTurns = globalOptions.ascending
    ? clamp(
        availableAmount($item`Map to Safety Shelter Grimace Prime`),
        0,
        ESTIMATED_OVERDRUNK_TURNS
      )
    : 0;

  const barfTurns = baseTurns - digitizes - mapTurns;
  const barfCombatRate = 1 - 1 / turnsToNC;
  return barfTurns * barfCombatRate;
}
