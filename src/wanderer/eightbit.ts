import { canAdventure, Location, numericModifier } from "kolmafia";
import { DraggableFight } from ".";
import { WandererTarget } from "./lib";
import { $item, $location, clamp, get, NumericModifier } from "libram";
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

const minimumForPoints: Record<BonusColor, number> = {
  black: 300,
  red: 150,
  blue: 300,
  green: 100,
};

const modifierForColor: Record<BonusColor, NumericModifier> = {
  black: "Initiative",
  red: "Meat Drop",
  blue: "Damage Absorption",
  green: "Item Drop",
};

function pointsPerTurn(color: BonusColor) {
  const current = get("8BitColor") === color;
  const addedBonus = current ? 100 : 50;
  const denominator = current ? 20 : 10;
  const rawPoints = clamp(
    numericModifier(modifierForColor[color]) - minimumForPoints[color],
    0,
    300,
  );

  return addedBonus + Math.round(rawPoints / denominator) * 10;
}

function value(color: BonusColor) {
  const denominator = globalOptions.ascend
    ? get("8BitScore") - FAT_LOOT_TOKEN_COST
    : FAT_LOOT_TOKEN_COST;
  return (garboValue($item`fat loot token`) * pointsPerTurn(color)) / denominator;
}

export function eightbitFactory(
  type: DraggableFight,
  locationSkiplist: Location[],
): WandererTarget[] {
  if (
    canAdventure($location`The Spooky Forest`) &&
    type !== "backup" &&
    get("8BitScore") < FAT_LOOT_TOKEN_COST
  ) {
    return bonusColor
      .map((color) => new WandererTarget(`8-bit (${color})`, locationColor[color], value(color)))
      .filter((t) => !locationSkiplist.includes(t.location));
  }
  return [];
}
