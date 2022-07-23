import { canAdv } from "canadv.ash";
import { buy, craftType, Item, Location, print, retrieveItem, toInt, use } from "kolmafia";
import {
  $effect,
  $item,
  $location,
  $locations,
  $skill,
  clamp,
  Counter,
  get,
  Guzzlr,
  have,
  questStep,
  SourceTerminal,
} from "libram";
import { estimatedTurns } from "./embezzler";
import { globalOptions, HIGHLIGHT, propertyManager, realmAvailable } from "./lib";
import { garboValue } from "./session";

export type DraggableFight = "backup" | "wanderer";
const WANDERER_PRICE_THRESHOLD = 10000;

function untangleDigitizes(turnCount: number, chunks: number): number {
  const turnsPerChunk = turnCount / chunks;
  const monstersPerChunk = Math.sqrt((turnsPerChunk + 3) / 5 + 1 / 4) - 1 / 2;
  return Math.round(chunks * monstersPerChunk);
}

export function digitizedMonstersRemaining(): number {
  if (!SourceTerminal.have()) return 0;

  const digitizesLeft = SourceTerminal.getDigitizeUsesRemaining();
  if (digitizesLeft === SourceTerminal.getMaximumDigitizeUses()) {
    return untangleDigitizes(estimatedTurns(), SourceTerminal.getMaximumDigitizeUses());
  }

  const monsterCount = SourceTerminal.getDigitizeMonsterCount() + 1;

  const turnsLeftAtNextMonster = estimatedTurns() - Counter.get("Digitize Monster");
  if (turnsLeftAtNextMonster <= 0) return 0;
  const turnsAtLastDigitize = turnsLeftAtNextMonster + ((monsterCount + 1) * monsterCount * 5 - 3);
  return (
    untangleDigitizes(turnsAtLastDigitize, digitizesLeft + 1) -
    SourceTerminal.getDigitizeMonsterCount()
  );
}

interface UnlockableZone {
  zone: string;
  available: () => boolean;
  unlocker: Item;
  noInv: boolean;
}

const UnlockableZones: UnlockableZone[] = [
  {
    zone: "Spaaace",
    available: () => have($effect`Transpondent`),
    unlocker: $item`transporter transponder`,
    noInv: false,
  },
  {
    zone: "Wormwood",
    available: () => have($effect`Absinthe-Minded`),
    unlocker: $item`tiny bottle of absinthe`,
    noInv: false,
  },
  {
    zone: "RabbitHole",
    available: () => have($effect`Down the Rabbit Hole`),
    unlocker: $item`"DRINK ME" potion`,
    noInv: false,
  },
  {
    zone: "Conspiracy Island",
    available: () => realmAvailable("spooky"),
    unlocker: $item`one-day ticket to Conspiracy Island`,
    noInv: true,
  },
  {
    zone: "Dinseylandfill",
    available: () => realmAvailable("stench"),
    unlocker: $item`one-day ticket to Dinseylandfill`,
    noInv: true,
  },
  {
    zone: "The Glaciest",
    available: () => realmAvailable("cold"),
    unlocker: $item`one-day ticket to The Glaciest`,
    noInv: true,
  },
  {
    zone: "Spring Break Beach",
    available: () => realmAvailable("sleaze"),
    unlocker: $item`one-day ticket to Spring Break Beach`,
    noInv: true,
  },
];

function canAdvOrUnlock(loc: Location) {
  const underwater = loc.environment === "underwater";
  const skiplist = $locations`The Oasis, The Bubblin' Caldera, Barrrney's Barrr, The F'c'le, The Poop Deck, Belowdecks, 8-Bit Realm, Madness Bakery, The Secret Government Laboratory, The Dire Warren`;
  if (!have($item`repaid diaper`) && have($item`Great Wolf's beastly trousers`)) {
    skiplist.push($location`The Icy Peak`);
  }
  const canAdvHack = loc === $location`The Upper Chamber` && questStep("questL11Pyramid") === -1; // (hopefully) temporary fix for canadv bug that results in infinite loop
  const canUnlock = UnlockableZones.some((z) => loc.zone === z.zone && (z.available() || !z.noInv));
  return !underwater && !skiplist.includes(loc) && !canAdvHack && (canAdv(loc, false) || canUnlock);
}

function unlock(loc: Location) {
  const unlockableZone = UnlockableZones.find((z) => z.zone === loc.zone);
  if (!unlockableZone) return canAdv(loc, false);
  if (unlockableZone.available()) return true;
  if (buy(1, unlockableZone.unlocker, WANDERER_PRICE_THRESHOLD) === 0) return false;
  return use(unlockableZone.unlocker);
}

