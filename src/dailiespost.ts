import { PostFreeFightTasks } from "./tasks/postFreeFight";
import { runSafeGarboTasks } from "./tasks/engine";

export function postFreeFightDailySetup(): void {
  runSafeGarboTasks(PostFreeFightTasks);
}
