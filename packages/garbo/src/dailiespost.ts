import { PostFreeFightQuest, runSafeGarboQuests } from "./tasks";

export function postFreeFightDailySetup(): void {
  runSafeGarboQuests([PostFreeFightQuest]);
}
