import { BarfTurnQuest } from "./barfTurn";
import { DailyExtrasQuest } from "./dailyExtras";
import { NonBarfTurnQuest } from "./nonBarfTurn";
import { TurnGenQuest } from "./turnGen";
import { WandererQuest } from "./wanderer";

export const FarmQuests = [
  TurnGenQuest,
  DailyExtrasQuest,
  WandererQuest,
  NonBarfTurnQuest,
  BarfTurnQuest,
];
