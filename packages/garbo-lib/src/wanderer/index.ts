import {
  appearanceRates,
  Familiar,
  inebrietyLimit,
  isDarkMode,
  Item,
  Location,
  Monster,
  myFamiliar,
  myInebriety,
  myTotalTurnsSpent,
  print,
  totalTurnsPlayed,
} from "kolmafia";
import {
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  Delayed,
  get,
  getActiveEffects,
  maxBy,
  PeridotOfPeril,
  sum,
  undelay,
} from "libram";
import { guzzlrFactory } from "./guzzlr";
import {
  addMaps,
  canAdventureOrUnlock,
  canWander,
  defaultFactory,
  DraggableFight,
  ensureMapElement,
  isDraggableFight,
  unlock,
  UNPERIDOTABLE_MONSTERS,
  unperidotableZones,
  WandererFactory,
  WandererFactoryOptions,
  WandererLocation,
  WandererTarget,
} from "./lib";
import { lovebugsFactory } from "./lovebugs";
import { itemDropFactory } from "./itemdrop";
import { eightbitFactory } from "./eightbit";
import { gingerbreadFactory } from "./gingerbreadcity";
import { ultraRareFactory } from "./ultrarare";
import { cookbookbatQuestFactory } from "./cookbookbatquest";
import { bofaFactory } from "./bofa";

export type { DraggableFight };

function sober(): boolean {
  return (
    myInebriety() <=
    inebrietyLimit() + (myFamiliar() === $familiar`Stooper` ? -1 : 0)
  );
}

const wanderFactories: WandererFactory[] = [
  defaultFactory,
  itemDropFactory,
  lovebugsFactory,
  guzzlrFactory,
  eightbitFactory,
  gingerbreadFactory,
  ultraRareFactory,
  cookbookbatQuestFactory,
  bofaFactory,
];

function zoneAverageMonsterValue(
  location: Location,
  monsterValues: Map<Monster, number>,
): number {
  const rates = appearanceRates(location, true);
  return sum([...monsterValues.entries()], ([monster, value]) => {
    const rate = rates[monster.name] / 100;
    return value * rate;
  });
}

function targetedMonsterValue(
  monsterValues: Map<Monster, number>,
): [Monster, number] {
  const availableMonsters = [...monsterValues.entries()].filter(
    ([m]) => !UNPERIDOTABLE_MONSTERS.has(m),
  );
  if (availableMonsters.length === 0) return [$monster.none, 0];
  return maxBy(availableMonsters, 1);
}

type ZoneData = {
  location: Location;
  targets: WandererTarget[];
  zoneValue: number;
  monsterValues: Map<Monster, number>;
};

function updateZoneData(zoneData: ZoneData, wanderer: WandererTarget) {
  zoneData.targets.push(wanderer);
  addMaps(zoneData.monsterValues, wanderer.monsterValues);
  zoneData.zoneValue += wanderer.zoneValue;
}

function bestWander(
  type: DraggableFight,
  locationSkiplist: Location[],
  nameSkiplist: string[],
  options: WandererFactoryOptions,
): WandererLocation {
  const locationValues = new Map<Location, ZoneData>();

  // Create data for zone/monster values from all factories
  for (const wanderFactory of wanderFactories) {
    const wanderTargets = wanderFactory(type, locationSkiplist, options);
    for (const wanderTarget of wanderTargets) {
      if (
        !nameSkiplist.includes(wanderTarget.name) &&
        !locationSkiplist.includes(wanderTarget.location) &&
        canWander(wanderTarget.location, type)
      ) {
        const { location } = wanderTarget;

        // Retrieve existing data for location if extant
        const zoneData = ensureMapElement(locationValues, location, {
          location,
          targets: [],
          zoneValue: 0,
          monsterValues: new Map<Monster, number>(),
        });
        updateZoneData(zoneData, wanderTarget);
      }
    }
  }

  // Determine combined values, and whether best forced target is better than the best average location drops
  const locationMonsterValues = new Map<Location, WandererLocation>();
  for (const [
    location,
    { targets, zoneValue, monsterValues },
  ] of locationValues) {
    const monsterAverageValue = zoneAverageMonsterValue(
      location,
      monsterValues,
    );
    const [bestMonster, monsterTargetedValue] =
      targetedMonsterValue(monsterValues);

    const shouldPeridot =
      PeridotOfPeril.canImperil(location) &&
      !unperidotableZones.includes(location) &&
      monsterTargetedValue > monsterAverageValue;
    const [monster, monsterValue] = shouldPeridot
      ? [bestMonster, monsterTargetedValue]
      : [$monster.none, monsterAverageValue];

    locationMonsterValues.set(location, {
      location,
      targets,
      peridotMonster: monster,
      value: zoneValue + monsterValue,
    });
  }

  if (locationMonsterValues.size === 0) {
    throw "Could not determine a wander target!";
  }

  return maxBy([...locationMonsterValues.values()], "value");
}

