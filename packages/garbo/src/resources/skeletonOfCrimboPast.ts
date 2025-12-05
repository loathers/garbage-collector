import { $familiar, $item, get, have } from "libram";
import { garboValue } from "../garboValue";
import { globalOptions } from "../config";
import { FamiliarMode } from "../familiar/lib";
import { BonusEquipMode } from "../lib";

export function knuckleboneValue(mode: FamiliarMode | BonusEquipMode): number {
  if (
    get("_knuckleboneDrops", 0) >= 100 ||
    !have($familiar`Skeleton of Crimbo Past`)
  ) {
    return 0;
  }
  const boneTradeValue = garboValue($item`knucklebone`);
  return mode === "barf"
    ? boneTradeValue * 0.5
    : mode === "target" && globalOptions.target.attributes.includes("SKELETON")
      ? boneTradeValue * 0.9
      : 0;
}
