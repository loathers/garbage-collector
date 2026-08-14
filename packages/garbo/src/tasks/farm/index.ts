import { BarfTurnQuest } from "./barfTurn";
import { CowoQuest } from "./cowo";
import { DailyExtrasQuest } from "./dailyExtras";
import { NonBarfTurnQuest } from "./nonBarfTurn";
import { TurnGenQuest } from "./turnGen";
import { WandererQuest } from "./wanderer";

export const FarmQuests = [
  TurnGenQuest,
  DailyExtrasQuest,
  WandererQuest,
  NonBarfTurnQuest,
  CowoQuest,
  BarfTurnQuest,
];