/**
 * Recursively Check for zones to wander to
 * @param type type of fight we are looking for
 * @param nameSkiplist Any wanderer tasks that should be skipped because they could not be prepared
 * @param locationSkiplist Any locations that should be skipped because they could not be unlocked
 * @returns A location at which to wander
 */
function wanderWhere(
  options: WandererFactoryOptions,
  type: DraggableFight,
  nameSkiplist: string[] = [],
  locationSkiplist: Location[] = [],
): WanderResult {
  const candidate = bestWander(type, locationSkiplist, nameSkiplist, options);
  const failed = candidate.targets.filter((target) => !target.prepareTurn());

  const badLocation =
    !canAdventureOrUnlock(candidate.location) ||
    !unlock(candidate.location, candidate.value) ||
    !canWander(candidate.location, type)
      ? [candidate.location]
      : [];

  if (failed.length > 0 || badLocation.length > 0) {
    return wanderWhere(
      options,
      type,
      [...nameSkiplist, ...failed.map((target) => target.name)],
      [...locationSkiplist, ...badLocation],
    );
  } else {
    const targets = candidate.targets.map((t) => t.name).join("; ");
    const value = candidate.value.toFixed(2);
    const peridotPrintText =
      candidate.peridotMonster !== $monster.none
        ? `, forcing ${candidate.peridotMonster.name},`
        : "";
    print(
      `Wandering at ${candidate.location}${peridotPrintText} for expected value ${value} (${targets})`,
      isDarkMode() ? "yellow" : "blue",
    );

    return {
      location: candidate.location,
      peridotMonster: candidate.peridotMonster,
      familiar: candidate.targets.find((t) => t.name.includes(`Cookbookbat`))
        ? $familiar`Cookbookbat`
        : $familiar`none`,
    };
  }
}
export type WanderOptions = {
  wanderer: DraggableFight;
  drunkSafe?: boolean;
  allowEquipment?: boolean;
};

export type WanderDetails = DraggableFight | WanderOptions;

export type WanderResult = {
  location: Location;
  peridotMonster: Monster;
  familiar: Familiar;
};

export class WandererManager {
  private unsupportedChoices = new Map<
    Location,
    Delayed<
      { [choice: number]: number | string },
      [options: WandererFactoryOptions, valueOfTurn: number]
    >
  >([
    [$location`The Spooky Forest`, { 502: 2, 505: 2 }],
    [$location`Guano Junction`, { 1427: 1 }],
    [$location`The Hidden Apartment Building`, { 780: 6, 1578: 6 }],
    [$location`The Black Forest`, { 923: 1, 924: 1 }],
    [$location`LavaCo™ Lamp Factory`, { 1091: 9 }],
    [$location`The Haunted Laboratory`, { 884: 6 }],
    [$location`The Haunted Nursery`, { 885: 6 }],
    [$location`The Haunted Storage Room`, { 886: 6 }],
    [
      $location`The Haunted Ballroom`,
      // Skip, and Choose currently playing song, or skip
      () => ({ 90: 3, 106: get("lastQuartetRequest") || 4 }),
    ],
    [$location`The Haunted Library`, { 163: 4, 888: 5, 889: 5 }],
    [$location`The Haunted Gallery`, { 89: 6, 91: 2 }],
    [$location`The Hidden Park`, { 789: 6 }],
    [
      $location`A Mob of Zeppelin Protesters`,
      { 1432: 1, 856: 2, 857: 3, 858: 2 },
    ],
    [$location`A-Boo Peak`, { 1430: 2 }],
    [$location`Sloppy Seconds Diner`, { 919: 6 }],
    [$location`VYKEA`, { 1115: 6 }],
    [
      $location`The Ice Hotel`,
      (options, valueOfTurn) => {
        const valueOfCertificates = get("_iceHotelRoomsRaided")
          ? 0
          : options.itemValue($item`Wal-Mart gift certificate`) * 3;
        return { 1116: valueOfCertificates > valueOfTurn ? 5 : 6 };
      },
    ],
    [
      $location`The Castle in the Clouds in the Sky (Basement)`,
      {
        669: 1,
        670: 4,
        671: 4,
      },
    ],
    [
      $location`The Haunted Bedroom`,
      {
        876: 1, // old leather wallet, 500 meat
        877: 1, // old coin purse, 500 meat
        878: 1, // 400-600 meat
        879: 2, // grouchy spirit
        880: 2, // a dumb 75 meat club
      },
    ],
    [$location`The Copperhead Club`, { 855: 4 }],
    [$location`The Haunted Bathroom`, { 882: 2 }], // skip; it's the towel adventure but we don't want towels
    [
      $location`The Castle in the Clouds in the Sky (Top Floor)`,
      {
        1431: 1,
        675: 4, // Go to Steampunk choice
        676: 4, // Go to Punk Rock choice
        677: 1, // Fight Steam Punk Giant
        678: 3, // Go to Steampunk choice
      },
    ],
    [
      $location`The Castle in the Clouds in the Sky (Ground Floor)`,
      {
        672: 3, // Skip
        673: 3, // Skip
        674: 3, // Skip
        1026: 3, // Skip
      },
    ],
    [$location`The Hidden Office Building`, { 786: 6 }],
    [$location`The Hidden Temple`, { 581: 3 }], // Fight clan of cave bars
    [$location`Cobb's Knob Barracks`, { 522: 2 }], // skip
    [$location`The Penultimate Fantasy Airship`, { 178: 2, 182: 1 }], // Skip, and Fight random enemy
    [$location`The Haiku Dungeon`, { 297: 3 }], // skip
    [$location`The Orcish Frat House`, { 1425: 4 }], // fight eXtreme Sports Orcs
    [$location`Madness Bakery`, { 1061: 6 }],
    [$location`The Skeleton Store`, { 1060: 5 }],
    [$location`The Overgrown Lot`, { 1062: 7 }],
    [$location`The Haunted Billiards Room`, { 1436: 2, 875: 3 }], // Hustle away from the ghost
  ]);
  equipment = new Map<Location, Item[]>([
    ...Location.all()
      .filter((l) => l.zone === "The 8-Bit Realm")
      .map((l): [Location, Item[]] => [l, $items`continuum transfunctioner`]),
    [
      $location`Shadow Rift (The 8-Bit Realm)`,
      $items`continuum transfunctioner`,
    ],
  ]);

