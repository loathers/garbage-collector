import { appearanceRates, getMonsters, Location, Monster } from "kolmafia";
import {
  bofaValue,
  canAdventureOrUnlock,
  canWander,
  DraggableFight,
  WandererFactoryOptions,
  WandererTarget,
} from "./lib";

function monsterValues(
  location: Location,
  forceItemDrops: boolean,
  options: WandererFactoryOptions,
): Map<Monster, number> {
  const badAttributes = ["LUCKY", "ULTRARARE", "BOSS"];
  const rates = appearanceRates(location);
  const monsters = getMonsters(location).filter(
    (m) =>
      !badAttributes.some((s) => m.attributes.includes(s)) && rates[m.name] > 0,
  );

  return new Map<Monster, number>(
    monsters.map((m) => {
      return [m, bofaValue(options, m)];
    }),
  );
}

export function bofaFactory(
  type: DraggableFight,
  locationSkiplist: Location[],
  options: WandererFactoryOptions,
): WandererTarget[] {
  if (type === "yellow ray" || type === "freefight") {
    const validLocations = Location.all().filter(
      (location) =>
        canWander(location, "yellow ray") &&
        canAdventureOrUnlock(location) &&
        !locationSkiplist.includes(location),
    );
    return [...validLocations].map((l: Location) => {
      return new WandererTarget(
        `Book of Facts`,
        l,
        0,
        monsterValues(l, type === "yellow ray", options),
      );
    });
  }
  return [];
}
