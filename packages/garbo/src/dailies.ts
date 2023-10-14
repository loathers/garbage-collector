import {
  AscendingQuest,
  DailyFamiliarsQuest,
  DailyItemsQuest,
  DailyQuest,
  runSafeGarboQuests,
} from "./tasks";

export function dailySetup(): void {
  runSafeGarboQuests([
    DailyFamiliarsQuest,
    DailyQuest,
    DailyItemsQuest,
    AscendingQuest,
  ]);
}
