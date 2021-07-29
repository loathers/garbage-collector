import { inebrietyLimit, myAdventures, myInebriety } from "kolmafia";
import { $item, have } from "libram";

export const log = {
  initialEmbezzlersFought: 0,
  digitizedEmbezzlersFought: 0,
};

export const globalOptions: { ascending: boolean; stopTurncount: number | null } = {
  stopTurncount: null,
  ascending: false,
};

export function estimatedTurns(): number {
  return (
    globalOptions.stopTurncount ??
    (myAdventures() + (globalOptions.ascending && myInebriety() <= inebrietyLimit() ? 60 : 0)) *
      (have($item`mafia thumb ring`) ? 1.04 : 1)
  );
}
