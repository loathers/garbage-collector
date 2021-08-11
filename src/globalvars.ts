import { inebrietyLimit, myAdventures, myInebriety, myTurncount } from "kolmafia";
import { $item, have } from "libram";
import { embezzlerCount } from "./embezzlers";

export const log = {
  initialEmbezzlersFought: 0,
  digitizedEmbezzlersFought: 0,
};

export const globalOptions: { ascending: boolean; stopTurncount: number | null; noBarf: boolean } =
  {
    stopTurncount: null,
    ascending: false,
    noBarf: false,
  };

export function estimatedTurns(): number {
  let turns;
  if (globalOptions.stopTurncount) turns = globalOptions.stopTurncount - myTurncount();
  else if (globalOptions.noBarf) turns = embezzlerCount();
  else
    turns =
      (myAdventures() + (globalOptions.ascending && myInebriety() <= inebrietyLimit() ? 60 : 0)) *
      (have($item`mafia thumb ring`) ? 1.04 : 1);

  return turns;
}
