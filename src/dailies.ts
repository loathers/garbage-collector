import { DailyQuest } from "./tasks/daily";
import { DailyItemsQuest } from "./tasks/dailyItems";
import { VolcanoQuest } from "./tasks/dailyVolcano";
import { DailyFamiliarsQuest } from "./tasks/dailyFamiliars";
import { runSafeGarboQuests } from "./tasks/engine";
import { AscendingQuest } from "./tasks/dailies/ascending";

export function dailySetup(): void {
  runSafeGarboQuests([
    DailyFamiliarsQuest,
    DailyItemsQuest,
    VolcanoQuest,
    DailyQuest,
    AscendingQuest,
  ]);
}