  cacheKey = "";
  targets: Partial<{ [x in `${DraggableFight}:${boolean}`]: WanderResult }> =
    {};
  options: WandererFactoryOptions;

  constructor(options: WandererFactoryOptions) {
    this.options = options;
  }

  getTarget(wanderer: WanderDetails): WanderResult {
    const { draggableFight, options } = isDraggableFight(wanderer)
      ? { draggableFight: wanderer, options: {} }
      : { draggableFight: wanderer.wanderer, options: wanderer };
    const { drunkSafe = true, allowEquipment = false } = options;
    const newKey = `${myTotalTurnsSpent()};${totalTurnsPlayed()};${get(
      "familiarSweat",
    )}`;
    if (this.cacheKey !== newKey) this.clear();
    this.cacheKey = newKey;

    const locationSkipList = allowEquipment ? [] : [...this.equipment.keys()];

    return sober() || !drunkSafe
      ? (this.targets[`${draggableFight}:${allowEquipment}`] ??= wanderWhere(
          this.options,
          draggableFight,
          [],
          locationSkipList,
        ))
      : {
          location: $location`Drunken Stupor`,
          peridotMonster: $monster.none,
          familiar: $familiar`none`,
        };
  }

  /**
   * Get choice map for the upcoming wander
   * @param target Description of the wander or location in which to wander
   * @param takeTurnForProfit Should the choices include any that would make a profit from your valueOfAdventure
   * @returns Map of choice numbers to decisions
   */
  getChoices(
    target: WanderDetails | Location,
    takeTurnForProfit = this.options.takeTurnForProfit,
  ): {
    [choice: number]: string | number;
  } {
    const location =
      target instanceof Location ? target : this.getTarget(target).location;
    const valueOfTurn = takeTurnForProfit
      ? (this.options.valueOfAdventure ?? 0) +
        sum(getActiveEffects(), (e) => this.options.effectValue(e, 1))
      : Infinity;
    const baseChoices = this.unsupportedChoices.get(location) ?? {};
    if (
      !(target instanceof Location) &&
      this.getTarget(target).peridotMonster !== $monster.none
    ) {
      const peridotChoice = PeridotOfPeril.getChoiceObject(
        this.getTarget(target).peridotMonster,
      );
      const newChoices = Object.assign(peridotChoice, baseChoices);
      return undelay(newChoices, this.options, valueOfTurn);
    }
    return undelay(baseChoices, this.options, valueOfTurn);
  }

  clear(): void {
    this.targets = {};
  }

  getEquipment(wanderer: WanderDetails): Item[] {
    return this.equipment.get(this.getTarget(wanderer).location) ?? [];
  }

  peridotMonster(wanderer: WanderDetails): Monster {
    return this.getTarget(wanderer).peridotMonster;
  }

  getFamiliar(wanderer: WanderDetails): Familiar {
    return this.getTarget(wanderer).familiar;
  }
}
