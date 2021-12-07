import { canAdv } from "canadv.ash";
import {
  availableAmount,
  buy,
  cliExecute,
  craftType,
  myTurncount,
  print,
  retrieveItem,
  use,
} from "kolmafia";
import {
  $effect,
  $item,
  $location,
  $locations,
  $skill,
  clamp,
  get,
  Guzzlr,
  have,
  questStep,
  Requirement,
  SourceTerminal,
} from "libram";
import { estimatedTurns } from "./embezzler";
import { globalOptions, propertyManager } from "./lib";

export enum draggableFight {
  BACKUP,
  WANDERER,
}
export enum wandererMode {
  GUZZLR,
  DEFAULT,
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
  zone: string;
  available: () => boolean;
  unlocker: Item;
  noInv?: boolean;
}

function airportAvailable(element: "spooky" | "stench" | "hot" | "cold" | "sleaze"): boolean {
  return get(`_{element}AirportToday`) || get(`{element}AirportAlways`);
}

const zoneUnlockers: ZoneUnlocker[] = [
  {
    zone: "Spaaace",
    available: () => have($effect`Transpondent`),
    unlocker: $item`transporter transponder`,
  },
  {
    zone: "Wormwood",
    available: () => have($effect`Absinthe-Minded`),
    unlocker: $item`tiny bottle of absinthe`,
  },
  {
    zone: "RabbitHole",
    available: () => have($effect`Down the Rabbit Hole`),
    unlocker: $item`"DRINK ME" potion`,
  },
  {
    zone: "Conspiracy Island",
    available: () => airportAvailable("spooky"),
    unlocker: $item`one-day ticket to Conspiracy Island`,
    noInv: true,
  },
  {
    zone: "Dinseylandfill",
    available: () => airportAvailable("stench"),
    unlocker: $item`one-day ticket to Dinseylandfill`,
    noInv: true,
  },
  {
    zone: "The Glaciest",
    available: () => airportAvailable("cold"),
    unlocker: $item`one-day ticket to The Glaciest`,
    noInv: true,
  },
  {
    zone: "Spring Break Beach",
    available: () => airportAvailable("sleaze"),
    unlocker: $item`one-day ticket to Spring Break Beach`,
    noInv: true,
  },
];

function testZoneAndUsePotionToAccess(zone: Location | null) {
  if (!zone) return false;

  // these zones have equip or effect requirements that we don't want to deal with
  const skiplist = $locations`The Oasis, The Bubblin' Caldera, Barrrney's Barrr, The F'c'le, The Poop Deck, Belowdecks, 8-Bit Realm, Madness Bakery, The Secret Government Laboratory`;
  if (skiplist.includes(zone)) {
    return false;
  }
  zoneUnlockers.forEach((place) => {
    if (zone.zone === place.zone && !place.available()) {
      if (
        (!place.noInv && have(place.unlocker)) ||
        buy(1, place.unlocker, WANDERER_PRICE_THRESHOLD) > 0
      ) {
        use(1, place.unlocker);
      }
    }
  });
  const canAdvHack = zone === $location`The Upper Chamber` && questStep("questL11Pyramid") === -1; // (hopefully) temporary fix for canadv bug that results in infinite loop
  if (zone.environment === "underwater" || canAdvHack || !canAdv(zone, false)) {
    return false;
  } else {
    return true;
  }
}

function testZoneForBackups(location: Location | null): boolean {
  if (!location) return false;
  const backupSkiplist = $locations`The Overgrown Lot, The Skeleton Store, The Mansion of Dr. Weirdeaux`;
  return !backupSkiplist.includes(location) && location.combatPercent >= 100;
}

function testZoneForWanderers(location: Location | null): boolean {
  if (!location) return false;
  const wandererSkiplist = $locations`The Batrat and Ratbat Burrow, Guano Junction, The Beanbat Chamber`;
  return !wandererSkiplist.includes(location) && location.wanderers;
}

function wandererTurnsAvailableToday(zone: Location) {
  return (
    (testZoneForWanderers(zone)
      ? digitizedMonstersRemaining() +
        (have($item`"I Voted!" sticker`) ? clamp(3 - get("_voteFreeFights"), 0, 3) : 0)
      : 0) +
    (testZoneForBackups(zone)
      ? have($item`backup camera`)
        ? clamp(11 - get("_backUpUses"), 0, 11)
        : 0
      : 0)
  );
}

