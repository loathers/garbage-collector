import {
  appearanceRates,
  getMonsters,
  itemDropsArray,
  Location,
} from "kolmafia";
import { $item, clamp, get, have, maxBy, SourceTerminal, sum } from "libram";
import {
  bofaValue,
  canAdventureOrUnlock,
  canWander,
  DraggableFight,
  underwater,
  UnlockableZones,
  WandererFactoryOptions,
  WandererTarget,
} from "./lib";

function averageYrValue(
  location: Location,
  forceItemDrops: boolean,
  options: WandererFactoryOptions,
) {
  const badAttributes = ["LUCKY", "ULTRARARE", "BOSS"];
  const rates = appearanceRates(location);
  const monsters = getMonsters(location).filter(
    (m) =>
      !badAttributes.some((s) => m.attributes.includes(s)) && rates[m.name] > 0,
  );

  const canDuplicate =
    SourceTerminal.have() && SourceTerminal.duplicateUsesRemaining() > 0;
  const canMctwist = have($item`pro skateboard`) && !get("_epicMcTwistUsed");
  const possibleDuplicateFactor =
    2 ** [canDuplicate, canMctwist].filter(Boolean).length;
  if (monsters.length === 0) {
    return 0;
  } else {
    return (
      sum(monsters, (m) => {
        const items = itemDropsArray(m).filter((drop) =>
          ["", "n"].includes(drop.type),
        );
        const duplicateFactor = !m.attributes.includes("NOCOPY")
          ? possibleDuplicateFactor
          : 1;

        // TODO: this should consider unbuffed meat drop and unbuffed item drop, probably
        const meatDrop = clamp((m.minMeat + m.maxMeat) / 2, 0, 1000);
        const itemDrop =
          duplicateFactor *
          sum(items, (drop) => {
            const yrRate =
              (drop.type === "" && forceItemDrops ? 100 : drop.rate) / 100;
            return yrRate * options.itemValue(drop.drop);
          });
        return itemDrop + meatDrop + bofaValue(options, m);
      }) / monsters.length
    );
  }
}

function monsterValues(
  forceItemDrops: boolean,
  options: WandererFactoryOptions,
): Map<Location, number> {
  const values = new Map<Location, number>();
  for (const location of Location.all().filter(
    (l) => canAdventureOrUnlock(l) && !underwater(l),
  )) {
    values.set(
      location,
      averageYrValue(location, forceItemDrops, options) +
        options.freeFightExtraValue(location),
    );
  }
  return values;
}

// Doing a free fight + yellow ray combination against a random enemy
export function freefightFactory(
  type: DraggableFight,
  locationSkiplist: Location[],
  options: WandererFactoryOptions,
): WandererTarget[] {
  if (type === "yellow ray" || type === "freefight") {
    const validLocations = Location.all().filter(
      (location) =>
        canWander(location, "yellow ray") && canAdventureOrUnlock(location),
    );
    const locationValues = monsterValues(type === "yellow ray", options);

    const bestZones = new Set<Location>(
      validLocations.length > 0
        ? [maxBy(validLocations, (l: Location) => locationValues.get(l) ?? 0)]
        : [],
    );
    for (const unlockableZone of UnlockableZones) {
      const extraLocations = Location.all().filter(
        (l) => l.zone === unlockableZone.zone && !locationSkiplist.includes(l),
      );
      if (extraLocations.length > 0) {
        bestZones.add(
          maxBy(extraLocations, (l: Location) => locationValues.get(l) ?? 0),
        );
      }
    }
    if (bestZones.size > 0) {
      return [...bestZones].map(
        (l: Location) =>
          new WandererTarget(`Yellow Ray ${l}`, l, locationValues.get(l) ?? 0),
      );
    }
  }
  return [];
}
