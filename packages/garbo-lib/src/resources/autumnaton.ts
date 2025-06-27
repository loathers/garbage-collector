import {
  availableAmount,
  Item,
  itemDropsArray,
  Location,
  myAdventures,
  setLocation,
} from "kolmafia";
import { DEFAULT_VALUE_FUNCTIONS } from "./lib";
import {
  $items,
  $location,
  $locations,
  AutumnAton,
  get,
  maxBy,
  sum,
} from "libram";
import { availableMonsters } from "../wanderer/lib";

export type AutumnAtonOptions = {
  averageItemValue: (...items: Item[]) => number;
  estimatedTurns: () => number;
  estimatedTurnsTomorrow: () => number;
};

export class AutumnAtonManager {
  averageItemValue: (...items: Item[]) => number =
    DEFAULT_VALUE_FUNCTIONS.averageValue;
  estimatedTurns: () => number = myAdventures;
  estimatedTurnsTomorrow: () => number = () => 0;

  static locationBanlist = $locations`The Daily Dungeon`; // The Daily Dungeon has no native monsters

  static profitRelevantUpgrades = [
    "leftarm1",
    "leftleg1",
    "rightarm1",
    "rightleg1",
    "cowcatcher",
    "periscope",
    "radardish",
  ] as const;

  constructor({
    averageItemValue,
    estimatedTurns,
    estimatedTurnsTomorrow,
  }: Partial<AutumnAtonOptions>) {
    if (averageItemValue) this.averageItemValue = averageItemValue;
    if (estimatedTurns) this.estimatedTurns = estimatedTurns;
    if (estimatedTurnsTomorrow) {
      this.estimatedTurnsTomorrow = estimatedTurnsTomorrow;
    }
  }

  bestLocation = (locations: Location[]): Location =>
    maxBy(this.bestLocationsByUpgrade(locations), (it) =>
      this.averageValue(it),
    );

