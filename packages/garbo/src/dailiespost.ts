import { runSafeGarboQuests } from "./tasks/engine";
import { PostFreeFightQuest } from "./tasks/postFreeFight";

export function postFreeFightDailySetup(): void {
  runSafeGarboQuests([PostFreeFightQuest]);
}
