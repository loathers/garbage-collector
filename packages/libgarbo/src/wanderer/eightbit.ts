import { eightBitPoints, Location } from "kolmafia";
import { DraggableFight, WandererFactoryOptions, WandererTarget } from "./lib";
import { $item, $location, get, have } from "libram";

export const bonusColor = ["black", "blue", "green", "red"] as const;
export type BonusColor = (typeof bonusColor)[number];
export const TREASURE_HOUSE_FAT_LOOT_TOKEN_COST = 20000;

// taken from tour guide, who took it from beldur

const locationColor: Record<BonusColor, Location> = {
  black: $location`Vanya's Castle`,
  blue: $location`Megalo-City`,
  green: $location`Hero's Field`,
  red: $location`The Fungus Plains`,
};

function value(color: BonusColor, options: WandererFactoryOptions) {
  const denominator = options.ascend
    ? get("8BitScore") - TREASURE_HOUSE_FAT_LOOT_TOKEN_COST
    : TREASURE_HOUSE_FAT_LOOT_TOKEN_COST;
  return (
    (options.itemValue($item`fat loot token`) *
      eightBitPoints(locationColor[color])) /
    denominator
  );
}

export function eightbitFactory(
  type: DraggableFight,
  locationSkiplist: Location[],
  options: WandererFactoryOptions,
): WandererTarget[] {
  if (
    have($item`continuum transfunctioner`) &&
    type !== "backup" &&
    get("8BitScore") < TREASURE_HOUSE_FAT_LOOT_TOKEN_COST
  ) {
    return bonusColor
      .map(
        (color) =>
          new WandererTarget(
            `8-bit (${color})`,
            locationColor[color],
            value(color, options),
          ),
      )
      .filter((t) => !locationSkiplist.includes(t.location));
  }
  return [];
}
