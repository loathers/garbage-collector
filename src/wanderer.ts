import { canAdv } from "canadv.ash";
import { buy, cliExecute, myTurncount, print, retrieveItem, use } from "kolmafia";
import {
  $effect,
  $item,
  $location,
  $locations,
  clamp,
  get,
  Guzzlr,
  have,
  questStep,
  Requirement,
  SourceTerminal,
} from "libram";
import { estimatedTurns } from "./embezzler";
import { propertyManager } from "./lib";

export enum draggableFight {
  BACKUP,
  WANDERER,
}
export enum wandererMode {
  GUZZLR,
  DEFAULT,
}

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

interface ZonePotion {
  zone: string;
  effect: Effect;
  potion: Item;
}

const zonePotions: ZonePotion[] = [
  {
    zone: "Spaaace",
    effect: $effect`Transpondent`,
    potion: $item`transporter transponder`,
  },
  {
    zone: "Wormwood",
    effect: $effect`Absinthe-Minded`,
    potion: $item`tiny bottle of absinthe`,
  },
  {
    zone: "RabbitHole",
    effect: $effect`Down the Rabbit Hole`,
    potion: $item`"DRINK ME" potion`,
  },
];

function testZoneAndUsePotionToAccess(zone: Location | null) {
  if (!zone) return false;
  const forbiddenZones: string[] = [""]; //can't stockpile these potions,
  if (!get("_spookyAirportToday") && !get("spookyAirportAlways")) {
    forbiddenZones.push("Conspiracy Island");
  }
  if (!get("_stenchAirportToday") && !get("stenchAirportAlways")) {
    forbiddenZones.push("Dinseylandfill");
  }
  if (!get("_hotAirportToday") && !get("hotAirportAlways")) {
    forbiddenZones.push("That 70s Volcano");
  }
  if (!get("_coldAirportToday") && !get("coldAirportAlways")) {
    forbiddenZones.push("The Glaciest");
  }
  if (!get("_sleazeAirportToday") && !get("sleazeAirportAlways")) {
    forbiddenZones.push("Spring Break Beach");
  }

  zonePotions.forEach((place) => {
    if (zone.zone === place.zone && !have(place.effect)) {
      if (!have(place.potion)) {
        buy(1, place.potion, 10000);
      }
      use(1, place.potion);
    }
  });
  const skiplist = $locations`The Oasis, The Bubblin' Caldera, Barrrney's Barrr, The F'c'le, The Poop Deck, Belowdecks, 8-Bit Realm, Madness Bakery, The Secret Government Laboratory`;
  if (
    forbiddenZones.includes(zone.zone) ||
    skiplist.includes(zone) ||
    zone.environment === "underwater" ||
    !canAdv(zone, false) ||
    (zone === $location`The Upper Chamber` && questStep("questL11Pyramid") === -1) // (hopefully) temporary fix for canadv bug that results in infinite loop
  ) {
    return false;
  } else {
    return true;
  }
}

function testZoneForBackups(location: Location | null): boolean {
  const backupSkiplist = $locations`The Overgrown Lot, The Skeleton Store, The Mansion of Dr. Weirdeaux`;
  return location !== null && !backupSkiplist.includes(location) && location.combatPercent >= 100;
}

function testZoneForWanderers(location: Location | null): boolean {
  const wandererSkiplist = $locations`The Batrat and Ratbat Burrow, Guano Junction, The Beanbat Chamber`;
  return location !== null && !wandererSkiplist.includes(location) && location.wanderers;
}

function predictedWanderers(): number {
  return (
    digitizedMonstersRemaining() +
    (have($item`"I Voted!" sticker`) ? clamp(3 - get("_voteFreeFights"), 0, 3) : 0)
  );
}

function predictedBackups() {
  return have($item`backup camera`) ? clamp(11 - get("_backUpUses"), 0, 11) : 0;
}

function turnsAvailableToday(zone: Location) {
  return (
    (testZoneForWanderers(zone) ? predictedWanderers() : 0) +
    (testZoneForBackups(zone) ? predictedBackups() : 0)
  );
}

function prepareGuzzlr(): boolean {
  if (!Guzzlr.isQuestActive()) {
    if (
      Guzzlr.canPlatinum() &&
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
  if (Guzzlr.getLocation() === null) {
    // weird error state - we have accepted a quest, but mafia says the quest location is null
    return false;
  }

  const location = Guzzlr.getLocation()!;
  const turnsLeftOnQuest = Math.ceil(
    (100 - get("guzzlrDeliveryProgress")) / (10 - get("_guzzlrDeliveries"))
  );
  if (turnsAvailableToday(location) < turnsLeftOnQuest && Guzzlr.canAbandon()) {
    Guzzlr.abandon();
    return prepareGuzzlr();
  } else if (turnsAvailableToday(location) < turnsLeftOnQuest) {
    return false;
  }

  if (Guzzlr.getTier() === "platinum") {
    if (!Guzzlr.havePlatinumBooze()) {
      cliExecute("make buttery boy");
    }
  } else {
    const guzzlrBooze = Guzzlr.getBooze();
    if (!guzzlrBooze) {
      return false;
    } else if (!have(guzzlrBooze)) {
      retrieveItem(guzzlrBooze);
    }
  }

  return testZoneAndUsePotionToAccess(location);
}

export function determineWandererTarget(
  type: draggableFight,
  noRequirements: boolean
): wandererMode {
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
      const guzzlrLocation = Guzzlr.getLocation();
      if (guzzlrLocation) {
        return guzzlrLocation;
      } else {
        return wandererLocation(type, wandererMode.DEFAULT);
      }
    case wandererMode.DEFAULT:
      return type === draggableFight.WANDERER &&
        (get("_spookyAirportToday") || get("spookyAirportAlways"))
        ? $location`The Deep Dark Jungle`
        : $location`Noob Cave`;
  }
}

export function determineDraggableZoneAndEnsureAccess(
  type: draggableFight = draggableFight.WANDERER,
  noRequirements: boolean = false
): Location {
  const mode = determineWandererTarget(type, noRequirements);
  return wandererLocation(type, mode);
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
