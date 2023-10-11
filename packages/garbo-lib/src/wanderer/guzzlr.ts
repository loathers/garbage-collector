import {
  buy,
  craftType,
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
        wandererTurnsAvailableToday(options, location) < remaningTurns)) // or ascending and not enough turns to finish
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

function guzzlrValue(
  buckValue: number,
  tier: "bronze" | "gold" | "platinum" | null,
) {
  const progressPerTurn = 100 / (10 - get("_guzzlrDeliveries"));

  switch (tier) {
    case null:
      return 0;
    case "bronze":
      return (3 * buckValue) / progressPerTurn;
    case "gold":
      return (6 * buckValue) / progressPerTurn;
    case "platinum":
      return (21.5 * buckValue) / progressPerTurn;
  }
}

export function guzzlrFactory(
  _type: DraggableFight,
  locationSkiplist: Location[],
  options: WandererFactoryOptions,
): WandererTarget[] {
  if (Guzzlr.have()) {
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
            new WandererTarget(
              "Guzzlr",
              location,
              guzzlrValue(buckValue, Guzzlr.getTier()) - mallPrice(guzzlrBooze),
              () => {
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
                    buy(
                      1,
                      guzzlrBooze,
                      guzzlrValue(buckValue, Guzzlr.getTier()),
                    );
                  }
                }
                return have(guzzlrBooze);
              },
            ),
          ]
        : [];
    }
  }
  return [];
}
