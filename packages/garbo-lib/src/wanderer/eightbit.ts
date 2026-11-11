import { eightBitPoints, Location } from "kolmafia";
import {
  DraggableFight,
  draggableFights,
  WandererFactoryOptions,
  WandererTarget,
  wandererTurnsAvailableToday,
} from "./lib";
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

const progressTypes: readonly DraggableFight[] = draggableFights.filter(
  (type) => type !== "backup" && type !== "freerun",
);

function value(color: BonusColor, options: WandererFactoryOptions) {
  const denominator = options.ascend
    ? TREASURE_HOUSE_FAT_LOOT_TOKEN_COST - get("8BitScore")
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
    progressTypes.includes(type) &&
    get("8BitScore") < TREASURE_HOUSE_FAT_LOOT_TOKEN_COST
  ) {
    const colors = bonusColor.filter(
      (color) => !locationSkiplist.includes(locationColor[color]),
    );
    // Optimistically use the best currently available scoring zone throughout
    // the horizon. Allocation between projects is a separate decision.
    if (
      options.ascend &&
      !colors.some(
        (color) =>
          wandererTurnsAvailableToday(
            options,
            locationColor[color],
            true,
            progressTypes,
          ) *
            eightBitPoints(locationColor[color]) >=
          TREASURE_HOUSE_FAT_LOOT_TOKEN_COST - get("8BitScore"),
      )
    ) {
      return [];
    }
    return colors.map(
      (color) =>
        new WandererTarget({
          name: `8-bit (${color})`,
          location: locationColor[color],
          zoneValue: value(color, options),
        }),
    );
  }
  return [];
}
