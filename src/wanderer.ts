import { canAdv } from "canadv.ash";
import { buy, craftType, myTurncount, print, retrieveItem, use } from "kolmafia";
import {
  $effect,
  $item,
  $location,
  $locations,
  $skill,
  clamp,
  get,
  getSaleValue,
  Guzzlr,
  have,
  questStep,
  SourceTerminal,
} from "libram";
import { acquire } from "./acquire";
import { estimatedTurns } from "./embezzler";
import { globalOptions, propertyManager } from "./lib";

export enum draggableFight {
  BACKUP,
  WANDERER,
}
const WANDERER_PRICE_THRESHOLD = 10000;

function untangleDigitizes(turnCount: number, chunks: number): number {
  const turnsPerChunk = turnCount / chunks;
  const monstersPerChunk = Math.sqrt((turnsPerChunk + 3) / 5 + 1 / 4) - 1 / 2;
  return Math.round(chunks * monstersPerChunk);
}

export function digitizedMonstersRemaining(): number {
  if (!SourceTerminal.have()) return 0;

  const digitizesLeft = clamp(3 - get("_sourceTerminalDigitizeUses"), 0, 3);
  if (digitizesLeft === 3) return untangleDigitizes(estimatedTurns(), 3);

  const monsterCount = get("_sourceTerminalDigitizeMonsterCount") + 1;

  const relayArray = get("relayCounters").match(/(\d+):Digitize Monster/);
  const nextDigitizeEncounter = relayArray ? parseInt(relayArray[1]) : myTurncount();

  const turnsLeftAtNextMonster = estimatedTurns() - (nextDigitizeEncounter - myTurncount());
  if (turnsLeftAtNextMonster <= 0) return 0;
  const turnsAtLastDigitize = turnsLeftAtNextMonster + ((monsterCount + 1) * monsterCount * 5 - 3);
  return (
    untangleDigitizes(turnsAtLastDigitize, digitizesLeft + 1) -
    get("_sourceTerminalDigitizeMonsterCount")
  );
}

interface ZoneUnlocker {
  zone: string | null;
  location: Location | null;
  available: () => boolean;
  unlocker: Item;
  noInv?: boolean;
}

function airportAvailable(element: "spooky" | "stench" | "hot" | "cold" | "sleaze"): boolean {
  return get(`_${element}AirportToday`) || get(`${element}AirportAlways`);
}

const zoneUnlockers: ZoneUnlocker[] = [
  {
    zone: "Spaaace",
    location: null,
    available: () => have($effect`Transpondent`),
    unlocker: $item`transporter transponder`,
  },
  {
    zone: "Wormwood",
    location: null,
    available: () => have($effect`Absinthe-Minded`),
    unlocker: $item`tiny bottle of absinthe`,
  },
  {
    zone: "RabbitHole",
    location: null,
    available: () => have($effect`Down the Rabbit Hole`),
    unlocker: $item`"DRINK ME" potion`,
  },
  {
    zone: "Conspiracy Island",
    location: null,
    available: () => airportAvailable("spooky"),
    unlocker: $item`one-day ticket to Conspiracy Island`,
    noInv: true,
  },
  {
    zone: "Dinseylandfill",
    location: null,
    available: () => airportAvailable("stench"),
    unlocker: $item`one-day ticket to Dinseylandfill`,
    noInv: true,
  },
  {
    zone: "The Glaciest",
    location: null,
    available: () => airportAvailable("cold"),
    unlocker: $item`one-day ticket to The Glaciest`,
    noInv: true,
  },
  {
    zone: "Spring Break Beach",
    location: null,
    available: () => airportAvailable("sleaze"),
    unlocker: $item`one-day ticket to Spring Break Beach`,
    noInv: true,
  },
];

function canAdvOrUnlock(loc: Location) {
  const underwater = loc.environment === "underwater";
  const skiplist = $locations`The Oasis, The Bubblin' Caldera, Barrrney's Barrr, The F'c'le, The Poop Deck, Belowdecks, 8-Bit Realm, Madness Bakery, The Secret Government Laboratory, The Dire Warren`;
  const canAdvHack = loc === $location`The Upper Chamber` && questStep("questL11Pyramid") === -1; // (hopefully) temporary fix for canadv bug that results in infinite loop
  const canUnlock = zoneUnlockers.some((z) => (z.available() || !z.noInv) && loc.zone === z.zone);
  return !underwater && !skiplist.includes(loc) && !canAdvHack && (canAdv(loc, false) || canUnlock);
}

