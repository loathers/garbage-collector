import { buy, canAdventure, Item, Location, use } from "kolmafia";
import { $effect, $item, $location, $locations, clamp, get, have, sum } from "libram";
import { NumericProperty } from "libram/dist/propertyTypes";
import { realmAvailable } from "../lib";
import { digitizedMonstersRemaining, estimatedTurns } from "../turns";

export type DraggableFight = "backup" | "wanderer" | "yellow ray";

interface UnlockableZone {
  zone: string;
  available: () => boolean;
  unlocker: Item;
  noInv: boolean;
}

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
const canAdventureOrUnlockSkipList = [
  ...$locations`The Oasis, The Bubblin' Caldera, Barrrney's Barrr, The F'c'le, The Poop Deck, Belowdecks, 8-Bit Realm, Madness Bakery, The Secret Government Laboratory, The Dire Warren`,
  ...Location.all().filter((l) => l.parent === "Clan Basement"),
];
export function canAdventureOrUnlock(loc: Location): boolean {
  const skiplist = [...canAdventureOrUnlockSkipList];
  if (!have($item`repaid diaper`) && have($item`Great Wolf's beastly trousers`)) {
    skiplist.push($location`The Icy Peak`);
  }
  const canUnlock = UnlockableZones.some((z) => loc.zone === z.zone && (z.available() || !z.noInv));
  return !underwater(loc) && !skiplist.includes(loc) && (canAdventure(loc) || canUnlock);
}

export function unlock(loc: Location, value: number): boolean {
  const unlockableZone = UnlockableZones.find((z) => z.zone === loc.zone);
  if (!unlockableZone) return canAdventure(loc);
  if (unlockableZone.available()) return true;
  if (buy(1, unlockableZone.unlocker, value) === 0) return false;
  return use(unlockableZone.unlocker);
}

const backupSkiplist = $locations`The Overgrown Lot, The Skeleton Store, The Mansion of Dr. Weirdeaux`;
function canWanderTypeBackup(location: Location): boolean {
  return !backupSkiplist.includes(location) && location.combatPercent >= 100;
}

function canWanderTypeYellowRay(location: Location): boolean {
  if (location === $location`The Fun-Guy Mansion` && get("funGuyMansionKills", 0) >= 100) {
    return false;
  }
  return canWanderTypeBackup(location);
}

const wandererSkiplist = $locations`The Batrat and Ratbat Burrow, Guano Junction, The Beanbat Chamber, A-Boo Peak`;
function canWanderTypeWander(location: Location): boolean {
  return !wandererSkiplist.includes(location) && location.wanderers;
}

export function canWander(location: Location, type: DraggableFight): boolean {
  if (underwater(location)) return false;
  switch (type) {
    case "backup":
      return canWanderTypeBackup(location);
    case "yellow ray":
      return canWanderTypeYellowRay(location);
    case "wanderer":
      return canWanderTypeWander(location);
  }
}

export class WandererTarget {
  name: string;
  value: number;
  location: Location;
  prepareTurn: () => boolean;

  /**
   * Process for determining where to put a wanderer to extract additional value from it
   * @param name name of this wanderer - for documentation/logging purposes
   * @param location returns the location to adventure to target this; null only if something goes wrong
   * @param value the expected additional value of putting a single wanderer-fight into the zone for this
   * @param prepareTurn attempt to set up, spending meat and or items as necessary
   */
  constructor(
    name: string,
    location: Location,
    value: number,
    prepareTurn: () => boolean = () => true
  ) {
    this.name = name;
    this.value = value;
    this.location = location;
    this.prepareTurn = prepareTurn;
  }
}
export type WandererFactory = (
  type: DraggableFight,
  locationSkiplist: Location[]
) => WandererTarget[];
export type WandererLocation = { location: Location; targets: WandererTarget[]; value: number };

export const unsupportedChoices = new Map<Location, { [choice: number]: number | string }>([
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
  [
    $location`The Haunted Bedroom`,
    {
      [876]: 1, // old leather wallet, 500 meat
      [877]: 1, // old coin purse, 500 meat
      [878]: 1, // 400-600 meat
      [879]: 2, // grouchy spirit
      [880]: 2, // a dumb 75 meat club
    },
  ],
  [$location`The Copperhead Club`, { [855]: 4 }],
  [$location`The Castle in the Clouds in the Sky (Top Floor)`, { [1431]: 1, [677]: 2 }],
  [$location`The Hidden Office Building`, { [786]: 6 }],
]);

export function defaultFactory(): WandererTarget[] {
  return [new WandererTarget("Default", $location`The Haunted Kitchen`, 0)];
}

export function maxBy<T>(array: T[], key: (t: T) => number): T {
  return array
    .map((t: T) => {
      return { t, value: key(t) };
    })
    .reduce((prev, curr) => (prev.value < curr.value ? curr : prev)).t;
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

export function wandererTurnsAvailableToday(location: Location): number {
  const canWanderCache: Record<DraggableFight, boolean> = {
    backup: canWander(location, "backup"),
    wanderer: canWander(location, "wanderer"),
    "yellow ray": canWander(location, "yellow ray"),
  };

  const digitize = canWanderCache["backup"] ? digitizedMonstersRemaining() : 0;
  const yellowRay = canWanderCache["yellow ray"] ? Math.floor(estimatedTurns() / 100) : 0;
  const wanderers = sum(WanderingSources, (source) =>
    canWanderCache[source.type] && have(source.item)
      ? clamp(get(source.property), 0, source.max)
      : 0
  );

  return digitize + yellowRay + wanderers;
}
