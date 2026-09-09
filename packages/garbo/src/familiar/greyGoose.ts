import {
  inebrietyLimit,
  mallPrice,
  myAdventures,
  myInebriety,
  totalTurnsPlayed,
} from "kolmafia";
import { $familiar, $item, get, have } from "libram";
import { globalOptions } from "../config";
import { baseMeat } from "../lib";

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
