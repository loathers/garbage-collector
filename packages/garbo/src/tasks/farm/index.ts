import { FarmTurnQuest } from "./farmTurn";
import { DailyExtrasQuest } from "./dailyExtras";
import { NonBarfTurnQuest } from "./nonBarfTurn";
import { TurnGenQuest } from "./turnGen";
import { WandererQuest } from "./wanderer";

export const FarmQuests = () => [
  TurnGenQuest,
  DailyExtrasQuest,
  WandererQuest,
  NonBarfTurnQuest,
  FarmTurnQuest,
];
