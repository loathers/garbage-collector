import { OutfitSpec } from "grimoire-kolmafia";
import {
  Effect,
  effectFact,
  equippedItem,
  getMonsters,
  isBanished,
  itemType,
  Location,
  mallPrice,
  Monster,
  myBuffedstat,
  Phylum,
} from "kolmafia";
import { GarboStrategy } from "./combatStrategy";
import {
  $effect,
  $effects,
  $item,
  $items,
  $location,
  $monster,
  $monsters,
  $skill,
  $slot,
  $stat,
  adventureTargetToWeightedMap,
  Delayed,
  get,
  have,
  NumericModifier,
  PulledTaffy,
  sum,
  undelay,
} from "libram";
import { Macro } from "./combat";
import { FarmingMethod, globalOptions } from "./config";
import { completeBarfQuest } from "./resources/realm";
import { FarmingContext } from "./tasks/context";
import { garboValue } from "./garboValue";
import { expectedDropValue, songboomMeat } from "./lib";

export function averageRedTaffyValue(): number {
  return sum(
    [...PulledTaffy.RED_TAFFY_DROP_WEIGHTS.entries()],
    ([item, weight]) => garboValue(item) * weight,
  );
}

export function redTaffyWorth(): boolean {
  return mallPrice($item`pulled red taffy`) < averageRedTaffyValue();
}

const olfactionCopies = have($skill`Transcendent Olfaction`) ? 3 : 0;
const gallapagosCopies = have($skill`Gallapagosian Mating Call`) ? 1 : 0;
const garbageTourists = 1 + olfactionCopies + gallapagosCopies,
  touristFamilies = 1,
  angryTourists = 1;
const barfTourists = garbageTourists + touristFamilies + angryTourists;
export const garbageTouristRatio = garbageTourists / barfTourists;
const touristFamilyRatio = touristFamilies / barfTourists;

// Uses the same olfaction/mating code as the barf NC
// TODO: Make a queue-aware predictor in libram or expose it in mafia somehow
export function expectedBarfMonsterRates(
  target: Monster,
): Map<Monster, number> {
  return new Map(
    $monsters`angry tourist, garbage tourist, horrible tourist family`.map(
      (monster) => [
        monster,
        (1 + (monster === target ? olfactionCopies + gallapagosCopies : 0)) /
          barfTourists,
      ],
    ),
  );
}

// 30 tourists till NC, with families counting as 3
// Estimate number of turns till the counter hits 27
// then estimate the expected number of turns required to hit a counter of >= 30

interface FarmingStrategyOptions {
  stasisRounds: number;
  asdonEffect: Effect;
  ensureBarfAccess: boolean;
  meatDrop: number;
  location: Location;
  targetMonster: Delayed<Monster>;
  shouldOlfact: boolean;
  combat: (context: FarmingContext) => Macro;
  // These all need a default
  available?: boolean;
  outfit?: (context: FarmingContext) => OutfitSpec;
  ncTurns?: Delayed<number>;
  bonusEffects?: Effect[];
  bonusModifiers?: NumericModifier[];
  banishMonsters?: Monster[];
  post?: () => void;
}

const DEFAULT_OPTIONS: Readonly<{
  [K in keyof FarmingStrategyOptions as undefined extends FarmingStrategyOptions[K]
    ? K
    : never]-?: FarmingStrategyOptions[K];
}> = {
  bonusEffects: [] as Effect[],
  bonusModifiers: [] as NumericModifier[],
  banishMonsters: [] as Monster[],
  ncTurns: Infinity,
  post: () => {},
  available: true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  outfit: (_context: FarmingContext): OutfitSpec => ({}),
} as const;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unsafe-declaration-merging
interface FarmingStrategySkeleton extends Required<FarmingStrategyOptions> {}
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class FarmingStrategySkeleton {
  isUnderwater(): boolean {
    return this.location.environment === "underwater";
  }

  accountForNC(): boolean {
    return this.ncTurns !== Infinity;
  }

  baseMeat(): number {
    return this.meatDrop + songboomMeat();
  }

  primaryMonster(): Monster {
    return undelay(this.targetMonster);
  }

  olfactMonster(): Monster | null {
    return this.shouldOlfact ? undelay(this.targetMonster) : null;
  }

  singlePhylumInZone(): Phylum | null {
    const monsters = this.monsters().filter(
      (m) => !this.banishMonsters.includes(m),
    );

    const phyla = new Set(monsters.map((m) => m.phylum));

    return phyla.size === 1 ? monsters[0].phylum : null;
  }

  monsters(): Monster[] {
    return getMonsters(this.location);
  }

  turnsToNC(): number {
    return undelay(this.ncTurns);
  }

  ncAdjustment(): number {
    if (!this.accountForNC()) return 1;
    return this.turnsToNC() / (1 + this.turnsToNC());
  }

  itemDropValue(): number {
    return (
      sum(
        [...adventureTargetToWeightedMap(this.location).entries()],
        ([monster, monsterWeight]) =>
          monsterWeight * expectedDropValue(monster),
      ) / 100
    );
  }

  meatDropValue(): number {
    return this.baseMeat() / 100;
  }

  valuableModifiers(): NumericModifier[] {
    return [
      "Meat Drop",
      "Familiar Weight",
      "Smithsness",
      "Item Drop",
      ...this.bonusModifiers,
      ...(this.isUnderwater()
        ? (["Hidden Familiar Weight", "Meat Drop Penalty"] as const)
        : []),
    ];
  }

  monstersToBanish(): Monster[] {
    return this.banishMonsters.filter((m) => !isBanished(m));
  }

  strategy(): GarboStrategy<FarmingContext> {
    return new GarboStrategy(this.combat);
  }
}

