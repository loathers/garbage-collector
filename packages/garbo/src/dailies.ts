import {
  AscendingQuest,
  DailyFamiliarsQuest,
  DailyItemsQuest,
  DailyQuest,
  runSafeGarboQuests,
  VolcanoQuest,
} from "./tasks";

export function dailySetup(): void {
  runSafeGarboQuests([
    DailyFamiliarsQuest,
    DailyQuest,
    DailyItemsQuest,
    VolcanoQuest,
    AscendingQuest,
  ]);
}
