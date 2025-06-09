import {
  buy,
  canAdventure,
  Effect,
  effectFact,
  Item,
  itemFact,
  Location,
  Monster,
  numericFact,
  toItem,
  use,
} from "kolmafia";
import {
  $effect,
  $item,
  $items,
  $location,
  $locations,
  $monster,
  $skill,
  clamp,
  get,
  GingerBread,
  have,
  haveInCampground,
  questStep,
  realmAvailable,
  sum,
} from "libram";
import { NumericProperty } from "libram/dist/propertyTypes";

export const draggableFights = [
  "backup",
  "wanderer",
  "yellow ray",
  "freefight",
  "freerun",
] as const;
export type DraggableFight = (typeof draggableFights)[number];
export function isDraggableFight<T>(
  fight: T | string,
): fight is DraggableFight {
  return draggableFights.includes(fight as DraggableFight);
}

interface UnlockableZone {
  zone: string;
  available: () => boolean;
  unlocker: Item;
  noInv: boolean;
}

export type WandererFactoryOptions = {
  ascend: boolean;
  estimatedTurns: () => number;
  freeFightExtraValue: (loc: Location) => number;
  itemValue: (item: Item) => number;
  effectValue: (effect: Effect, duration: number) => number;
  plentifulMonsters: Monster[];
  prioritizeCappingGuzzlr: boolean;
  digitzesRemaining?: (turns: number) => number;
  valueOfAdventure?: number;
  takeTurnForProfit?: boolean;
};

export type WandererFactory = (
  type: DraggableFight,
  locationSkiplist: Location[],
  options: WandererFactoryOptions,
) => WandererTarget[];
export type WandererLocation = {
  location: Location;
  targets: WandererTarget[];
  value: number;
  peridotMonster: Monster;
};

