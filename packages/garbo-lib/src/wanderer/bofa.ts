import { Location, Monster } from "kolmafia";
import {
  availableMonsters,
  bofaValue,
  canAdventureOrUnlock,
  canWander,
  DraggableFight,
  WandererFactoryOptions,
  WandererTarget,
} from "./lib";

function monsterValues(
  location: Location,
  options: WandererFactoryOptions,
): Map<Monster, number> {
  const monsters = availableMonsters(location);

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
      return new WandererTarget({
        name: `Book of Facts`,
        location: l,
        zoneValue: 0,
        monsterBonusValues: monsterValues(l, options),
      });
    });
  }
  return [];
}
