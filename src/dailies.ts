import { DailyQuest } from "./tasks/dailies/daily";
import { DailyItemsQuest } from "./tasks/dailies/dailyItems";
import { VolcanoQuest } from "./tasks/dailies/dailyVolcano";
import { DailyFamiliarsQuest } from "./tasks/dailies/dailyFamiliars";
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
