import { LegendarySealClubbingClub } from "libram";
import { globalOptions } from "../config";

export const nextWeekReady = () =>
  LegendarySealClubbingClub.turnsUntilNextWeekFight() <= 0 ||
  !LegendarySealClubbingClub.clubIntoNextWeekMonster();
export const nextWeekFights = () =>
  LegendarySealClubbingClub.clubIntoNextWeekAvailable() +
  (LegendarySealClubbingClub.clubIntoNextWeekMonster() === globalOptions.target
    ? 1
    : 0);
