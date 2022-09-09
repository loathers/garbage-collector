import {
  Familiar,
  familiarWeight,
  inebrietyLimit,
  myAdventures,
  myInebriety,
  totalTurnsPlayed,
  weightAdjustment,
} from "kolmafia";
import { $effect, $familiar, $item, get, have } from "libram";
import { globalOptions } from "../lib";

export type GeneralFamiliar = {
  familiar: Familiar;
  expectedValue: number;
  leprechaunMultiplier: number;
  limit: "drops" | "experience" | "none" | "shrub" | "jellyfish";
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
