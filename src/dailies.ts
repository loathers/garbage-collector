import { DailyTasks } from "./tasks/daily";
import { PostFreeFightTasks } from "./tasks/postFreeFight";
import { DailyItemTasks } from "./tasks/dailyItems";
import { DailyVolcanoTasks } from "./tasks/dailyVolcano";
import { DailyFamiliarTasks } from "./tasks/dailyFamiliars";
import { runSafeGarboTasks } from "./tasks/engine";
import { AscendingTasks } from "./tasks/ascending";

export function dailySetup(): void {
  runSafeGarboTasks([
    ...DailyFamiliarTasks,
    ...DailyItemTasks,
    ...DailyVolcanoTasks,
    ...DailyTasks,
    ...AscendingTasks,
  ]);
}

export function postFreeFightDailySetup(): void {
  runSafeGarboTasks(PostFreeFightTasks);
}
