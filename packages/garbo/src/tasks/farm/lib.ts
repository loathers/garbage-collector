import { myAdventures, myTurncount, totalTurnsPlayed } from "kolmafia";
import { globalOptions } from "../../config";

export function canContinue(): boolean {
  return (
    myAdventures() > globalOptions.saveTurns &&
    (globalOptions.stopTurncount === null ||
      myTurncount() < globalOptions.stopTurncount)
  );
}

let lastParachuteFailure = 0;
export const shouldCheckParachute = () =>
  totalTurnsPlayed() !== lastParachuteFailure;
export const updateParachuteFailure = () =>
  (lastParachuteFailure = totalTurnsPlayed());