  seasonalItemValue(location: Location, seasonalOverride?: number): number {
    // Find the value of the drops based on zone difficulty/type
    const autumnItems = $items`autumn leaf, AutumnFest ale, autumn breeze, autumn dollar, autumn years wisdom`;
    const avgValueOfRandomAutumnItem = this.averageItemValue(...autumnItems);
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
          : this.averageItemValue(autumnItem))
      );
    } else {
      // If we're in a location without any uniques, we still get cowcatcher items
      return seasonalItemDrops > 1 ? avgValueOfRandomAutumnItem : 0;
    }
  }

  averageValue(
    location: Location,
    acuityOverride?: number,
    slotOverride?: number,
  ): number {
    if (location === $location`Shadow Rift`) {
      setLocation($location`Shadow Rift`);
    } // FIXME This bypasses a mafia bug where ingress is not updated
    const monsters = availableMonsters(location);

    if (monsters.length === 0) {
      return this.seasonalItemValue(location); // We still get seasonal items, even if there are no monsters
    } else {
      const maximumDrops = slotOverride ?? AutumnAton.zoneItems();
      const acuityCutoff =
        20 - (acuityOverride ?? AutumnAton.visualAcuity()) * 5;
      const validDrops = monsters
        .flatMap((m) => itemDropsArray(m))
        .map(({ rate, type, drop }) => ({
          value: !["c", "0", "a"].includes(type)
            ? this.averageItemValue(drop)
            : 0,
          preAcuityExpectation: ["c", "0", ""].includes(type)
            ? (2 * rate) / 100
            : 0,
          postAcuityExpectation:
            rate >= acuityCutoff && ["c", "0", ""].includes(type)
              ? (8 * rate) / 100
              : 0,
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
      return this.seasonalItemValue(location) + expectedCollectionValue;
    }
  }

  expectedRemainingExpeditions(legs = AutumnAton.legs()): number {
    // Better estimate upgrade value if not ascending
    const availableAutumnatonTurns =
      this.estimatedTurns() -
      AutumnAton.turnsLeft() +
      this.estimatedTurnsTomorrow();
    const quests = get("_autumnatonQuests");
    const legOffsetFactor = 11 * Math.max(quests - legs - 1, 0);
    return Math.floor(
      Math.sqrt(
        quests ** 2 + (2 * (availableAutumnatonTurns - legOffsetFactor)) / 11,
      ),
    );
  }

  profitFromExtraAcuity(
    bestLocationContainingUpgrade: Location,
    bestLocationWithInstalledUpgrade: Location,
  ): number {
    return (
      this.averageValue(bestLocationContainingUpgrade) +
      this.averageValue(bestLocationWithInstalledUpgrade) *
        Math.max(0, this.expectedRemainingExpeditions() - 1)
    );
  }

  profitFromExtraLeg(
    bestLocationContainingUpgrade: Location,
    bestLocationWithInstalledUpgrade: Location,
  ): number {
    return (
      this.averageValue(bestLocationContainingUpgrade) +
      this.averageValue(bestLocationWithInstalledUpgrade) *
        Math.max(
          0,
          this.expectedRemainingExpeditions(AutumnAton.legs() + 1) - 1,
        )
    );
  }

  profitFromExtraArm(
    bestLocationContainingUpgrade: Location,
    bestLocationWithInstalledUpgrade: Location,
  ): number {
    return (
      this.averageValue(bestLocationContainingUpgrade) +
      this.averageValue(bestLocationWithInstalledUpgrade) *
        Math.max(0, this.expectedRemainingExpeditions() - 1)
    );
  }

  profitFromExtraAutumnItem(
    bestLocationContainingUpgrade: Location,
    bestLocationWithInstalledUpgrade: Location,
  ): number {
    return (
      this.averageValue(bestLocationContainingUpgrade) +
      (this.seasonalItemValue(bestLocationWithInstalledUpgrade) +
        this.averageValue(bestLocationWithInstalledUpgrade)) *
        Math.max(0, this.expectedRemainingExpeditions() - 1)
    );
  }

  makeUpgradeValuator(
    fullLocations: Location[],
    currentBestLocation: Location,
  ) {
    return (upgrade: AutumnAton.Upgrade) => {
      const upgradeLocations = fullLocations.filter(
        (location) => AutumnAton.getUniques(location)?.upgrade === upgrade,
      );

      if (!upgradeLocations.length) {
        return { upgrade, profit: 0 };
      }

      const bestLocationContainingUpgrade = maxBy(upgradeLocations, (l) =>
        this.averageValue(l),
      );

      switch (upgrade) {
        case "periscope":
        case "radardish": {
          const bestLocationWithInstalledUpgrade = maxBy(
            fullLocations,
            (loc: Location) =>
              this.averageValue(loc, AutumnAton.visualAcuity() + 1),
          );
          return {
            upgrade,
            profit: this.profitFromExtraAcuity(
              bestLocationContainingUpgrade,
              bestLocationWithInstalledUpgrade,
            ),
          };
        }
        case "rightleg1":
        case "leftleg1": {
          return {
            upgrade,
            profit: this.profitFromExtraLeg(
              bestLocationContainingUpgrade,
              currentBestLocation,
            ),
          };
        }
        case "rightarm1":
        case "leftarm1": {
          const bestLocationWithInstalledUpgrade = maxBy(
            fullLocations,
            (loc: Location) =>
              this.averageValue(loc, undefined, AutumnAton.zoneItems() + 1),
          );
          return {
            upgrade,
            profit: this.profitFromExtraArm(
              bestLocationContainingUpgrade,
              bestLocationWithInstalledUpgrade,
            ),
          };
        }
        case "cowcatcher": {
          return {
            upgrade,
            profit: this.profitFromExtraAutumnItem(
              bestLocationContainingUpgrade,
              currentBestLocation,
            ),
          };
        }
        default: {
          return { upgrade, profit: 0 };
        }
      }
    };
  }
  bestLocationsByUpgrade(fullLocations: Location[]): Location[] {
    const validLocations = fullLocations.filter(
      (l) =>
        l.parent !== "Clan Basement" &&
        !AutumnAtonManager.locationBanlist.includes(l),
    );
    // This function shouldn't be getting called if we don't have an expedition left
    if (this.expectedRemainingExpeditions() < 1) {
      return validLocations;
    }
    const currentUpgrades = AutumnAton.currentUpgrades();
    const acquirableUpgrades = AutumnAtonManager.profitRelevantUpgrades.filter(
      (upgrade) => !currentUpgrades.includes(upgrade),
    );

    if (acquirableUpgrades.length === 0) {
      return validLocations;
    }

    const currentBestLocation = maxBy(validLocations, (l) =>
      this.averageValue(l),
    );
    const currentExpectedProfit =
      this.averageValue(currentBestLocation) *
      this.expectedRemainingExpeditions();

    const upgradeValuations = acquirableUpgrades.map(
      this.makeUpgradeValuator(validLocations, currentBestLocation),
    );

    const { upgrade: highestValueUpgrade, profit: profitFromBestUpgrade } =
      maxBy(upgradeValuations, "profit");

    if (profitFromBestUpgrade > currentExpectedProfit) {
      const upgradeLocations = validLocations.filter(
        (location) =>
          AutumnAton.getUniques(location)?.upgrade === highestValueUpgrade,
      );
      return upgradeLocations;
    } else {
      return validLocations;
    }
  }
}
