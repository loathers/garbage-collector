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
} from "kolmafia";
import { GarboStrategy } from "./combatStrategy";
import {
  $effect,
  $effects,
  $familiar,
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

export const FarmingStrategy = new Proxy(new FarmingStrategySkeleton(), {
  get: (target, prop, receiver) => {
    if (
      Object.prototype.hasOwnProperty.call(
        FarmingStrategySkeleton.prototype,
        prop,
      )
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const method = (FarmingStrategySkeleton.prototype as any)[prop];
      method.bind(receiver);
    }

    const strategyOptions = currentStrategy();

    const stringProp = String(prop);
    if (stringProp in strategyOptions) {
      return strategyOptions[stringProp as keyof FarmingStrategyOptions];
    }
    if (stringProp in DEFAULT_OPTIONS) {
      return DEFAULT_OPTIONS[stringProp as keyof typeof DEFAULT_OPTIONS];
    }
    // Fallback to standard target resolution
    return Reflect.get(target, prop, receiver);
  },
});

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
    have($familiar`Skeleton of Crimbo Past`) &&
    get("_knuckleboneDrops", 0) < 100
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

function currentStrategy(): FarmingStrategyOptions {
  switch (globalOptions.prefs.farmingMethod) {
    case FarmingMethod.THE_CORAL_CORRAL:
      return THE_CORAL_CORRAL;

    case FarmingMethod.THE_MARINARA_TRENCH:
      return THE_MARINARA_TRENCH;

    case FarmingMethod.BARF_MOUNTAIN:
    default:
      return BARF_MOUNTAIN;
  }
}
