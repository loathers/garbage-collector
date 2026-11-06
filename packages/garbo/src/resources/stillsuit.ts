import { get, StillSuit } from "libram";
import { globalOptions } from "../config";
import { sober } from "../lib";
import { estimatedGarboTurns } from "../turns";

export function stillsuitBonus(): number {
  if (!StillSuit.have() || (globalOptions.ascend && !sober())) return 0;

  const remainingTurns = Math.max(estimatedGarboTurns(), 0);
  const currentSweat = get("familiarSweat");

  // Worst case scenario this guy is still in the terrarium all day.
  const projectedSweat = currentSweat + remainingTurns;

  const projectedAdventures = Math.round(projectedSweat ** 0.4);

  const nextSweatThreshold = Math.ceil((projectedAdventures + 0.5) ** (5 / 2));

  // If we can't get another adventure today, this is worthless.
  if (projectedSweat + 2 * remainingTurns < nextSweatThreshold) return 0;
  const previousSweatThreshold = Math.ceil(
    Math.max(projectedAdventures - 0.5, 0) ** (5 / 2),
  );

  return (
    (get("valueOfAdventure") * 2) /
    (nextSweatThreshold - previousSweatThreshold)
  );
}