function unlock(loc: Location) {
  const zoneUnlocker = zoneUnlockers.find((z) => z.zone === loc.zone || z.location === loc);
  if (!zoneUnlocker) return canAdv(loc, false);
  if (zoneUnlocker.available()) return true;
  if (acquire(1, zoneUnlocker.unlocker, WANDERER_PRICE_THRESHOLD, false) === 0) return false;
  return use(zoneUnlocker.unlocker);
}

function canWander(location: Location, type: draggableFight) {
  if (type === draggableFight.BACKUP) {
    const backupSkiplist = $locations`The Overgrown Lot, The Skeleton Store, The Mansion of Dr. Weirdeaux`;
    return !backupSkiplist.includes(location) && location.combatPercent >= 100;
  } else if (type === draggableFight.WANDERER) {
    const wandererSkiplist = $locations`The Batrat and Ratbat Burrow, Guano Junction, The Beanbat Chamber`;
    return !wandererSkiplist.includes(location) && location.wanderers;
  }
  return false;
}

function wandererTurnsAvailableToday(zone: Location) {
  return (
    (canWander(zone, draggableFight.WANDERER)
      ? digitizedMonstersRemaining() +
        (have($item`"I Voted!" sticker`) ? clamp(3 - get("_voteFreeFights"), 0, 3) : 0)
      : 0) +
    (canWander(zone, draggableFight.BACKUP) && have($item`backup camera`)
      ? clamp(11 - get("_backUpUses"), 0, 11)
      : 0)
  );
}

function freeCrafts() {
  return (
    (have($skill`Rapid Prototyping`) ? 5 - get("_rapidPrototypingUsed") : 0) +
    (have($skill`Expert Corner-Cutter`) ? 5 - get("_expertCornerCutterUsed") : 0)
  );
}
class WandererTarget {
  name: string;
  available: () => boolean;
  prepareWanderer: () => boolean;
  location: () => Location | null;
  value: () => number;
  prepareTurn: () => boolean;

  /**
   * Process for determining where to put a wanderer to extract additional value from it
   * @param name name of this wanderer - for documentation/logging purposes
   * @param available returns whether we can actually use this particular wanderer target
   * @param location returns the location to adventure to target this; null only if something goes wrong
   * @param value the expected additional value of putting a single wanderer-fight into the zone for this
   * @param prepareWanderer attempt to set this up without spending any turns or meat
   * @param prepareTurn attempt to set up, spending meat and or items as necessary
   */
  constructor(
    name: string,
    available: () => boolean,
    location: () => Location | null,
    value: () => number,
    prepareWanderer: () => boolean = () => true,
    prepareTurn: () => boolean = () => true
  ) {
    this.name = name;
    this.available = available;
    this.prepareWanderer = prepareWanderer;
    this.value = value;
    this.location = location;
    this.prepareTurn = prepareTurn;
  }

  computeCachedValue() {
    if (this.available() && this.prepareWanderer() && this.location()) {
      return { value: this.value(), target: this };
    }
    return { value: 0, target: this };
  }
}

