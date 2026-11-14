import { appearanceRates, Location, Monster } from "kolmafia";
import {
  $monster,
  maxBy,
  MonodentOfTheSea,
  PeridotOfPeril,
  sumNumbers,
  undelay,
} from "libram";
import {
  addMaps,
  averageMonsterValue,
  DraggableFight,
  ensureMapElement,
  UNPERIDOTABLE_MONSTERS,
  WandererFactoryOptions,
  WandererLocation,
  WandererTarget,
} from "./lib";

function zoneAverageMonsterValue(
  location: Location,
  monsterBonusValues: Map<Monster, number>,
  monsterItemValues: Map<Monster, number>,
): number {
  const rates = appearanceRates(location, true);
  const averageBonusValue = averageMonsterValue(monsterBonusValues, rates);
  const averageItemValue = averageMonsterValue(monsterItemValues, rates);
  return averageBonusValue + averageItemValue;
}

function targetedMonsterValue(
  monsterBonusValues: Map<Monster, number>,
  monsterItemValues: Map<Monster, number>,
): [Monster, number] {
  const monsterTotalValue = new Map(monsterBonusValues);
  addMaps(monsterTotalValue, monsterItemValues);
  const availableMonsters = [...monsterTotalValue.entries()].filter(
    ([m]) => !UNPERIDOTABLE_MONSTERS.has(m),
  );
  if (availableMonsters.length === 0) return [$monster.none, 0];
  return maxBy(availableMonsters, 1);
}

function zoneRefractedGazeValue(
  location: Location,
  monsterBonusValues: Map<Monster, number>,
  monsterItemValues: Map<Monster, number>,
): { withFeesh: number; noFeesh: number } {
  const totalItemValue = sumNumbers([...monsterItemValues.values()]);
  // If we aren't using Feesh, we will get bonuses from one monster, but lose the items from that monster
  const rates = appearanceRates(location, true);
  const averageBonusValue = averageMonsterValue(monsterBonusValues, rates);
  const averageItemValue = averageMonsterValue(monsterItemValues, rates);
  const noFeesh = totalItemValue - averageItemValue + averageBonusValue;
  // Monsters that cannot become fish still contribute the ordinary Gaze value.
  const unconvertedRates = Object.fromEntries(
    Object.entries(rates).map(([name, rate]) => [
      name,
      MonodentOfTheSea.canFishify(Monster.get(name)) ? 0 : rate,
    ]),
  );
  const withFeesh =
    totalItemValue -
    averageMonsterValue(monsterItemValues, unconvertedRates) +
    averageMonsterValue(monsterBonusValues, unconvertedRates);
  return { withFeesh, noFeesh };
}

type ZoneData = {
  location: Location;
  targets: WandererTarget[];
  zoneValue: number;
  monsterBonusValues: Map<Monster, number>;
  monsterItemValues: Map<Monster, number>;
};

function updateZoneData(zoneData: ZoneData, wanderer: WandererTarget) {
  zoneData.targets.push(wanderer);
  addMaps(zoneData.monsterBonusValues, wanderer.monsterBonusValues);
  addMaps(zoneData.monsterItemValues, wanderer.monsterItemValues);
  zoneData.zoneValue += wanderer.zoneValue;
}

function determineWandererLocationInfo(
  shouldRefract: boolean,
  shouldFeesh: boolean,
  shouldPeridot: boolean,
  bestMonsterCandidate: Monster,
  monsterTargetedValue: number,
  monsterAverageValue: number,
  refractedGazeValue: number,
): {
  bestMonster: Monster;
  monsterValue: number;
  shouldBcz: boolean;
  shouldFeesh: boolean;
} {
  if (shouldRefract) {
    return {
      bestMonster: $monster.none,
      monsterValue: refractedGazeValue,
      shouldBcz: true,
      shouldFeesh,
    };
  }

  if (shouldPeridot) {
    return {
      bestMonster: bestMonsterCandidate,
      monsterValue: monsterTargetedValue,
      shouldBcz: false,
      shouldFeesh: false,
    };
  }

  return {
    bestMonster: $monster.none,
    monsterValue: monsterAverageValue,
    shouldBcz: false,
    shouldFeesh: false,
  };
}

/**
 * Score each destination without preparing or spending resources.
 * @param targets Rewards to combine by location
 * @param type The encounter being placed
 * @param options Caller valuation constraints
 * @returns Each location's highest-valued encounter
 */
export function valueWandererTargets(
  targets: readonly WandererTarget[],
  type: DraggableFight,
  options: WandererFactoryOptions,
): WandererLocation[] {
  const zones = new Map<Location, ZoneData>();
  for (const target of targets) {
    const zone = ensureMapElement(zones, target.location, {
      location: target.location,
      targets: [],
      zoneValue: 0,
      monsterBonusValues: new Map<Monster, number>(),
      monsterItemValues: new Map<Monster, number>(),
    });
    updateZoneData(zone, target);
  }

  // Determine combined values, and whether best forced target is better than the best average location drops
  const canRefract =
    type !== "conditional freefight" &&
    undelay(options.canRefractedGaze ?? false);
  const locationMonsterValues = new Map<Location, WandererLocation>();
  for (const [
    location,
    { targets, zoneValue, monsterBonusValues, monsterItemValues },
  ] of zones) {
    const monsterAverageValue = zoneAverageMonsterValue(
      location,
      monsterBonusValues,
      monsterItemValues,
    );
    const { withFeesh, noFeesh } = zoneRefractedGazeValue(
      location,
      monsterBonusValues,
      monsterItemValues,
    );
    const shouldFeeshCandidate = MonodentOfTheSea.have() && withFeesh > noFeesh;

    const refractedGazeValue = canRefract
      ? shouldFeeshCandidate
        ? withFeesh
        : noFeesh
      : 0;

    const [bestMonsterCandidate, monsterTargetedValue] = targetedMonsterValue(
      monsterBonusValues,
      monsterItemValues,
    );

    const shouldRefract =
      refractedGazeValue > monsterAverageValue &&
      refractedGazeValue > monsterTargetedValue;

    const shouldPeridot =
      PeridotOfPeril.canImperil(location) &&
      !shouldRefract &&
      monsterTargetedValue > monsterAverageValue;

    const { bestMonster, monsterValue, shouldBcz, shouldFeesh } =
      determineWandererLocationInfo(
        shouldRefract,
        shouldFeeshCandidate,
        shouldPeridot,
        bestMonsterCandidate,
        monsterTargetedValue,
        monsterAverageValue,
        refractedGazeValue,
      );

    locationMonsterValues.set(location, {
      location,
      targets,
      peridotMonster: bestMonster,
      value: zoneValue + monsterValue,
      useRefractedGaze: shouldBcz,
      useFeesh: shouldFeesh,
    });
  }

  return [...locationMonsterValues.values()];
}
