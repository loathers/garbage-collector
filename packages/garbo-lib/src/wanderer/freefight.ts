import {
  appearanceRates,
  getMonsters,
  itemDropsArray,
  Location,
  Monster,
} from "kolmafia";
import { $item, clamp, get, have, SourceTerminal, sum } from "libram";
import {
  bofaValue,
  canAdventureOrUnlock,
  canWander,
  DraggableFight,
  WandererFactoryOptions,
  WandererTarget,
} from "./lib";

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
  return itemDrop + meatDrop + bofaValue(options, m);
}

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

  if (monsters.length === 0) {
    return new Map<Monster, number>();
  }

  const monsterValues = new Map<Monster, number>(
    monsters.map((m) => {
      return [m, valueMonster(location, m, forceItemDrops, options)];
    }),
  );

  return monsterValues;
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
        canWander(location, "yellow ray") &&
        canAdventureOrUnlock(location) &&
        !locationSkiplist.includes(location),
    );
    return [...validLocations].map((l: Location) => {
      return new WandererTarget(
        `Item Drop Values ${l}`.concat(
          type === "yellow ray" ? ` (Guaranteed Drops)` : "",
        ),
        l,
        0,
        monsterValues(l, type === "yellow ray", options),
        undefined,
        undefined,
        type === "freefight" ? "normal" : "forced",
      );
    });
  }
  return [];
}
