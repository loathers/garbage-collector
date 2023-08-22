import { PostFreeFightQuest } from "./tasks/postFreeFight";
import { runSafeGarboQuests } from "./tasks/engine";

export function postFreeFightDailySetup(): void {
  runSafeGarboQuests([PostFreeFightQuest]);
}
