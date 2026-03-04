import {
  buy,
  craftType,
  Item,
  Location,
  mallPrice,
  print,
  retrieveItem,
} from "kolmafia";
import { $item, freeCrafts, get, Guzzlr, have } from "libram";
import {
  canAdventureOrUnlock,
  DraggableFight,
  WandererFactoryOptions,
  WandererTarget,
  wandererTurnsAvailableToday,
} from "./lib";

function considerAbandon(
  options: WandererFactoryOptions,
  locationSkiplist: Location[],
) {
  const location = Guzzlr.getLocation();
  const remaningTurns = Math.ceil(
    (100 - get("guzzlrDeliveryProgress")) / (10 - get("_guzzlrDeliveries")),
  );

  print(
    `Got guzzlr quest ${Guzzlr.getTier()} at ${Guzzlr.getLocation()} with remaining turns ${remaningTurns}`,
  );

  if (
    Guzzlr.canAbandon() &&
    // consider abandoning
    (!location || // if mafia failed to track the location correctly
      locationSkiplist.includes(location) ||
      !canAdventureOrUnlock(location) || // or the zone is marked as "generally cannot adv"
      (options.ascend &&
        wandererTurnsAvailableToday(options, location, true) < remaningTurns)) // or ascending and not enough turns to finish
  ) {
    print("Abandoning...");
    Guzzlr.abandon();
  }
}

function acceptGuzzlrQuest(
  options: WandererFactoryOptions,
  locationSkiplist: Location[],
) {
  if (Guzzlr.isQuestActive()) considerAbandon(options, locationSkiplist);
  while (!Guzzlr.isQuestActive()) {
    print("Picking a guzzlr quest");
    if (
      Guzzlr.canPlatinum() &&
      !(options.prioritizeCappingGuzzlr && Guzzlr.haveFullPlatinumBonus())
    ) {
      Guzzlr.acceptPlatinum();
    } else if (
      Guzzlr.canGold() &&
      (Guzzlr.haveFullBronzeBonus() || !Guzzlr.haveFullGoldBonus())
    ) {
      // if gold is not maxed, do that first since they are limited per day
      Guzzlr.acceptGold();
    } else {
      // fall back to bronze when can't plat, can't gold, or bronze is not maxed
      Guzzlr.acceptBronze();
    }
    considerAbandon(options, locationSkiplist);
  }
}

function guzzlrValuePerTurn(
  buckValue: number,
  tier: "bronze" | "gold" | "platinum" | null,
  guzzlrBooze: Item,
) {
  const turnsToCompleteQuest = 100 / Math.max(3, 10 - get("_guzzlrDeliveries"));
  const boozePrice = mallPrice(guzzlrBooze);

  switch (tier) {
    case null:
      return 0;
    case "bronze":
      return (3 * buckValue - boozePrice) / turnsToCompleteQuest;
    case "gold":
      return (6 * buckValue - boozePrice) / turnsToCompleteQuest;
    case "platinum":
      return (21.5 * buckValue - boozePrice) / turnsToCompleteQuest;
  }
}

export function guzzlrFactory(
  type: DraggableFight,
  locationSkiplist: Location[],
  options: WandererFactoryOptions,
): WandererTarget[] {
  if (Guzzlr.have() && type !== "freerun") {
    const buckValue = options.itemValue($item`Guzzlrbuck`);
    acceptGuzzlrQuest(options, locationSkiplist);
    const location = Guzzlr.getLocation();
    if (location !== null) {
      const guzzlrBooze =
        Guzzlr.getTier() === "platinum"
          ? Guzzlr.getCheapestPlatinumCocktail()
          : Guzzlr.getBooze();
      return guzzlrBooze
        ? [
            new WandererTarget({
              name: "Guzzlr",
              location: location,
              zoneValue: guzzlrValuePerTurn(
                buckValue,
                Guzzlr.getTier(),
                guzzlrBooze,
              ),
              prepareTurn: () => {
                if (!guzzlrBooze) {
                  // this is an error state - accepted a guzzlr quest but mafia doesn't know the booze
                  return false;
                }

                if (!have(guzzlrBooze)) {
                  const fancy =
                    guzzlrBooze && craftType(guzzlrBooze).includes("fancy");
                  if (
                    guzzlrBooze &&
                    (!fancy || (fancy && freeCrafts("booze") > 0))
                  ) {
                    retrieveItem(guzzlrBooze);
                  } else if (guzzlrBooze) {
                    buy(1, guzzlrBooze, buckValue * Guzzlr.expectedReward());
                  }
                }
                return have(guzzlrBooze);
              },
            }),
          ]
        : [];
    }
  }
  return [];
}
