import { PostFreeFightQuest } from "./tasks/dailies/postFreeFight";
import { runSafeGarboQuests } from "./tasks/engine";

export function postFreeFightDailySetup(): void {
  runSafeGarboQuests([PostFreeFightQuest]);
}