export const UnlockableZones: UnlockableZone[] = [
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
    zone: "Rabbit Hole",
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

export function underwater(location: Location): boolean {
  return location.environment === "underwater";
}
const ILLEGAL_PARENTS = [
  "Clan Basement",
  "Psychoses",
  "PirateRealm",
  "A Monorail Station",
];
const ILLEGAL_ZONES = ["The Drip", "Suburbs"];
const canAdventureOrUnlockSkipList = [
  ...$locations`The Oasis, The Bubblin' Caldera, Barrrney's Barrr, The F'c'le, The Poop Deck, Belowdecks, The Secret Government Laboratory, The Dire Warren, Inside the Palindome, The Haiku Dungeon, An Incredibly Strange Place (Bad Trip), An Incredibly Strange Place (Mediocre Trip), An Incredibly Strange Place (Great Trip), El Vibrato Island, The Daily Dungeon, Trick-or-Treating, Seaside Megalopolis, Frat House, Through the Spacegate`,
  ...Location.all().filter(
    ({ parent, zone }) =>
      ILLEGAL_PARENTS.includes(parent) || ILLEGAL_ZONES.includes(zone),
  ),
];
export function canAdventureOrUnlock(
  loc: Location,
  includeUnlockable = true,
): boolean {
  const skiplist = [...canAdventureOrUnlockSkipList];
  if (
    !have($item`repaid diaper`) &&
    have($item`Great Wolf's beastly trousers`)
  ) {
    skiplist.push($location`The Icy Peak`);
  }

  if (
    GingerBread.minutesToNoon() === 0 ||
    GingerBread.minutesToMidnight() === 0
  ) {
    skiplist.push(...GingerBread.LOCATIONS);
  }

  const canUnlock =
    includeUnlockable &&
    UnlockableZones.some(
      (z) => loc.zone === z.zone && (z.available() || !z.noInv),
    );
  return (
    !underwater(loc) &&
    !skiplist.includes(loc) &&
    (canAdventure(loc) || canUnlock)
  );
}

export function unlock(loc: Location, value: number): boolean {
  const unlockableZone = UnlockableZones.find((z) => z.zone === loc.zone);
  if (!unlockableZone) return canAdventure(loc);
  if (unlockableZone.available()) return true;
  if (buy(1, unlockableZone.unlocker, value) === 0) return false;
  return use(unlockableZone.unlocker);
}

const backupSkiplist = $locations`The Mansion of Dr. Weirdeaux, Professor Jacking's Huge-A-Ma-Tron, Your Mushroom Garden`;

// These are locations where all non-combats have skips or lead to a combat.
const backupSafelist = $locations`The Haunted Gallery, The Haunted Ballroom, The Haunted Library, The Penultimate Fantasy Airship, Cobb's Knob Barracks, The Castle in the Clouds in the Sky (Basement), The Castle in the Clouds in the Sky (Ground Floor), The Castle in the Clouds in the Sky (Top Floor), The Haiku Dungeon, Twin Peak, A Mob of Zeppelin Protesters, The Upper Chamber, Frat House`;
// These are locations where all non-combats are skippable
const yellowRaySafelist = $locations`Madness Bakery, The Overgrown Lot, The Skeleton Store, The Haunted Gallery, The Haunted Ballroom, The Haunted Library, Cobb's Knob Barracks, The Castle in the Clouds in the Sky (Basement), The Castle in the Clouds in the Sky (Ground Floor), The Haiku Dungeon, Twin Peak, A Mob of Zeppelin Protesters, The Upper Chamber`;
function canWanderTypeBackup(location: Location): boolean {
  return (
    !backupSkiplist.includes(location) &&
    (location.combatPercent >= 100 || backupSafelist.includes(location))
  );
}

function canWanderTypeFreeFight(location: Location): boolean {
  if (
    location === $location`The Fun-Guy Mansion` &&
    get("funGuyMansionKills") >= 100
  ) {
    return false;
  }
  return (
    !backupSkiplist.includes(location) &&
    (location.combatPercent >= 100 || yellowRaySafelist.includes(location))
  );
}

const wandererSkiplist = $locations`The Smut Orc Logging Camp, The Batrat and Ratbat Burrow, Guano Junction, The Beanbat Chamber, A-Boo Peak, The Mouldering Mansion, The Rogue Windmill, The Stately Pleasure Dome, Pandamonium Slums`;
function canWanderTypeWander(location: Location): boolean {
  return !wandererSkiplist.includes(location) && location.wanderers;
}

export function canWander(location: Location, type: DraggableFight): boolean {
  if (underwater(location)) return false;
  switch (type) {
    case "backup":
    case "freerun":
      return canWanderTypeBackup(location);
    case "freefight":
    case "yellow ray":
      return canWanderTypeFreeFight(location);
    case "wanderer":
      return canWanderTypeWander(location);
  }
}

export class WandererTarget {
  name: string;
  zoneValue: number;
  monsterDropValue: number;
  location: Location;
  prepareTurn: () => boolean;
  peridotMonster: Monster;
  targetedMonsterDropType: "normal" | "forced" | "none";

  /**
   * Process for determining where to put a wanderer to extract additional value from it
   * @param name name of this wanderer - for documentation/logging purposes
   * @param location returns the location to adventure to target this; null only if something goes wrong
   * @param zoneValue the expected additional value from zone bonuses for putting a single wanderer-fight into the location for this
   * @param monsterDropValue the expected additional value from monster drops for putting a single wanderer-fight into the location for this
   * @param prepareTurn attempt to set up, spending meat and or items as necessary
   * @param peridotMonster The specific monster we will target using the Peridot of Peril, if needed
   * @param targetedMonsterDropType If we're targeting via peridot, what drop type this WanderTarget should include. "normal" for a regular fight, "forced" for guaranteed item drops
   */
  constructor(
    name: string,
    location: Location,
    zoneValue: number,
    monsterDropValue: number,
    prepareTurn: () => boolean = () => true,
    peridotMonster: Monster = $monster`none`,
    targetedMonsterDropType: "normal" | "forced" | "none" = "none",
  ) {
    this.name = name;
    this.zoneValue = zoneValue;
    this.monsterDropValue = monsterDropValue;
    this.location = location;
    this.prepareTurn = prepareTurn;
    this.peridotMonster = peridotMonster;
    this.targetedMonsterDropType = targetedMonsterDropType;
  }
}

export function defaultFactory(): WandererTarget[] {
  return [
    new WandererTarget(
      "Default",
      $location`The Haunted Kitchen`,
      0,
      0,
      undefined,
      $monster`none`,
    ),
  ];
}

type WanderingSource = {
  name: string;
  item: Item;
  max: number;
  property: NumericProperty;
  type: DraggableFight;
};
const WanderingSources: WanderingSource[] = [
  {
    name: "CMG",
    item: $item`cursed magnifying glass`,
    max: 3,
    property: "_voidFreeFights",
    type: "wanderer",
  },
  {
    name: "Voter",
    item: $item`"I Voted!" sticker`,
    max: 3,
    property: "_voteFreeFights",
    type: "wanderer",
  },
  {
    name: "Voter",
    item: $item`"I Voted!" sticker`,
    max: 3,
    property: "_voteFreeFights",
    type: "wanderer",
  },
  {
    name: "Backup",
    item: $item`backup camera`,
    max: 11,
    property: "_backUpUses",
    type: "backup",
  },
];

export function wandererTurnsAvailableToday(
  options: WandererFactoryOptions,
  location: Location,
  requiresMonsterKill: boolean,
): number {
  const canWanderCache: Record<DraggableFight, boolean> = {
    backup: canWander(location, "backup"),
    wanderer: canWander(location, "wanderer"),
    "yellow ray": canWander(location, "yellow ray"),
    freefight: canWander(location, "freefight"),
    freerun: canWander(location, "freerun"),
  };

  const digitize =
    canWanderCache["backup"] && options.digitzesRemaining
      ? options.digitzesRemaining(options.estimatedTurns())
      : 0;
  const pigSkinnerRay =
    canWanderCache["backup"] && have($skill`Free-For-All`)
      ? Math.floor(options.estimatedTurns() / 25)
      : 0;
  const yellowRayCooldown = have($skill`Fondeluge`) ? 50 : 100;
  const yellowRay = canWanderCache["yellow ray"]
    ? Math.floor(options.estimatedTurns() / yellowRayCooldown)
    : 0;
  const wanderers = sum(WanderingSources, (source) =>
    canWanderCache[source.type] && have(source.item)
      ? clamp(get(source.property), 0, source.max)
      : 0,
  );
  // This is the ELG cooldown for spring shoes
  const freeRun =
    !requiresMonsterKill &&
    canWanderCache["freerun"] &&
    have($item`spring shoes`)
      ? Math.floor(options.estimatedTurns() / 30)
      : 0;

  return digitize + pigSkinnerRay + yellowRay + wanderers + freeRun;
}

const LIMITED_BOFA_DROPS = $items`pocket wish, tattered scrap of paper`;
export function bofaValue(
  { plentifulMonsters, itemValue, effectValue }: WandererFactoryOptions,
  monster: Monster,
): number {
  switch (monster.factType) {
    case "item": {
      const item = itemFact(monster);
      const quantity = numericFact(monster);
      if (
        LIMITED_BOFA_DROPS.includes(item) &&
        plentifulMonsters.some((monster) => toItem(monster.fact) === item)
      ) {
        return 0;
      }
      return quantity * itemValue(item);
    }
    case "effect": {
      const effect = effectFact(monster);
      const duration = numericFact(monster);
      return effectValue(effect, duration);
    }
    case "meat": {
      return numericFact(monster);
    }
    default:
      return 0;
  }
}

function questBetween(
  quest: string,
  lower: number,
  upper: number,
  inclusive = true,
): boolean {
  const step = questStep(quest);
  return inclusive
    ? step >= lower && step <= upper
    : step > lower && step < upper;
}

const alwaysSafeUltraRares = $locations`Battlefield (No Uniform), The Icy Peak, Cobb's Knob Treasury, Cobb's Knob Menagerie\, Level 1, The Dungeons of Doom, A Mob of Zeppelin Protesters, Camp Logging Camp`;
export function getAvailableUltraRareZones(): Location[] {
  const zones = [...alwaysSafeUltraRares];

  const goingPostalSafe = !questBetween("questM11Postal", -1, 999, false); // Going Postal tracking is not especially granular

  if ($location`The Haunted Billiards Room`.turnsSpent > 0) {
    zones.push($location`The Haunted Billiards Room`); // no better check for pool cue adventure
  }
  if (questStep("questG03Ego") !== 0) {
    if (!questBetween("questG04Nemesis", 0, 2)) {
      zones.push($location`The Unquiet Garves`);
    }
    if (goingPostalSafe) zones.push($location`The VERY Unquiet Garves`);
  }
  if (
    have($item`the Slug Lord's map`) && // Quest not tracked, but certainly if you currently own the map you aren't going to get it again
    goingPostalSafe &&
    questStep("questG08Moxie") !== 0 &&
    questStep("questM02Artist") !== 0
  ) {
    zones.push($location`The Sleazy Back Alley`);
  }
  if (
    goingPostalSafe &&
    (have($item`Hey Deze map`) ||
      have($item`Hey Deze nuts`) ||
      haveInCampground($item`pagoda plans`)) // Quest not tracked, but these three checks work
  ) {
    zones.push($location`Pandamonium Slums`);
  }
  if (questBetween("questL11Palindome", 1, 5)) {
    zones.push($location`Inside the Palindome`); // Step 1 is having rearranged the photos, which means you got all the superlikelies already
  }
  if (
    goingPostalSafe &&
    $location`The Spooky Forest`.turnsSpent -
      $location`The Spooky Forest`.lastNoncombatTurnsSpent >=
      7
  ) {
    zones.push($location`The Spooky Forest`);
  }

  return zones.filter((l) => canAdventure(l));
}