function freeCrafts() {
  return (
    (have($skill`Rapid Prototyping`) ? 5 - get("_rapidPrototypingUsed") : 0) +
    (have($skill`Expert Corner-Cutter`) ? 5 - get("_expertCornerCutterUsed") : 0)
  );
}

function prepareGuzzlr(): boolean {
  const hasFreeCrafts = freeCrafts() > 0;
  if (!Guzzlr.isQuestActive()) {
    const platBooze = Guzzlr.getCheapestPlatinumCocktail(hasFreeCrafts);
    if (
      Guzzlr.canPlatinum() &&
      (have(platBooze) || freeCrafts() > 0 || buy(1, platBooze, WANDERER_PRICE_THRESHOLD) > 0) &&
      (!Guzzlr.haveFullPlatinumBonus() ||
        (Guzzlr.haveFullBronzeBonus() && Guzzlr.haveFullGoldBonus()))
    ) {
      Guzzlr.acceptPlatinum();
    } else if (Guzzlr.canGold() && (!Guzzlr.haveFullGoldBonus() || Guzzlr.haveFullBronzeBonus())) {
      Guzzlr.acceptGold();
    } else {
      Guzzlr.acceptBronze();
    }
  }

  const location = Guzzlr.getLocation()!;
  const guzzlrBooze =
    Guzzlr.getTier() === "platinum"
      ? Guzzlr.getCheapestPlatinumCocktail(hasFreeCrafts)
      : Guzzlr.getBooze();

  // error state - accepted a quest, but mafia says the quest location or booze is null
  if (!location || !guzzlrBooze) return false;

  const turnsInZoneToday = wandererTurnsAvailableToday(location);
  const turnsLeftOnQuest = Guzzlr.turnsLeftOnQuest();

  if (turnsInZoneToday < turnsLeftOnQuest && Guzzlr.canAbandon()) {
    Guzzlr.abandon(); // reroll a new quest if out of turns to finish this quest today
    return prepareGuzzlr();
  } else if (turnsInZoneToday < turnsLeftOnQuest && globalOptions.ascending) {
    return false; // if ascending and we won't finish the quest in time, just abandon ship
  }

  const fancy = craftType(guzzlrBooze).includes("fancy");
  if (!have(guzzlrBooze)) {
    if (!fancy || (fancy && hasFreeCrafts)) {
      retrieveItem(guzzlrBooze);
    } else {
      buy(1, guzzlrBooze, WANDERER_PRICE_THRESHOLD);
    }
  }

  return have(guzzlrBooze) && testZoneAndUsePotionToAccess(location);
}

export function determineWandererTarget(type: draggableFight): wandererMode {
  const wandererCheck =
    type === draggableFight.WANDERER ? testZoneForWanderers : testZoneForBackups;

  if (Guzzlr.have() && prepareGuzzlr() && wandererCheck(Guzzlr.getLocation())) {
    return wandererMode.GUZZLR;
  }
  return wandererMode.DEFAULT;
}

function wandererLocation(type: draggableFight, mode: wandererMode): Location {
  switch (mode) {
    case wandererMode.GUZZLR:
      return Guzzlr.getLocation()!;
    case wandererMode.DEFAULT:
      return type === draggableFight.WANDERER && airportAvailable("spooky")
        ? $location`The Deep Dark Jungle`
        : $location`Noob Cave`;
  }
}

export function determineDraggableZoneAndEnsureAccess(
  type: draggableFight = draggableFight.WANDERER
): Location {
  const mode = determineWandererTarget(type);
  const location = wandererLocation(type, mode);
  if (unsupportedChoices.get(location)) {
    propertyManager.setChoices(unsupportedChoices.get(location));
  }
  return location;
}

const unsupportedChoices = new Map<Location, { [choice: number]: number | string }>([
  [$location`Guano Junction`, { [1427]: 1 }],
  [$location`The Hidden Apartment Building`, { [780]: 4, [1578]: 6 }],
  [$location`The Black Forest`, { [923]: 1, [924]: 1 }],
  [$location`LavaCo™ Lamp Factory`, { [1091]: 9 }],
  [$location`The Haunted Laboratory`, { [884]: 6 }],
  [$location`The Haunted Nursery`, { [885]: 6 }],
  [$location`The Haunted Storage Room`, { [886]: 6 }],
  [$location`The Hidden Park`, { [789]: 6 }],
]);
