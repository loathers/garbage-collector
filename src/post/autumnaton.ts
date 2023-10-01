import { garboAverageValue, garboValue } from "../garboValue";
import { estimatedGarboTurns, estimatedTurnsTomorrow } from "../turns";
import { appearanceRates, availableAmount, getMonsters, itemDropsArray, Location } from "kolmafia";
import { $items, AutumnAton, get, maxBy, sum } from "libram";
import { globalOptions } from "../config";

export default function bestAutumnatonLocation(locations: Location[]): Location {
  return maxBy(mostValuableUpgrade(locations), averageAutumnatonValue);
}

function averageAutumnatonValue(
  location: Location,
  acuityOverride?: number,
  slotOverride?: number,
): number {
  const badAttributes = ["LUCKY", "ULTRARARE", "BOSS"];
  const rates = appearanceRates(location);
  const monsters = getMonsters(location).filter(
    (m) => !badAttributes.some((s) => m.attributes.includes(s)) && rates[m.name] > 0,
  );

  if (monsters.length === 0) {
    return 0;
  } else {
    const maximumDrops = slotOverride ?? AutumnAton.zoneItems();
    const acuityCutoff = 20 - (acuityOverride ?? AutumnAton.visualAcuity()) * 5;
    const validDrops = monsters
      .map((m) => itemDropsArray(m))
      .flat()
      .map(({ rate, type, drop }) => ({
        value: !["c", "0"].includes(type) ? garboValue(drop, true) : 0,
        preAcuityExpectation: ["c", "0", ""].includes(type) ? (2 * rate) / 100 : 0,
        postAcuityExpectation:
          rate >= acuityCutoff && ["c", "0", ""].includes(type) ? (8 * rate) / 100 : 0,
      }));
    const overallExpectedDropQuantity = sum(
      validDrops,
      ({ preAcuityExpectation, postAcuityExpectation }) =>
        preAcuityExpectation + postAcuityExpectation,
    );
    const expectedCollectionValue = sum(
      validDrops,
      ({ value, preAcuityExpectation, postAcuityExpectation }) => {
        // This gives us the adjusted amount to fit within our total amount of available drop slots
        const adjustedDropAmount =
          (preAcuityExpectation + postAcuityExpectation) *
          Math.min(1, maximumDrops / overallExpectedDropQuantity);
        return adjustedDropAmount * value;
      },
    );
    return seasonalItemValue(location) + expectedCollectionValue;
  }
}

function seasonalItemValue(location: Location, seasonalOverride?: number): number {
  // Find the value of the drops based on zone difficulty/type
  const autumnItems = $items`autumn leaf, AutumnFest ale, autumn breeze, autumn dollar, autumn years wisdom`;
  const avgValueOfRandomAutumnItem = garboAverageValue(...autumnItems);
  const autumnMeltables = $items`autumn debris shield, autumn leaf pendant, autumn sweater-weather sweater`;
  const autumnItem = AutumnAton.getUniques(location)?.item;
  const seasonalItemDrops = seasonalOverride ?? AutumnAton.seasonalItems();
  if (autumnItem) {
    return (
      (seasonalItemDrops > 1 ? avgValueOfRandomAutumnItem : 0) +
      (autumnMeltables.includes(autumnItem)
        ? // If we already have the meltable, then we get a random item, else value at 0
          availableAmount(autumnItem) > 0
          ? avgValueOfRandomAutumnItem
          : 0
        : garboValue(autumnItem, true))
    );
  } else {
    // If we're in a location without any uniques, we still get cowcatcher items
    return seasonalItemDrops > 1 ? avgValueOfRandomAutumnItem : 0;
  }
}

