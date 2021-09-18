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
  SourceTerminal,
} from "libram";
import { estimatedTurns } from "./embezzler";

export enum draggableFight {
  BACKUP,
  WANDERER,
}

function untangleDigitizes(turnCount: number, chunks: number): number {
  const turnsPerChunk = turnCount / chunks;
  const monstersPerChunk = Math.sqrt((turnsPerChunk + 3) / 5 + 1 / 4) - 1 / 2;
  return Math.floor(chunks * monstersPerChunk);
}

function digitizedMonstersRemaining(): number {
  if (!SourceTerminal.have()) return 0;

  const digitizesLeft = clamp(3 - get("_sourceTerminalDigitizeUses"), 0, 3);
  if (digitizesLeft === 3) return untangleDigitizes(estimatedTurns(), 3);

  const monsterCount = get("_sourceTerminalDigitizeMonsterCount") + 1;

  const relayArray = get("relayCounters").match(/(d+):Digitize Monster/);
  const nextDigitizeEncounter = relayArray ? parseInt(relayArray[1]) : myTurncount();

  const turnsLeftAtNextMonster = estimatedTurns() - (nextDigitizeEncounter - myTurncount());
  const turnsAtLastDigitize = turnsLeftAtNextMonster + ((monsterCount + 1) * monsterCount * 5 - 3);
  return untangleDigitizes(turnsAtLastDigitize, digitizesLeft + 1);
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

function acceptBestGuzzlrQuest() {
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
}

function testZoneAndUsePotionToAccess() {
  const guzzlZone = Guzzlr.getLocation();
  if (!guzzlZone) return false;
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
    if (guzzlZone.zone === place.zone && !have(place.effect)) {
      if (!have(place.potion)) {
        buy(1, place.potion, 10000);
      }
      use(1, place.potion);
    }
  });
  const blacklist = $locations`The Oasis, The Bubblin' Caldera, Barrrney's Barrr, The F'c'le, The Poop Deck, Belowdecks, 8-Bit Realm, Madness Bakery, The Secret Government Laboratory`;
  if (
    forbiddenZones.includes(guzzlZone.zone) ||
    blacklist.includes(guzzlZone) ||
    guzzlZone.environment === "underwater" ||
    !canAdv(guzzlZone, false)
  ) {
    return false;
  } else {
    return true;
  }
}

function testZoneForBackups(location: Location): boolean {
  const backupBlacklist = $locations`The Overgrown Lot, The Skeleton Store, The Mansion of Dr. Weirdeaux`;
  return !backupBlacklist.includes(location) && location.combatPercent >= 100;
}

function testZoneForWanderers(location: Location): boolean {
  const wandererBlacklist = $locations`The Batrat and Ratbat Burrow, Guano Junction, The Beanbat Chamber`;
  return !wandererBlacklist.includes(location) && location.wanderers;
}

export function determineDraggableZoneAndEnsureAccess(
  type: draggableFight = draggableFight.WANDERER
): Location {
  const defaultLocation =
    get("_spookyAirportToday") || get("spookyAirportAlways")
      ? $location`The Deep Dark Jungle`
      : $location`Noob Cave`;
  if (!Guzzlr.have()) return defaultLocation;

  const predictedWanderers =
    digitizedMonstersRemaining() +
    (have($item`"I Voted!" sticker`) ? clamp(3 - get("_voteFreeFights"), 0, 3) : 0);
  const predictedBackups = have($item`backup camera`) ? clamp(11 - get("_backUpUses"), 0, 11) : 0;
  const turnsLeftOnThisQuest = Math.ceil(
    (100 - get("guzzlrDeliveryProgress")) / (10 - get("_guzzlrDeliveries"))
  );

  acceptBestGuzzlrQuest();

  const currentGuzzlrZone = Guzzlr.getLocation() || $location`none`;
  if (
    !testZoneAndUsePotionToAccess() ||
    (!testZoneForWanderers(currentGuzzlrZone) &&
      predictedWanderers > predictedBackups &&
      predictedBackups < turnsLeftOnThisQuest) ||
    (!testZoneForBackups(currentGuzzlrZone) && predictedBackups >= predictedWanderers)
  ) {
    Guzzlr.abandon();
  }
  acceptBestGuzzlrQuest();

  const guzzlZone = Guzzlr.getLocation();
  if (!testZoneAndUsePotionToAccess()) return defaultLocation;
  if (
    !guzzlZone ||
    (type === draggableFight.WANDERER && !testZoneForWanderers(guzzlZone)) ||
    (type === draggableFight.BACKUP && !testZoneForBackups(guzzlZone))
  ) {
    return defaultLocation;
  }

  if (Guzzlr.getTier() === "platinum") {
    zonePotions.forEach((place) => {
      if (guzzlZone.zone === place.zone && !have(place.effect)) {
        if (!have(place.potion)) {
          buy(1, place.potion, 10000);
        }
        use(1, place.potion);
      }
    });
    if (!Guzzlr.havePlatinumBooze()) {
      print("It's time to get buttery", "purple");
      cliExecute("make buttery boy");
    }
  } else {
    const guzzlrBooze = Guzzlr.getBooze();
    if (!guzzlrBooze) {
      return defaultLocation;
    } else if (!have(guzzlrBooze)) {
      print("just picking up some booze before we roll", "blue");
      retrieveItem(guzzlrBooze);
    }
  }
  return guzzlZone;
}
