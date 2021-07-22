import {
  abort,
  getFuel,
  historicalPrice,
  isNpcItem,
  mallPrice,
  retrieveItem,
  toInt,
  visitUrl,
} from "kolmafia";
import { $items } from "libram";

const fuelBlacklist = $items`cup of "tea", thermos of "whiskey", Lucky Lindy, Bee's Knees, Sockdollager, Ish Kabibble, Hot Socks, Phonus Balonus, Flivver, Sloppy Jalopy, glass of "milk"`;

function averageAdventures(it: Item): number {
  if (it.adventures.includes("-")) {
    const bounds = it.adventures.split("-");
    return (parseInt(bounds[0], 10) + parseInt(bounds[1], 10)) / 2.0;
  } else {
    return parseInt(it.adventures, 10);
  }
}

function price(item: Item) {
  return historicalPrice(item) === 0 ? mallPrice(item) : historicalPrice(item);
}

export function calculateFuelEfficiency(it: Item, targetUnits: number): number {
  const units = averageAdventures(it);
  return price(it) / Math.min(targetUnits, units);
}

function isFuelItem(it: Item) {
  return (
    !isNpcItem(it) &&
    it.fullness + it.inebriety > 0 &&
    averageAdventures(it) > 0 &&
    it.tradeable &&
    it.discardable &&
    !fuelBlacklist.includes(it)
  );
}

const potentialFuel = $items``.filter(isFuelItem);

function getBestFuel(targetUnits: number) {
  const key1 = (item: Item) => -averageAdventures(item);
  const key2 = (item: Item) => calculateFuelEfficiency(item, targetUnits);
  potentialFuel.sort((x: Item, y: Item) => key1(x) - key1(y));
  potentialFuel.sort((x: Item, y: Item) => key2(x) - key2(y));

  return potentialFuel[0];
}

function insertFuel(it: Item, quantity = 1) {
  const result = visitUrl(
    `campground.php?action=fuelconvertor&pwd&qty=${quantity}&iid=${toInt(it)}&go=Convert%21`
  );
  return result.includes("The display updates with a");
}

export function fillAsdonMartinTo(targetUnits: number): void {
  while (getFuel() < targetUnits) {
    const remaining = targetUnits - getFuel();

    const fuel = getBestFuel(remaining);
    const count = Math.ceil(targetUnits / averageAdventures(fuel));

    retrieveItem(count, fuel);

    if (!insertFuel(fuel, count)) {
      abort("Fuelling failed");
    }
  }
}
