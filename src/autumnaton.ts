import { maxBy } from "./lib";
import { garboAverageValue, garboValue } from "./session";
import { estimatedTurns } from "./turns";
import {
  appearanceRates,
  availableAmount,
  getLocationMonsters,
  Item,
  itemDropsArray,
  Location,
  toMonster,
} from "kolmafia";
import { $item, $items, AutumnAton, get } from "libram";

function getAutumnatonUniques(location: Location): [AutumnAton.Upgrade, Item] {
  switch (location.environment) {
    case "outdoor":
      switch (location.difficultyLevel) {
        case "low":
          return [AutumnAton.possibleUpgrades[4], $item`autumn leaf`];
        case "mid":
          return [AutumnAton.possibleUpgrades[2], $item`autumn debris shield`];
        case "high":
          return [AutumnAton.possibleUpgrades[6], $item`autumn leaf pendant`];
      }
      break;
    case "indoor":
      switch (location.difficultyLevel) {
        case "low":
          return [AutumnAton.possibleUpgrades[0], $item`AutumnFest ale`];
        case "mid":
          return [AutumnAton.possibleUpgrades[3], $item`autumn-spice donut`];
        case "high":
          return [AutumnAton.possibleUpgrades[7], $item`autumn breeze`];
      }
      break;
    case "underground":
      switch (location.difficultyLevel) {
        case "low":
          return [AutumnAton.possibleUpgrades[1], $item`autumn sweater-weather sweater`];
        case "mid":
          return [AutumnAton.possibleUpgrades[5], $item`autumn dollar`];
        case "high":
          return [AutumnAton.possibleUpgrades[8], $item`autumn years wisdom`];
      }
      break;
  }
  // Just return a default value if location info is incorrect, libram types don't accept undefined
  return [AutumnAton.possibleUpgrades[0], $item`AutumnFest ale`];
}

interface ItemData {
  value: number;
  rate: number;
  expectedDrops1?: number;
  expectedDrops2?: number;
  totalExpectedDrops?: number;
}

export function averageAutumnatonValue(
  location: Location,
  acuityOverride?: number,
  slotOverride?: number
): number {
  const badAttributes = ["LUCKY", "ULTRARARE", "BOSS"];
  const rates = appearanceRates(location);
  const monsters = Object.keys(getLocationMonsters(location))
    .map((m) => toMonster(m))
    .filter((m) => !badAttributes.some((s) => m.attributes.includes(s)) && rates[m.name] > 0);

  if (monsters.length === 0) {
    return 0;
  } else {
    const validDrops: ItemData[] = [];
    // Get all valid drops from monsters in the zone.
    // If mafia doesn't know the droprate, or it is conditional, we value it at 0
    monsters.forEach((m) => {
      itemDropsArray(m).forEach((item) => {
        if (item.type.includes("c" || "0")) {
          validDrops.push({ value: 0, rate: item.rate });
        } else if (item.type === "") {
          validDrops.push({ value: garboValue(item.drop, true), rate: item.rate });
        }
      });
    });

    let totalZoneExpectedDrops = 0;
    // Find the expected drops for each valid item
    validDrops.forEach((d) => {
      // First two rolls do not care about acuity
      const acuityCutoff = 20 - (acuityOverride ?? AutumnAton.visualAcuity() * 5);
      d.expectedDrops1 = Math.min(slotOverride ?? AutumnAton.zoneItems(), (d.rate / 100) * 2);
      // Last 8 rolls do not count items below the acuity cutoff
      // Our max capacity is reduced by the expected drops from the first 2 rolls
      if (d.rate < acuityCutoff) {
        d.rate = 0;
      }
      d.expectedDrops2 = Math.min(
        (slotOverride ?? AutumnAton.zoneItems()) - d.expectedDrops1,
        (d.rate / 100) * 8
      );
      totalZoneExpectedDrops += d.expectedDrops1 + d.expectedDrops2;
    });

    let expectedCollectionValue = 0;
    validDrops.forEach((d) => {
      // This makes sure that when we have a larger amount of total expected drops than we have room for, we still return the correct adjusted amount for our available slots
      if (d.expectedDrops1 && d.expectedDrops2) {
        d.totalExpectedDrops =
          ((d.expectedDrops1 + d.expectedDrops2) / totalZoneExpectedDrops) *
          Math.min(totalZoneExpectedDrops, slotOverride ?? AutumnAton.zoneItems());
      }
      if (d.totalExpectedDrops) expectedCollectionValue += d.totalExpectedDrops * d.value;
    });
    return seasonalItemValue(location) + expectedCollectionValue;
  }
}