function expectedRemainingExpeditions(legs = AutumnAton.legs()): number {
  // Better estimate upgrade value if not ascending
  const availableAutumnatonTurns =
    estimatedGarboTurns() -
    AutumnAton.turnsLeft() +
    (globalOptions.ascend ? 0 : estimatedTurnsTomorrow);
  const quests = get("_autumnatonQuests");
  const legOffsetFactor = 11 * Math.max(quests - legs - 1, 0);
  return Math.floor(
    Math.sqrt(quests ** 2 + (2 * (availableAutumnatonTurns - legOffsetFactor)) / 11),
  );
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

function profitFromExtraAcuity(
  bestLocationContainingUpgrade: Location,
  bestLocationWithInstalledUpgrade: Location,
): number {
  return (
    averageAutumnatonValue(bestLocationContainingUpgrade) +
    averageAutumnatonValue(bestLocationWithInstalledUpgrade) *
      Math.max(0, expectedRemainingExpeditions() - 1)
  );
}
function profitFromExtraLeg(
  bestLocationContainingUpgrade: Location,
  bestLocationWithInstalledUpgrade: Location,
): number {
  return (
    averageAutumnatonValue(bestLocationContainingUpgrade) +
    averageAutumnatonValue(bestLocationWithInstalledUpgrade) *
      Math.max(0, expectedRemainingExpeditions(AutumnAton.legs() + 1) - 1)
  );
}
function profitFromExtraArm(
  bestLocationContainingUpgrade: Location,
  bestLocationWithInstalledUpgrade: Location,
): number {
  return (
    averageAutumnatonValue(bestLocationContainingUpgrade) +
    averageAutumnatonValue(bestLocationWithInstalledUpgrade) *
      Math.max(0, expectedRemainingExpeditions() - 1)
  );
}
function profitFromExtraAutumnItem(
  bestLocationContainingUpgrade: Location,
  bestLocationWithInstalledUpgrade: Location,
): number {
  return (
    averageAutumnatonValue(bestLocationContainingUpgrade) +
    (seasonalItemValue(bestLocationWithInstalledUpgrade) +
      averageAutumnatonValue(bestLocationWithInstalledUpgrade)) *
      Math.max(0, expectedRemainingExpeditions() - 1)
  );
}

function makeUpgradeValuator(fullLocations: Location[], currentBestLocation: Location) {
  return function (upgrade: AutumnAton.Upgrade) {
    const upgradeLocations = fullLocations.filter(
      (location) => AutumnAton.getUniques(location)?.upgrade === upgrade,
    );

    if (!upgradeLocations.length) {
      return { upgrade, profit: 0 };
    }

    const bestLocationContainingUpgrade = maxBy(upgradeLocations, averageAutumnatonValue);

    switch (upgrade) {
      case "periscope":
      case "radardish": {
        const bestLocationWithInstalledUpgrade = maxBy(fullLocations, (loc: Location) =>
          averageAutumnatonValue(loc, AutumnAton.visualAcuity() + 1),
        );
        return {
          upgrade,
          profit: profitFromExtraAcuity(
            bestLocationContainingUpgrade,
            bestLocationWithInstalledUpgrade,
          ),
        };
      }
      case "rightleg1":
      case "leftleg1": {
        return {
          upgrade,
          profit: profitFromExtraLeg(bestLocationContainingUpgrade, currentBestLocation),
        };
      }
      case "rightarm1":
      case "leftarm1": {
        const bestLocationWithInstalledUpgrade = maxBy(fullLocations, (loc: Location) =>
          averageAutumnatonValue(loc, undefined, AutumnAton.zoneItems() + 1),
        );
        return {
          upgrade,
          profit: profitFromExtraArm(
            bestLocationContainingUpgrade,
            bestLocationWithInstalledUpgrade,
          ),
        };
      }
      case "cowcatcher": {
        return {
          upgrade,
          profit: profitFromExtraAutumnItem(bestLocationContainingUpgrade, currentBestLocation),
        };
      }
      default: {
        return { upgrade, profit: 0 };
      }
    }
  };
}

function mostValuableUpgrade(fullLocations: Location[]): Location[] {
  const validLocations = fullLocations.filter((l) => l.parent !== "Clan Basement");
  // This function shouldn't be getting called if we don't have an expedition left
  if (expectedRemainingExpeditions() < 1) {
    return validLocations;
  }
  const currentUpgrades = AutumnAton.currentUpgrades();
  const acquirableUpgrades = profitRelevantUpgrades.filter(
    (upgrade) => !currentUpgrades.includes(upgrade),
  );

  if (acquirableUpgrades.length === 0) {
    return validLocations;
  }

  const currentBestLocation = maxBy(validLocations, averageAutumnatonValue);
  const currentExpectedProfit =
    averageAutumnatonValue(currentBestLocation) * expectedRemainingExpeditions();

  const upgradeValuations = acquirableUpgrades.map(
    makeUpgradeValuator(validLocations, currentBestLocation),
  );

  const { upgrade: highestValueUpgrade, profit: profitFromBestUpgrade } = maxBy(
    upgradeValuations,
    "profit",
  );

  if (profitFromBestUpgrade > currentExpectedProfit) {
    const upgradeLocations = validLocations.filter(
      (location) => AutumnAton.getUniques(location)?.upgrade === highestValueUpgrade,
    );
    return upgradeLocations;
  } else {
    return validLocations;
  }
}