const wandererTargets = [
  new WandererTarget(
    "Guzzlr",
    () => Guzzlr.have(),
    () => Guzzlr.getLocation(),
    () => {
      const tier = Guzzlr.getTier();
      const progressPerTurn = 100 / (10 - get("_guzzlrDeliveries"));
      if (tier) {
        const buckValue = getSaleValue($item`Never Don't Stop Not Striving`) / 1000;
        switch (tier) {
          case "bronze":
            return (3 * buckValue) / progressPerTurn;
          case "gold":
            return (6 * buckValue) / progressPerTurn;
          case "platinum":
            return (21.5 * buckValue) / progressPerTurn;
        }
      }
      return -1;
    },
    () => {
      // try to accept the best possible quest, with the following algorithm:
      // * always prefer 1 plat per day
      // * go for gold if plat unavailable and gold not maxed and bronze is maxed or if both gold and bronze are maxed
      // * go for bronze if plat unavailable and gold is maxed and either gold unavailable or quests are not maxed
      while (!Guzzlr.isQuestActive()) {
        print("Picking a guzzlr quest");
        if (Guzzlr.canPlatinum()) {
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
        const location = Guzzlr.getLocation();
        const remaningTurns = Math.ceil(
          (100 - get("guzzlrDeliveryProgress")) / (10 - get("_guzzlrDeliveries"))
        );

        print(
          `Got guzzlr quest ${Guzzlr.getTier()} at ${Guzzlr.getLocation()} with remaining turns ${remaningTurns}`
        );

        if (
          // consider abandoning
          !location || // if mafia faled to track the location correctly
          !canAdvOrUnlock(location) || // or the zone is marked as "generally cannot adv"
          (globalOptions.ascending && wandererTurnsAvailableToday(location) < remaningTurns) // or ascending and not enough turns to finish
        ) {
          print("Abandoning...");
          Guzzlr.abandon();
        }
      }

      // return true only if it is safe to try get guzzlr
      return Guzzlr.isQuestActive() && Guzzlr.getLocation() !== null;
    },
    () => {
      const guzzlrBooze =
        Guzzlr.getTier() === "platinum" ? Guzzlr.getCheapestPlatinumCocktail() : Guzzlr.getBooze();

      if (!guzzlrBooze) {
        // this is an error state - accepted a guzzlr quest but mafia doesn't know the booze
        return false;
      }

      if (!have(guzzlrBooze)) {
        const fancy = guzzlrBooze && craftType(guzzlrBooze).includes("fancy");
        if (guzzlrBooze && (!fancy || (fancy && freeCrafts() > 0))) {
          retrieveItem(guzzlrBooze);
        } else if (guzzlrBooze) {
          buy(1, guzzlrBooze, WANDERER_PRICE_THRESHOLD);
        }
      }
      return have(guzzlrBooze);
    }
  ),
  new WandererTarget(
    "Coinspiracy",
    () => airportAvailable("spooky") && get("lovebugsUnlocked"),
    () => $location`The Deep Dark Jungle`,
    () => 2 // slightly higher value
  ),
  new WandererTarget(
    "Default",
    () => true, // can always do default
    () => $location`Noob Cave`,
    () => 1 // slightly lower value
  ),
];

export function determineDraggableZoneAndEnsureAccess(
  type: draggableFight = draggableFight.WANDERER
): Location {
  const sortedTargets = wandererTargets
    .filter((target: WandererTarget) => target.available() && target.prepareWanderer())
    .map((target: WandererTarget) => target.computeCachedValue())
    .sort((a, b) => b.value - a.value);

  const best = sortedTargets.find((prospect) => {
    const location = prospect.target.location();
    print(`Trying for ${prospect.target.name}`);
    if (location) {
      print(
        `Checking canWander=${canWander(location, type)} unlock=${unlock(
          location
        )} prepareTurn=${prospect.target.prepareTurn()}`
      );
    } else {
      print("Invalid location!");
    }
    return (
      location && canWander(location, type) && unlock(location) && prospect.target.prepareTurn()
    );
  }) || { target: wandererTargets[wandererTargets.length - 1], value: 1 };

  const location = best.target.location() || $location`Noob Cave`;
  print(
    `Wandering ${best.target.name} at ${best.target.location()} for expected value ${best.value}`
  );

  const choices = unsupportedChoices.get(location);
  if (choices) propertyManager.setChoices(choices);

  return location;
}

const unsupportedChoices = new Map<Location, { [choice: number]: number | string }>([
  [$location`The Spooky Forest`, { [502]: 2, [505]: 2 }],
  [$location`Guano Junction`, { [1427]: 1 }],
  [$location`The Hidden Apartment Building`, { [780]: 6, [1578]: 6 }],
  [$location`The Black Forest`, { [923]: 1, [924]: 1 }],
  [$location`LavaCo™ Lamp Factory`, { [1091]: 9 }],
  [$location`The Haunted Laboratory`, { [884]: 6 }],
  [$location`The Haunted Nursery`, { [885]: 6 }],
  [$location`The Haunted Storage Room`, { [886]: 6 }],
  [$location`The Hidden Park`, { [789]: 6 }],
]);