function seasonalItemValue(location: Location, seasonalOverride?: number): number {
  // Find the value of the drops based on zone difficulty/type
  const autumnItems = $items`autumn leaf, AutumnFest ale, autumn breeze, autumn dollar, autumn years wisdom`;
  const avgValueOfRandomAutumnItem = garboAverageValue(...autumnItems);
  const autumnMeltables = $items`autumn debris shield, autumn leaf pendant, autumn sweater-weather sweater`;
  const autumnItem = getAutumnatonUniques(location)[1];
  const seasonalItemDrops = seasonalOverride ?? AutumnAton.seasonalItems();
  return (
    (seasonalItemDrops > 1 ? avgValueOfRandomAutumnItem : 0) +
    (autumnMeltables.includes(autumnItem)
      ? // If we already have the meltable, then we get a random item, else value at 0
        availableAmount(autumnItem) > 0
        ? avgValueOfRandomAutumnItem
        : 0
      : garboValue(autumnItem, true))
  );
}

function expectedRemainingExpeditions(legOverride?: number): number {
  const availableAutumnatonTurns = estimatedTurns() - AutumnAton.turnsLeft();
  let expeditionTurnSum = 0;
  let quests = get("_autumnatonQuests", 0);
  while (expeditionTurnSum < availableAutumnatonTurns) {
    expeditionTurnSum +=
      11 *
      Math.max(
        1,
        quests -
          (legOverride ?? AutumnAton.currentUpgrades().filter((u) => u.includes("leg")).length)
      );
    quests++;
  }

  return quests - get("_autumnatonQuests", 0);
}

