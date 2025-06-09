import {
  appearanceRates,
  getMonsters,
  itemDropsArray,
  Location,
  Monster,
} from "kolmafia";
import {
  $item,
  $monster,
  clamp,
  get,
  have,
  maxBy,
  PeridotOfPeril,
  SourceTerminal,
  sum,
} from "libram";
import {
  bofaValue,
  canAdventureOrUnlock,
  canWander,
  cookbookbatQuestValue,
  DraggableFight,
  underwater,
  UnlockableZones,
  WandererFactoryOptions,
  WandererTarget,
} from "./lib";

type FreeKillValue = {
  value: number;
  forcedMonster: Monster;
};

function valueMonster(
  location: Location,
  m: Monster,
  forceItemDrops: boolean,
  options: WandererFactoryOptions,
): number {
  const canDuplicate =
    SourceTerminal.have() && SourceTerminal.duplicateUsesRemaining() > 0;
  const canMctwist = have($item`pro skateboard`) && !get("_epicMcTwistUsed");
  const possibleDuplicateFactor =
    2 ** [canDuplicate, canMctwist].filter(Boolean).length;
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
  return (
    itemDrop +
    meatDrop +
    bofaValue(options, m) +
    cookbookbatQuestValue(options, location, m)
  );
}

function freeKillValue(
  location: Location,
  forceItemDrops: boolean,
  options: WandererFactoryOptions,
  canForceMonster: boolean,
): FreeKillValue {
  const badAttributes = ["LUCKY", "ULTRARARE", "BOSS"];
  const rates = appearanceRates(location);
  const monsters = getMonsters(location).filter(
    (m) =>
      !badAttributes.some((s) => m.attributes.includes(s)) && rates[m.name] > 0,
  );

  if (monsters.length === 0) {
    return { value: 0, forcedMonster: $monster`none` };
  }

  const monsterValues = monsters.map((m) => {
    return {
      value: valueMonster(location, m, forceItemDrops, options),
      forcedMonster: m,
    };
  });

  const targetList = [
    {
      value: sum(monsterValues, "value") / monsterValues.length,
      forcedMonster: $monster`none`,
    },
  ];

  if (canForceMonster) {
    targetList.push(maxBy(monsterValues, "value"));
  }

  return maxBy(targetList, "value");
}

function monsterValues(
  forceItemDrops: boolean,
  options: WandererFactoryOptions,
  canForceMonster: boolean,
): Map<Location, FreeKillValue> {
  const values = new Map<Location, FreeKillValue>();
  for (const location of Location.all().filter(
    (l) => canAdventureOrUnlock(l) && !underwater(l),
  )) {
    const freeKillValuation = freeKillValue(
      location,
      forceItemDrops,
      options,
      canForceMonster && PeridotOfPeril.canImperil(location),
    );
    values.set(location, freeKillValuation);
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
    const locationValues = monsterValues(
      type === "yellow ray",
      options,
      PeridotOfPeril.have(),
    );

    const bestZones = new Set<Location>(
      validLocations.length > 0
        ? [
            maxBy(
              validLocations,
              (l: Location) => locationValues.get(l)?.value ?? 0,
            ),
          ]
        : [],
    );
    for (const unlockableZone of UnlockableZones) {
      const extraLocations = Location.all().filter(
        (l) => l.zone === unlockableZone.zone && !locationSkiplist.includes(l),
      );
      if (extraLocations.length > 0) {
        bestZones.add(
          maxBy(extraLocations, (l: Location) => {
            const locationValue = locationValues.get(l);
            return locationValue ? locationValue.value : 0;
          }),
        );
      }
    }
    if (bestZones.size > 0) {
      return [...bestZones].map((l: Location) => {
        const locationValue = locationValues.get(l);
        return new WandererTarget(
          `Yellow Ray ${l}`,
          l,
          locationValue ? locationValue.value : 0,
          undefined,
          locationValue ? locationValue.forcedMonster : $monster`none`,
        );
      });
    }
  }
  return [];
}
