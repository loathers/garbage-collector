import {
  AscendingQuest,
  DailyFamiliarsQuest,
  DailyItemsQuest,
  DailyQuest,
  DailySeaQuest,
  runSafeGarboQuests,
} from "./tasks";

export function dailySetup(): void {
  runSafeGarboQuests([
    DailyFamiliarsQuest,
    DailyQuest,
    DailyItemsQuest,
    DailySeaQuest,
    AscendingQuest,
  ]);
}