const backupSkiplist = $locations`The Overgrown Lot, The Skeleton Store, The Mansion of Dr. Weirdeaux`;
const wandererSkiplist = $locations`The Batrat and Ratbat Burrow, Guano Junction, The Beanbat Chamber, A-Boo Peak`;
function canWander(location: Location, type: DraggableFight) {
  if (type === "backup") {
    return !backupSkiplist.includes(location) && location.combatPercent >= 100;
  } else if (type === "wanderer") {
    return !wandererSkiplist.includes(location) && location.wanderers;
  }
  return false;
}

function wandererTurnsAvailableToday(zone: Location) {
  return (
    (canWander(zone, "wanderer")
      ? digitizedMonstersRemaining() +
        (have($item`"I Voted!" sticker`) ? clamp(3 - get("_voteFreeFights"), 0, 3) : 0) +
        (have($item`cursed magnifying glass`) ? clamp(5 - get("_voidFreeFights"), 0, 5) : 0)
      : 0) +
    (canWander(zone, "backup") && have($item`backup camera`)
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

function guzzlrAbandonQuest() {
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

const wandererTargets = [
  new WandererTarget(
    "Guzzlr",
    () => Guzzlr.have(),
    () => Guzzlr.getLocation(),
    () => {
      const tier = Guzzlr.getTier();
      const progressPerTurn = 100 / (10 - get("_guzzlrDeliveries"));
      if (tier) {
        const buckValue = garboValue($item`Guzzlrbuck`);
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
      if (Guzzlr.isQuestActive()) guzzlrAbandonQuest();
      while (!Guzzlr.isQuestActive()) {
        print("Picking a guzzlr quest");
        if (
          Guzzlr.canPlatinum() &&
          !(get("garbo_prioritizeCappingGuzzlr", false) && Guzzlr.haveFullPlatinumBonus())
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
        guzzlrAbandonQuest();
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
  // Elemental Airport Currency drops.
  // TODO: Unknown drop rate, using 5% from a quick log search
  // The wiki appears to be wrong about the max coinspiracy drops
  // No reason to do fun funds as we're spending turns in barf
  new WandererTarget(
    "Wal-Mart",
    () => realmAvailable("cold") && get("lovebugsUnlocked"),
    () => $location`VYKEA`,
    () => garboValue($item`Wal-Mart gift certificate`) * 0.05
  ),
  new WandererTarget(
    "Beach Buck",
    () => realmAvailable("sleaze") && get("lovebugsUnlocked"),
    () => $location`The Fun-Guy Mansion`,
    () => garboValue($item`Beach Buck`) * 0.05
  ),
  new WandererTarget(
    "Coinspiracy",
    () => realmAvailable("spooky") && get("lovebugsUnlocked"),
    () => $location`The Deep Dark Jungle`,
    () => garboValue($item`Coinspiracy`) * 0.05
  ),
  // Default wanderer zone
  new WandererTarget(
    "Default",
    () => true, // can always do default
    () => $location`The Haunted Kitchen`,
    () => 1 // slightly lower value
  ),
];

export function determineDraggableZoneAndEnsureAccess(type: DraggableFight = "wanderer"): Location {
  const sortedTargets = wandererTargets
    .filter((target: WandererTarget) => target.available() && target.prepareWanderer())
    .map((target: WandererTarget) => target.computeCachedValue())
    .sort((a, b) => b.value - a.value);

  const best = sortedTargets.find((prospect) => {
    const location = prospect.target.location();
    print(`Trying to place a wanderer using ${prospect.target.name}`, HIGHLIGHT);
    return (
      location &&
      canWander(location, type) &&
      canAdvOrUnlock(location) &&
      unlock(location) &&
      prospect.target.prepareTurn()
    );
  }) || { target: wandererTargets[wandererTargets.length - 1], value: 1 };

  const location = best.target.location() || $location`The Haunted Kitchen`;
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
  [$location`A Mob of Zeppelin Protesters`, { [1432]: 1, [857]: 2 }],
  [$location`A-Boo Peak`, { [1430]: 2 }],
  [$location`Sloppy Seconds Diner`, { [919]: 6 }],
  [$location`VYKEA`, { [1115]: 6 }],
  [
    $location`The Castle in the Clouds in the Sky (Basement)`,
    {
      [670]: 4,
      [671]: 4,
      [672]: 1,
    },
  ],
  [$location`The Copperhead Club`, { [855]: 4 }],
]);