export function prioritizeUpgradeLocations(fullLocations: Location[]): Location[] {
  // This function shouldn't be getting called if we don't have an expedition left
  if (expectedRemainingExpeditions() < 1) {
    return fullLocations;
  }
  const profitRelevantUpgrades = [
    "leftarm1",
    "leftleg1",
    "rightarm1",
    "rightleg1",
    "cowcatcher",
    "periscope",
    "radardish",
  ] as const;
  const currentUpgrades = AutumnAton.currentUpgrades();
  const acquirableUpgrades = profitRelevantUpgrades.filter(
    (upgrade) => !currentUpgrades.includes(upgrade)
  );
  // Libram doesn't have amount of leg upgrades specifically like the other types do
  const legUpgrades = AutumnAton.currentUpgrades().filter((u) => u.includes("leg")).length;

  const acuityUpgrade1Possible = acquirableUpgrades.includes("periscope");
  const acuityUpgrade2Possible = acquirableUpgrades.includes("radardish");
  const leg1UpgradePossible = acquirableUpgrades.includes("rightleg1");
  const leg2UpgradePossible = acquirableUpgrades.includes("leftleg1");
  const arm1UpgradePossible = acquirableUpgrades.includes("rightarm1");
  const arm2UpgradePossible = acquirableUpgrades.includes("leftarm1");
  const cowCatcherUpgradePossible = acquirableUpgrades.includes("cowcatcher");

  const acuity1Locations = fullLocations.filter(
    (location) => getAutumnatonUniques(location)[0] === "periscope"
  );
  const acuity2Locations = fullLocations.filter(
    (location) => getAutumnatonUniques(location)[0] === "radardish"
  );
  const leg1Locations = fullLocations.filter(
    (location) => getAutumnatonUniques(location)[0] === "rightleg1"
  );
  const leg2Locations = fullLocations.filter(
    (location) => getAutumnatonUniques(location)[0] === "leftleg1"
  );
  const arm1Locations = fullLocations.filter(
    (location) => getAutumnatonUniques(location)[0] === "rightarm1"
  );
  const arm2Locations = fullLocations.filter(
    (location) => getAutumnatonUniques(location)[0] === "leftarm1"
  );
  const cowCatcherLocations = fullLocations.filter(
    (location) => getAutumnatonUniques(location)[0] === "cowcatcher"
  );

  const bestLocation = maxBy(fullLocations, (l: Location) => averageAutumnatonValue(l));
  const bestAcuity1Location = maxBy(acuity1Locations, (l: Location) => averageAutumnatonValue(l));
  const bestAcuity2Location = maxBy(acuity2Locations, (l: Location) => averageAutumnatonValue(l));
  const bestLocationWithAcuity1 = maxBy(fullLocations, (l: Location) =>
    averageAutumnatonValue(
      l,
      acuityUpgrade1Possible ? AutumnAton.visualAcuity() + 1 : AutumnAton.visualAcuity()
    )
  );
  const bestLocationWithAcuity2 = maxBy(fullLocations, (l: Location) =>
    averageAutumnatonValue(
      l,
      acuityUpgrade2Possible ? AutumnAton.visualAcuity() + 1 : AutumnAton.visualAcuity()
    )
  );
  // Legs do not change the best overall location when we have them upgraded
  const bestLeg1Location = maxBy(leg1Locations, (l: Location) => averageAutumnatonValue(l));
  const bestLeg2Location = maxBy(leg2Locations, (l: Location) => averageAutumnatonValue(l));

  const bestArm1Location = maxBy(arm1Locations, (l: Location) => averageAutumnatonValue(l));
  const bestArm2Location = maxBy(arm2Locations, (l: Location) => averageAutumnatonValue(l));
  const bestLocationWithArm1 = maxBy(fullLocations, (l: Location) =>
    averageAutumnatonValue(
      l,
      undefined,
      arm1UpgradePossible ? AutumnAton.zoneItems() + 1 : AutumnAton.zoneItems()
    )
  );
  const bestLocationWithArm2 = maxBy(fullLocations, (l: Location) =>
    averageAutumnatonValue(
      l,
      undefined,
      arm2UpgradePossible ? AutumnAton.zoneItems() + 1 : AutumnAton.zoneItems()
    )
  );
  // Cow catcher also does not change best overall location after upgrading
  const bestCowCatcherLocation = maxBy(cowCatcherLocations, (l: Location) =>
    averageAutumnatonValue(l)
  );

  const currentExpectedProfit =
    (seasonalItemValue(bestLocation) + averageAutumnatonValue(bestLocation)) *
    expectedRemainingExpeditions();

  // For upgrades, we take one expedition in the upgrade location with our current upgrades, then the rest in the optimal location with the additional upgrade
  const extraAcuity1ExpectedProfit =
    seasonalItemValue(bestAcuity1Location) +
    averageAutumnatonValue(bestAcuity1Location) +
    (seasonalItemValue(bestLocationWithAcuity1) + averageAutumnatonValue(bestLocationWithAcuity1)) *
      Math.max(0, expectedRemainingExpeditions() - 1);

  const extraAcuity2ExpectedProfit =
    seasonalItemValue(bestAcuity2Location) +
    averageAutumnatonValue(bestAcuity2Location) +
    (seasonalItemValue(bestLocationWithAcuity2) + averageAutumnatonValue(bestLocationWithAcuity2)) *
      Math.max(0, expectedRemainingExpeditions() - 1);

  const extraLeg1ExpectedProfit =
    seasonalItemValue(bestLeg1Location) +
    averageAutumnatonValue(bestLeg1Location) +
    (seasonalItemValue(bestLocation) + averageAutumnatonValue(bestLocation)) *
      Math.max(
        0,
        expectedRemainingExpeditions(leg1UpgradePossible ? legUpgrades + 1 : legUpgrades) - 1
      );

  const extraLeg2ExpectedProfit =
    seasonalItemValue(bestLeg2Location) +
    averageAutumnatonValue(bestLeg2Location) +
    (seasonalItemValue(bestLocation) + averageAutumnatonValue(bestLocation)) *
      Math.max(
        0,
        expectedRemainingExpeditions(leg2UpgradePossible ? legUpgrades + 1 : legUpgrades) - 1
      );

  const extraArm1ExpectedProfit =
    seasonalItemValue(bestArm1Location) +
    averageAutumnatonValue(bestArm1Location) +
    (seasonalItemValue(bestLocationWithArm1) + averageAutumnatonValue(bestLocationWithArm1)) *
      Math.max(0, expectedRemainingExpeditions() - 1);

  const extraArm2ExpectedProfit =
    seasonalItemValue(bestArm2Location) +
    averageAutumnatonValue(bestArm2Location) +
    (seasonalItemValue(bestLocationWithArm2) + averageAutumnatonValue(bestLocationWithArm2)) *
      Math.max(0, expectedRemainingExpeditions() - 1);

  const extraSeasonalExpectedProfit =
    seasonalItemValue(bestCowCatcherLocation) +
    averageAutumnatonValue(bestCowCatcherLocation) +
    (seasonalItemValue(
      bestLocation,
      cowCatcherUpgradePossible ? AutumnAton.seasonalItems() + 1 : AutumnAton.seasonalItems()
    ) +
      averageAutumnatonValue(bestLocation)) *
      Math.max(0, expectedRemainingExpeditions() - 1);

  const expectedProfits = [
    { upgrade: "currentExpectedProfit", profit: currentExpectedProfit },
    { upgrade: "extraAcuity1ExpectedProfit", profit: extraAcuity1ExpectedProfit },
    { upgrade: "extraAcuity2ExpectedProfit", profit: extraAcuity2ExpectedProfit },
    { upgrade: "extraLeg1ExpectedProfit", profit: extraLeg1ExpectedProfit },
    { upgrade: "extraLeg2ExpectedProfit", profit: extraLeg2ExpectedProfit },
    { upgrade: "extraArm1ExpectedProfit", profit: extraArm1ExpectedProfit },
    { upgrade: "extraArm2ExpectedProfit", profit: extraArm2ExpectedProfit },
    { upgrade: "extraSeasonalExpectedProfit", profit: extraSeasonalExpectedProfit },
  ];

  switch (maxBy(expectedProfits, ({ profit }) => profit).upgrade) {
    case "extraAcuity1ExpectedProfit":
      return acuity1Locations;
    case "extraAcuity2ExpectedProfit":
      return acuity2Locations;
    case "extraLeg1ExpectedProfit":
      return leg1Locations;
    case "extraLeg2ExpectedProfit":
      return leg2Locations;
    case "extraArm1ExpectedProfit":
      return arm1Locations;
    case "extraArm2ExpectedProfit":
      return arm2Locations;
    case "extraSeasonalExpectedProfit":
      return cowCatcherLocations;
    default:
      return fullLocations;
  }
}
