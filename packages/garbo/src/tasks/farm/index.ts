import { FarmTurnQuest } from "./farmTurn";
import { DailyExtrasQuest } from "./dailyExtras";
import { NonBarfTurnQuest } from "./nonBarfTurn";
import { TurnGenQuest } from "./turnGen";
import { WandererQuest } from "./wanderer";
import { Quest } from "grimoire-kolmafia";
import { FarmingContext } from "../context";
import { GarboTask } from "../engine";

export const FarmQuests = (): Quest<
  GarboTask<FarmingContext>,
  FarmingContext
>[] => [
  TurnGenQuest,
  DailyExtrasQuest,
  WandererQuest,
  NonBarfTurnQuest,
  FarmTurnQuest(),
];
