import { AscendingQuest } from "./tasks/ascending";
import { DailyQuest } from "./tasks/daily";
import { DailyFamiliarsQuest } from "./tasks/dailyFamiliars";
import { DailyItemsQuest } from "./tasks/dailyItems";
import { DailySeaQuest } from "./tasks/dailySea";
import { runSafeGarboQuests } from "./tasks/engine";

export function dailySetup(): void {
  runSafeGarboQuests([
    DailyFamiliarsQuest,
    DailyQuest,
    DailyItemsQuest,
    DailySeaQuest,
    AscendingQuest,
  ]);
}
