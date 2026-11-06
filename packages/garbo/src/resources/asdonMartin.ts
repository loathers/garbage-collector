import { getFuel, haveEffect, Item, myTurncount, npcPrice } from "kolmafia";
import {
  $item,
  AsdonMartin,
  get,
  getAcquirePrice,
  getAverageAdventures,
  maxBy,
} from "libram";
import { globalOptions } from "../config";
import { FarmingStrategy } from "../farmingStrategy";
import { estimatedGarboTurns } from "../turns";

export const BUMPER_FUEL = 50;

export function bumperAvailable(): boolean {
  if (!AsdonMartin.installed()) return false;
  const banishes = get("banishedMonsters").split(":");
  const bumperIndex = banishes.findIndex(
    (entry) => entry.toLowerCase() === "spring-loaded front bumper",
  );
  // Like Libram, allow an extra turn when an expired banish is still recorded.
  return (
    bumperIndex === -1 || myTurncount() - Number(banishes[bumperIndex + 1]) > 30
  );
}

export function bumperFuelCost(): number {
  const surplusFuel =
    globalOptions.ascend &&
    haveEffect(FarmingStrategy.asdonEffect) >= estimatedGarboTurns()
      ? getFuel()
      : 0;
  const fuelToValue = Math.max(0, BUMPER_FUEL - surplusFuel);
  if (fuelToValue === 0) return 0;

  // Match Libram's dough fallback: a flower makes at least 35 wads.
  const doughPrice =
    npcPrice($item`wad of dough`) ||
    npcPrice($item`all-purpose flower`) / 35 ||
    getAcquirePrice($item`wad of dough`);
  const breadFuelPrice =
    (doughPrice + npcPrice($item`soda water`)) /
    getAverageAdventures($item`loaf of soda bread`);

  // Refresh the cheap end as inventory is consumed; blend toward replenishable bread.
  const fuels = Item.all().filter(AsdonMartin.isFuelItem);
  const pricePerFuel = (item: Item) =>
    getAcquirePrice(item) / getAverageAdventures(item);
  const cheapestFuelPrice = fuels.length
    ? Math.min(breadFuelPrice, pricePerFuel(maxBy(fuels, pricePerFuel, true)))
    : breadFuelPrice;
  const fuelPrice = (cheapestFuelPrice + breadFuelPrice) / 2;
  return fuelToValue * fuelPrice;
}