export const FarmingStrategy: Readonly<FarmingStrategySkeleton> = new Proxy(
  new FarmingStrategySkeleton(),
  {
    get: (target, prop) => {
      const strategyOptions = currentStrategy();
      // Rhino 1.9.1 ignores receivers; class getters cannot read proxied options.
      return Reflect.get(prop in target ? target : strategyOptions, prop);
    },
    set: () => {
      throw new TypeError("FarmingStrategy is read-only");
    },
  },
);

const BARF_MOUNTAIN: FarmingStrategyOptions = {
  stasisRounds: 20,
  asdonEffect: $effect`Driving Observantly`,
  ensureBarfAccess: true,
  meatDrop: 250,
  ncTurns: () =>
    (27 * barfTourists) /
      (garbageTourists + angryTourists + 3 * touristFamilies) +
    1 * touristFamilyRatio +
    2 * (1 - touristFamilyRatio) * touristFamilyRatio +
    3 * (1 - touristFamilyRatio) * (1 - touristFamilyRatio),
  location: $location`Barf Mountain`,
  bonusEffects: $effects`How to Scam Tourists`,
  targetMonster: () =>
    globalOptions.targetAngryTourists && get("_knuckleboneDrops", 0) < 100
      ? $monster`angry tourist`
      : $monster`garbage tourist`,
  shouldOlfact: true,

  outfit: () => ({
    equip:
      get("dinseyRollercoasterNext") && have($item`lube-shoes`)
        ? $items`lube-shoes`
        : [],
  }),

  combat: () => Macro.meatKill(),
  post: completeBarfQuest,
};

const underwaterOutfit: FarmingStrategyOptions["outfit"] = ({ banish }) =>
  banish?.equip ? { equip: [banish.equip] } : {};

const THE_CORAL_CORRAL: FarmingStrategyOptions = {
  stasisRounds: 5,
  asdonEffect: $effect`Driving Waterproofly`,
  ensureBarfAccess: false,
  meatDrop: 300,
  location: $location`The Coral Corral`,
  banishMonsters: $monsters`Mer-kin rustler, sea cowboy`,
  targetMonster: $monster`sea cow`,
  shouldOlfact: false,
  available:
    effectFact($monster`sea cow`) === $effect`Fishy` &&
    (!get("seahorseName") || get("lassoTrainingCount") >= 20),
  outfit: underwaterOutfit,
  combat: ({ banish }) =>
    Macro.externalIf(
      !get("seahorseName"),
      Macro.if_(
        $monster`wild seahorse`,
        Macro.item($item`sea cowbell`)
          .item($item`sea cowbell`)
          .item($item`sea cowbell`)
          .item($item`sea lasso`)
          .abortWithMsg("Wild seahorse should have been tamed, what happened?"),
      ),
    )
      .farmingBanish(banish)
      .externalIf(
        myBuffedstat($stat`Moxie`) < $monster`sea cow`.baseAttack + 10 ||
          (have($skill`Hero of the Half-Shell`) &&
            itemType(equippedItem($slot`offhand`)) === "shield" &&
            myBuffedstat($stat`Muscle`) < $monster`sea cow`.baseAttack + 10),
        Macro.delevel(),
      )
      .externalIf(redTaffyWorth(), Macro.tryItem($item`pulled red taffy`))
      .meatKill(),
};

const THE_MARINARA_TRENCH: FarmingStrategyOptions = {
  stasisRounds: 5,
  asdonEffect: $effect`Driving Waterproofly`,
  ensureBarfAccess: false,
  meatDrop: 300,
  location: $location`The Marinara Trench`,
  banishMonsters: $monsters`diving belle, fisherfish, Mer-kin diver`,
  targetMonster: $monster`giant squid`,
  shouldOlfact: false,
  available: effectFact($monster`giant squid`) === $effect`Fishy`,
  outfit: underwaterOutfit,
  combat: ({ banish }) =>
    Macro.farmingBanish(banish)
      .externalIf(
        myBuffedstat($stat`Moxie`) < $monster`giant squid`.baseAttack + 10 ||
          (have($skill`Hero of the Half-Shell`) &&
            itemType(equippedItem($slot`offhand`)) === "shield" &&
            myBuffedstat($stat`Muscle`) <
              $monster`giant squid`.baseAttack + 10),
        Macro.delevel(),
      )
      .externalIf(redTaffyWorth(), Macro.tryItem($item`pulled red taffy`))
      .meatKill(),
};

let cachedStrategy: Required<FarmingStrategyOptions> | undefined;
function currentStrategy(): Required<FarmingStrategyOptions> {
  if (!globalOptions.argsFilled) {
    throw new Error("FarmingStrategy accessed before Args.fill completed");
  }
  if (!cachedStrategy) {
    let strategyOptions: FarmingStrategyOptions;
    switch (globalOptions.prefs.farmingMethod) {
      case FarmingMethod.THE_CORAL_CORRAL:
        strategyOptions = THE_CORAL_CORRAL;
        break;

      case FarmingMethod.THE_MARINARA_TRENCH:
        strategyOptions = THE_MARINARA_TRENCH;
        break;

      case FarmingMethod.BARF_MOUNTAIN:
      default:
        strategyOptions = BARF_MOUNTAIN;
    }
    cachedStrategy = { ...DEFAULT_OPTIONS, ...strategyOptions };
  }
  return cachedStrategy;
}
