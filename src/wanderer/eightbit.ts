import { eightBitPoints, Location } from "kolmafia";
import { DraggableFight } from ".";
import { WandererTarget } from "./lib";
import { $item, $location, get, have } from "libram";
import { garboValue } from "../value";
import { globalOptions } from "../config";

const FAT_LOOT_TOKEN_COST = 20000;

export const bonusColor = ["black", "blue", "green", "red"] as const;
export type BonusColor = (typeof bonusColor)[number];

// taken from tour guide, who took it from beldur

const locationColor: Record<BonusColor, Location> = {
  black: $location`Vanya's Castle`,
  blue: $location`Megalo-City`,
  green: $location`Hero's Field`,
  red: $location`The Fungus Plains`,
};

function value(color: BonusColor) {
  const denominator = globalOptions.ascend
    ? get("8BitScore") - FAT_LOOT_TOKEN_COST
    : FAT_LOOT_TOKEN_COST;
  return (garboValue($item`fat loot token`) * eightBitPoints(locationColor[color])) / denominator;
}

export function eightbitFactory(
  type: DraggableFight,
  locationSkiplist: Location[],
): WandererTarget[] {
  if (
    have($item`continuum transfunctioner`) &&
    type !== "backup" &&
    get("8BitScore") < FAT_LOOT_TOKEN_COST
  ) {
    return bonusColor
      .map((color) => new WandererTarget(`8-bit (${color})`, locationColor[color], value(color)))
      .filter((t) => !locationSkiplist.includes(t.location));
  }
  return [];
}
