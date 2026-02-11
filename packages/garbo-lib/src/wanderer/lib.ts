import {
  appearanceRates,
  buy,
  canAdventure,
  Effect,
  effectFact,
  getMonsters,
  Item,
  itemFact,
  Location,
  modifierEval,
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
  $monsters,
  $skill,
  clamp,
  Delayed,
  get,
  GingerBread,
  have,
  haveInCampground,
  NumericProperty,
  questStep,
  realmAvailable,
  sum,
  undelay,
} from "libram";

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
  canRefractedGaze?: boolean;
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
  useRefractedGaze?: boolean;
  useFeesh?: boolean;
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
  "Memories",
];
const ILLEGAL_ZONES = ["The Drip", "Suburbs"];
const canAdventureOrUnlockSkipList = [
  ...$locations`The Bubblin' Caldera, Barrrney's Barrr, The F'c'le, The Poop Deck, Belowdecks, The Secret Government Laboratory, The Dire Warren, Inside the Palindome, The Haiku Dungeon, An Incredibly Strange Place (Bad Trip), An Incredibly Strange Place (Mediocre Trip), An Incredibly Strange Place (Great Trip), El Vibrato Island, The Daily Dungeon, Trick-or-Treating, Seaside Megalopolis, The Orcish Frat House, Through the Spacegate, Mt. Molehill`,
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

  if (!have($effect`Ultrahydrated`)) {
    skiplist.push($location`The Oasis`);
  }

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

  if (
    !goingPostalSafe() ||
    (!have($item`Hey Deze map`) &&
      !have($item`Hey Deze nuts`) &&
      !haveInCampground($item`pagoda plans`)) // Quest not tracked, but these three checks work
  ) {
    skiplist.push($location`Pandamonium Slums`);
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
const backupSafelist = $locations`The Haunted Gallery, The Haunted Ballroom, The Haunted Library, The Penultimate Fantasy Airship, Cobb's Knob Barracks, The Castle in the Clouds in the Sky (Basement), The Castle in the Clouds in the Sky (Ground Floor), The Castle in the Clouds in the Sky (Top Floor), The Haiku Dungeon, Twin Peak, A Mob of Zeppelin Protesters, The Upper Chamber, The Orcish Frat House`;
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

const wandererSkiplist = $locations`The Smut Orc Logging Camp, The Batrat and Ratbat Burrow, Guano Junction, The Beanbat Chamber, A-Boo Peak, The Mouldering Mansion, The Rogue Windmill, The Stately Pleasure Dome, Pandamonium Slums, Lair of the Ninja Snowmen, The Island Barracks`;
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

type WandererTargetOptions = {
  name: string;
  location: Location;
  zoneValue: number;
  monsterBonusValues?: Map<Monster, number>;
  monsterItemValues?: Map<Monster, number>;
  prepareTurn?: () => boolean;
};

export class WandererTarget {
  name: string;
  location: Location;
  zoneValue: number;
  monsterBonusValues: Map<Monster, number>;
  monsterItemValues: Map<Monster, number>;
  prepareTurn: () => boolean;

  /**
   * Process for determining where to put a wanderer to extract additional value from it
   * @param options An object containing the following  keys:
   * @param options.name name of this wanderer - for documentation/logging purposes
   * @param options.location returns the location to adventure to target this; null only if something goes wrong
   * @param options.zoneValue value of an encounter existing within a zone, regardless of which monster you fight
   * @param options.monsterBonusValues A map of monsters and their expected non-itemdrop bonus value from this wanderer for encountering it
   * @param options.monsterItemValues A map of monsters and their expected itemdrop value from this wanderer for encountering it
   * @param options.prepareTurn attempt to set up, spending meat and or items as necessary
   */
  constructor({
    name,
    location,
    zoneValue,
    monsterBonusValues = new Map<Monster, number>(),
    monsterItemValues = new Map<Monster, number>(),
    prepareTurn = () => true,
  }: WandererTargetOptions) {
    this.name = name;
    this.location = location;
    this.zoneValue = zoneValue;
    this.monsterBonusValues = monsterBonusValues;
    this.monsterItemValues = monsterItemValues;
    this.prepareTurn = prepareTurn;
  }
}

export function defaultFactory(): WandererTarget[] {
  return [
    new WandererTarget({
      name: "Default",
      location: $location`The Haunted Kitchen`,
      zoneValue: 0,
    }),
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

const goingPostalSafe = () => !questBetween("questM11Postal", -1, 999, false); // Going Postal tracking is not especially granular

const alwaysSafeUltraRares = $locations`The Cola Wars Battlefield, The Icy Peak, Cobb's Knob Treasury, Cobb's Knob Menagerie\, Level 1, The Dungeons of Doom, A Mob of Zeppelin Protesters, Camp Logging Camp`;
export function getAvailableUltraRareZones(): Location[] {
  const zones = [...alwaysSafeUltraRares];

  if ($location`The Haunted Billiards Room`.turnsSpent > 0) {
    zones.push($location`The Haunted Billiards Room`); // no better check for pool cue adventure
  }
  if (questStep("questG03Ego") !== 0) {
    if (!questBetween("questG04Nemesis", 0, 2)) {
      zones.push($location`The Unquiet Garves`);
    }
    if (goingPostalSafe()) zones.push($location`The VERY Unquiet Garves`);
  }
  if (
    have($item`the Slug Lord's map`) && // Quest not tracked, but certainly if you currently own the map you aren't going to get it again
    goingPostalSafe() &&
    questStep("questG08Moxie") !== 0 &&
    questStep("questM02Artist") !== 0
  ) {
    zones.push($location`The Sleazy Back Alley`);
  }
  if (
    goingPostalSafe() &&
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
    goingPostalSafe() &&
    $location`The Spooky Forest`.turnsSpent -
      $location`The Spooky Forest`.lastNoncombatTurnsSpent >=
      7
  ) {
    zones.push($location`The Spooky Forest`);
  }

  return zones.filter((l) => canAdventure(l));
}

const nameCollisionCache = new Map<Monster, boolean>();
export function hasNameCollision(monster: Monster): boolean {
  const cached = nameCollisionCache.get(monster);
  if (cached !== undefined) return cached;
  for (const other of Monster.all()) {
    if (other === monster) continue;
    if (other.manuelName === monster.manuelName) {
      nameCollisionCache.set(other, true);
      nameCollisionCache.set(monster, true);
      return true;
    }
  }
  nameCollisionCache.set(monster, false);
  return false;
}

// TODO These seem to be bugged peridot zones. Can remove if they get fixed.
export const unperidotableZones = $locations`A Mob of Zeppelin Protesters, The Upper Chamber, The Haunted Billiards Room`;

/**
 * Retrieve an element from a map if it exists; setting a value for the given key if it doesn't.
 * @param map The map in question.
 * @param key The key to try to retrieve from the map.
 * @param defaultValue A delayed value to assign to the key in the map if there isn't already an existing object.
 * @returns The retrieved value, which, by the end of this function, will exist in the map.
 */
export function ensureMapElement<K, V>(
  map: Map<K, V>,
  key: K,
  defaultValue: Delayed<V>,
): V {
  const current = map.get(key);
  if (map.has(key)) return current as V;
  const value = undelay(defaultValue);
  map.set(key, value);
  return value;
}

/**
 * Add the values of a numeric-valued map to another with the same key type, mutating the first map.
 * @param left The "left" addend map. This map will be mutated by this function.
 * @param right The "right" addend map, to be added to the left.
 */
export function addMaps<K>(left: Map<K, number>, right: Map<K, number>): void {
  for (const [key, value] of right) {
    const current = left.get(key) ?? 0;
    left.set(key, current + value);
  }
}

const BAD_ATTRIBUTES = ["LUCKY", "ULTRARARE", "BOSS"];
export function availableMonsters(location: Location): Monster[] {
  appearanceRates(location, true); // Force a recalculation
  const rates = appearanceRates(location);
  return getMonsters(location).filter(
    (m) =>
      !BAD_ATTRIBUTES.some((attribute) => m.attributes.includes(attribute)) &&
      rates[m.name] > 0,
  );
}

export const UNPERIDOTABLE_MONSTERS = new Set([
  ...(modifierEval("G") < 4 ? $monsters`alielf, cat-alien, dog-alien` : []),
  ...$monsters`Arizona bark scorpion, swimming pool monster`,
]);

export function averageMonsterValue(
  monsterValues: Map<Monster, number>,
  rates: { [monster: string]: number },
): number {
  return sum(
    [...monsterValues.entries()],
    ([monster, value]) => value * (rates[monster.name] / 100),
  );
}
